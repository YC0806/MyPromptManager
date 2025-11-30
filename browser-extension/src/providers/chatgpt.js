import { fillInput } from './utils.js';

const PROVIDER_ID = 'ChatGPT';

function getConversationId() {
  const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

function getConversationTitle() {
  const titleElement = document.querySelector('title');
  let title = titleElement ? titleElement.textContent : '';
  title = title.replace(/\s*\|\s*ChatGPT.*$/, '').trim();

  if (!title || title === 'ChatGPT') {
    const firstUserMessage = document.querySelector('[data-message-author-role="user"]');
    if (firstUserMessage) {
      title = firstUserMessage.textContent.substring(0, 100);
    } else {
      title = 'Untitled Conversation';
    }
  }

  return title;
}

function extractMessages() {
  const messages = [];
  const messageElements = document.querySelectorAll('[data-message-author-role]');

  messageElements.forEach((element, index) => {
    const role = element.getAttribute('data-message-author-role');
    const content = extractMessageContent(element);

    if (content) {
      messages.push({
        role: role === 'user' ? 'user' : 'assistant',
        content,
        timestamp: null,
        index,
      });
    }
  });

  return messages;
}

function extractMessageContent(element) {
  const contentContainer = element.querySelector('.markdown, .message-content, [class*="markdown"]');
  if (contentContainer) {
    return contentContainer.innerText || contentContainer.textContent;
  }
  return element.innerText || element.textContent;
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
  const inputSelectors = [
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[data-id="root"]',
    'textarea',
  ];
  return fillInput(content, inputSelectors);
}

function matches(url) {
  return url.includes('chat.openai.com') || url.includes('chatgpt.com');
}

export default {
  id: PROVIDER_ID,
  matches,
  extract,
  fill,
};
