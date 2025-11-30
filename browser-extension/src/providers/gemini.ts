import { parseConversationFromDom } from '../content/dom-parser';
import { DomProviderConfig, Role } from '../shared/models';
import { fillInput } from './utils';

const geminiConfig: DomProviderConfig = {
  id: 'Gemini',
  matches: (url: string) => url.includes('gemini.google.com'),
  getConversationId: () => {
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    return hashMatch ? hashMatch[1] : `gemini_${Date.now()}`;
  },
  getTitle: () => {
    const selectors = ['[class*="conversation-title"]', '[class*="chat-title"]', 'h1'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        let title = element.textContent.trim();
        title = title.replace(/\s*-\s*Gemini.*$/, '').trim();
        if (title && title !== 'Gemini') {
          return title;
        }
      }
    }

    const firstUserMessage = document.querySelector('[class*="user-message"]');
    if (firstUserMessage?.textContent) {
      return firstUserMessage.textContent.substring(0, 100);
    }
    return 'Untitled Conversation';
  },
  messageSelectors: ['[class*="message"]', '[class*="turn"]', '[data-test-id*="message"]'],
  contentSelectors: [
    '[class*="message-content"]',
    '[class*="response-content"]',
    '[class*="query-content"]',
    '.markdown',
    '[class*="markdown"]',
  ],
  role: {
    classHints: {
      'user': 'user',
      'user-turn': 'user',
      'user-message': 'user',
      model: 'assistant',
      assistant: 'assistant',
    },
    fallback: (element: Element): Role | null => {
      if (element.querySelector('[class*="model-response"]') || element.querySelector('[class*="assistant"]')) {
        return 'assistant';
      }
      if (element.querySelector('[class*="user-query"]') || element.querySelector('[class*="user-input"]')) {
        return 'user';
      }
      return null;
    },
  },
  fillSelectors: [
    '[contenteditable="true"]',
    'textarea[placeholder]',
    'textarea',
  ],
};

export default {
  id: geminiConfig.id,
  matches: geminiConfig.matches,
  extract: () => parseConversationFromDom(geminiConfig),
  fill: (content: string) => fillInput(content, geminiConfig.fillSelectors),
};

export { geminiConfig };
