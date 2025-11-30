import { fillInput } from './utils.js';

const PROVIDER_ID = 'Gemini';

function matches(url) {
  return url.includes('gemini.google.com');
}

function getConversationId() {
  const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-_]+)/);
  return hashMatch ? hashMatch[1] : `gemini_${Date.now()}`;
}

function getConversationTitle() {
  const selectors = [
    '[class*="conversation-title"]',
    '[class*="chat-title"]',
    'h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      let title = element.textContent.trim();
      title = title.replace(/\s*-\s*Gemini.*$/, '').trim();
      if (title && title !== 'Gemini') {
        return title;
      }
    }
  }

  const firstUserMessage = document.querySelector('[class*="user-message"]');
  if (firstUserMessage) {
    return firstUserMessage.textContent.substring(0, 100);
  }
  return 'Untitled Conversation';
}

function detectMessageRole(element) {
  const className = (element.className || '').toLowerCase();
  const html = element.outerHTML.toLowerCase();

  if (className.includes('user') || html.includes('user-turn') || html.includes('user-message')) {
    return 'user';
  }
  if (className.includes('model') || className.includes('assistant') ||
    html.includes('model-turn') || html.includes('assistant')) {
    return 'assistant';
  }
  if (element.querySelector('[class*="model-response"]') || element.querySelector('[class*="assistant"]')) {
    return 'assistant';
  }
  if (element.querySelector('[class*="user-query"]') || element.querySelector('[class*="user-input"]')) {
    return 'user';
  }
  return null;
}

function extractMessageContent(element) {
  const contentSelectors = [
    '[class*="message-content"]',
    '[class*="response-content"]',
    '[class*="query-content"]',
    '.markdown',
    '[class*="markdown"]',
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
  const selectors = [
    '[class*="message"]',
    '[class*="turn"]',
    '[data-test-id*="message"]',
  ];

  let messageElements = [];
  for (const selector of selectors) {
    messageElements = document.querySelectorAll(selector);
    if (messageElements.length > 0) break;
  }

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
    '[contenteditable="true"]',
    'textarea[placeholder]',
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
