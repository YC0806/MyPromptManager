import { fillInput } from './utils.js';

const PROVIDER_ID = 'Doubao';

function matches(url) {
  return url.includes('doubao.com');
}

function getConversationId() {
  const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-_]+)/);
  if (hashMatch) return hashMatch[1];
  const pathMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-_]+)/);
  if (pathMatch) return pathMatch[1];
  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('chatId') || urlParams.get('conversation_id');
  if (chatId) return chatId;
  return `doubao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getConversationTitle() {
  const selectors = [
    '[class*="conversation-title"]',
    '[class*="chat-title"]',
    '[data-testid="conversation-title"]',
    '.title',
    'h1',
    'h2',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      let title = element.textContent.trim();
      title = title.replace(/\s*-\s*豆包.*$/, '').trim();
      if (title && title !== '豆包' && title.length > 0) {
        return title;
      }
    }
  }

  const docTitle = document.title.replace(/\s*-\s*豆包.*$/, '').trim();
  if (docTitle && docTitle !== '豆包') {
    return docTitle;
  }

  const firstUserMessage = extractFirstUserMessage();
  if (firstUserMessage) {
    return firstUserMessage.substring(0, 100);
  }
  return 'Untitled Conversation';
}

function extractFirstUserMessage() {
  const messageElements = document.querySelectorAll('[class*="message"], [class*="chat-item"]');
  for (const element of messageElements) {
    const role = detectMessageRole(element);
    if (role === 'user') {
      const content = extractMessageContent(element);
      if (content) return content;
    }
  }
  return null;
}

function detectMessageRole(element) {
  const dataRole = element.getAttribute('data-role');
  if (dataRole) {
    if (dataRole.toLowerCase().includes('user')) return 'user';
    if (dataRole.toLowerCase().includes('assistant') || dataRole.toLowerCase().includes('bot')) return 'assistant';
  }

  const className = (element.className || '').toLowerCase();
  if (className.includes('user-message') || className.includes('user')) {
    return 'user';
  }
  if (className.includes('assistant') || className.includes('bot') || className.includes('ai')) {
    return 'assistant';
  }

  const avatar = element.querySelector('[class*="avatar"], [class*="icon"], img');
  if (avatar) {
    const avatarClass = (avatar.className || '').toLowerCase();
    const avatarSrc = (avatar.src || '').toLowerCase();
    const avatarAlt = (avatar.alt || '').toLowerCase();
    if (avatarClass.includes('user') || avatarSrc.includes('user') || avatarAlt.includes('user')) return 'user';
    if (avatarClass.includes('bot') || avatarClass.includes('ai') ||
      avatarSrc.includes('bot') || avatarSrc.includes('ai') ||
      avatarAlt.includes('豆包') || avatarAlt.includes('bot')) {
      return 'assistant';
    }
  }

  const parent = element.parentElement;
  if (parent) {
    const parentClass = (parent.className || '').toLowerCase();
    if (parentClass.includes('user')) return 'user';
    if (parentClass.includes('assistant') || parentClass.includes('bot')) return 'assistant';
  }

  const style = window.getComputedStyle(element);
  const textAlign = style.textAlign;
  const justifyContent = style.justifyContent;
  if (textAlign === 'right' || justifyContent === 'flex-end') return 'user';
  if (textAlign === 'left' || justifyContent === 'flex-start') return 'assistant';

  return null;
}

function extractMessageContent(element) {
  const contentSelectors = [
    '[class*="message-content"]',
    '[class*="content"]',
    '[class*="text"]',
    '.markdown',
    '[class*="markdown"]',
    'p',
    'div[class*="body"]',
  ];

  for (const selector of contentSelectors) {
    const contentElement = element.querySelector(selector);
    if (contentElement && contentElement.textContent?.trim()) {
      return contentElement.innerText || contentElement.textContent;
    }
  }

  const clone = element.cloneNode(true);
  const uiSelectors = [
    '[class*="button"]',
    '[class*="icon"]',
    '[class*="avatar"]',
    '[class*="toolbar"]',
    '[class*="action"]',
    'button',
    'svg',
  ];
  uiSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });
  const text = (clone.innerText || clone.textContent || '').trim();
  return text.length > 0 ? text : null;
}

function extractTimestamp(element) {
  const timeSelectors = [
    '[class*="time"]',
    '[class*="timestamp"]',
    'time',
    '[datetime]',
  ];

  for (const selector of timeSelectors) {
    const timeElement = element.querySelector(selector);
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime') || timeElement.textContent;
      if (datetime) return datetime;
    }
  }
  return null;
}

function extractMessages() {
  const messages = [];
  const selectors = [
    '[class*="message-item"]',
    '[class*="chat-message"]',
    '[class*="dialog-item"]',
    '[data-role]',
    '.message',
  ];

  let messageElements = [];
  for (const selector of selectors) {
    messageElements = document.querySelectorAll(selector);
    if (messageElements.length > 0) break;
  }

  if (messageElements.length === 0) {
    const allDivs = document.querySelectorAll('div[class*="message"], div[class*="chat"]');
    messageElements = Array.from(allDivs).filter((el) => {
      const text = el.textContent?.trim() || '';
      return text.length > 10 && text.length < 10000;
    });
  }

  messageElements.forEach((element, index) => {
    const role = detectMessageRole(element);
    const content = extractMessageContent(element);

    if (content && role) {
      messages.push({
        role,
        content,
        timestamp: extractTimestamp(element),
        index,
      });
    }
  });

  return messages;
}

async function extract() {
  const conversationId = getConversationId();
  if (!conversationId) {
    throw new Error('无法获取对话 ID');
  }

  const title = getConversationTitle();
  const messages = extractMessages();

  if (messages.length === 0) {
    throw new Error('未找到对话消息');
  }

  return {
    provider: PROVIDER_ID,
    conversationId,
    title,
    messages,
    model: 'Doubao',
    metadata: {
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      messageCount: messages.length,
    },
  };
}

function fill(content) {
  const selectors = [
    'textarea[placeholder*="输入"]',
    'textarea[placeholder*="问"]',
    '[contenteditable="true"][placeholder*="输入"]',
    '[contenteditable="true"][placeholder*="问"]',
    'textarea',
    '[contenteditable="true"]',
    'input[type="text"]',
  ];
  return fillInput(content, selectors);
}

export default {
  id: PROVIDER_ID,
  matches,
  extract,
  fill,
};
