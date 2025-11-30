import { parseConversationFromDom } from '../content/dom-parser';
import { DomProviderConfig } from '../shared/models';
import { fillInput } from './utils';

const chatgptConfig: DomProviderConfig = {
  id: 'ChatGPT',
  matches: (url: string) => url.includes('chat.openai.com') || url.includes('chatgpt.com'),
  getConversationId: () => {
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  },
  getTitle: () => {
    const titleElement = document.querySelector('title');
    let title = titleElement ? titleElement.textContent || '' : '';
    title = title.replace(/\s*\|\s*ChatGPT.*$/, '').trim();

    if (!title || title === 'ChatGPT') {
      const firstUserMessage = document.querySelector('[data-message-author-role="user"]');
      if (firstUserMessage?.textContent) {
        title = firstUserMessage.textContent.substring(0, 100);
      } else {
        title = 'Untitled Conversation';
      }
    }

    return title;
  },
  messageSelectors: ['[data-message-author-role]'],
  contentSelectors: ['.markdown', '.message-content', '[class*="markdown"]'],
  role: {
    attribute: 'data-message-author-role',
    values: {
      user: 'user',
      assistant: 'assistant',
    },
  },
  fillSelectors: [
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[data-id="root"]',
    'textarea',
  ],
};

export default {
  id: chatgptConfig.id,
  matches: chatgptConfig.matches,
  extract: () => parseConversationFromDom(chatgptConfig),
  fill: (content: string) => fillInput(content, chatgptConfig.fillSelectors),
};

export { chatgptConfig };
