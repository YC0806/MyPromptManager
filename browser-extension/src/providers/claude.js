import { fillInput } from './utils.js';

const PROVIDER_ID = 'Claude';

function matches(url) {
  return url.includes('claude.ai');
}

function getConversationId() {
  const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

function getConversationTitle() {
  const selectors = [
    '[class*="ChatTitle"]',
    '[class*="conversation-title"]',
    'h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const title = element.textContent.trim();
      if (title && title !== 'Claude') return title;
    }
  }

  const firstUserMessage = document.querySelector('[data-is-user-message="true"]');
  if (firstUserMessage) {
    return firstUserMessage.textContent.substring(0, 100);
  }
  return 'Untitled Conversation';
}

function detectMessageRole(element) {
  if (element.hasAttribute('data-is-user-message')) {
    return element.getAttribute('data-is-user-message') === 'true' ? 'user' : 'assistant';
  }

  const className = (element.className || '').toLowerCase();
  if (className.includes('user')) return 'user';
  if (className.includes('assistant') || className.includes('claude')) return 'assistant';

  const avatar = element.querySelector('[class*="avatar"], [class*="icon"]');
  if (avatar) {
    const avatarClass = (avatar.className || '').toLowerCase();
    if (avatarClass.includes('user')) return 'user';
    if (avatarClass.includes('assistant') || avatarClass.includes('claude')) return 'assistant';
  }

  return null;
}

function extractMessageContent(element) {
  const contentSelectors = [
    '[class*="MessageContent"]',
    '[class*="message-content"]',
    '.markdown',
    '[class*="markdown"]',
    'p',
  ];

  for (const selector of contentSelectors) {
    const contentElement = element.querySelector(selector);
    if (contentElement) {
      return contentElement.innerText || contentElement.textContent;
    }
  }
  return element.innerText || element.textContent;
}

function extractMessages() {
  const messages = [];
  const messageElements = document.querySelectorAll('[class*="Message"]');

  messageElements.forEach((element, index) => {
    const role = detectMessageRole(element);
    const content = extractMessageContent(element);

    if (content && role) {
      messages.push({
        role,
        content,
        timestamp: null,
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
    metadata: {
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      messageCount: messages.length,
    },
  };
}

function fill(content) {
  const selectors = [
    '[contenteditable="true"][placeholder]',
    '[contenteditable="true"]',
    'textarea',
  ];
  return fillInput(content, selectors);
}

export default {
  id: PROVIDER_ID,
  matches,
  extract,
  fill,
};
