import { parseConversationFromDom } from '../content/dom-parser';
import { DomProviderConfig } from '../shared/models';
import { fillInput } from './utils';

const claudeConfig: DomProviderConfig = {
  id: 'Claude',
  matches: (url: string) => url.includes('claude.ai'),
  getConversationId: () => {
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  },
  getTitle: () => {
    const selectors = ['[class*="ChatTitle"]', '[class*="conversation-title"]', 'h1'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        const title = element.textContent.trim();
        if (title && title !== 'Claude') return title;
      }
    }

    const firstUserMessage = document.querySelector('[data-is-user-message="true"]');
    if (firstUserMessage?.textContent) {
      return firstUserMessage.textContent.substring(0, 100);
    }
    return 'Untitled Conversation';
  },
  messageSelectors: ['[class*="Message"]'],
  contentSelectors: [
    '[class*="MessageContent"]',
    '[class*="message-content"]',
    '.markdown',
    '[class*="markdown"]',
    'p',
  ],
  role: {
    attribute: 'data-is-user-message',
    values: {
      true: 'user',
      false: 'assistant',
    },
    classHints: {
      user: 'user',
      assistant: 'assistant',
      claude: 'assistant',
    },
    fallback: (element: Element) => {
      const avatar = element.querySelector('[class*="avatar"], [class*="icon"]');
      if (!avatar) return null;
      const avatarClass = (avatar.className || '').toString().toLowerCase();
      if (avatarClass.includes('user')) return 'user';
      if (avatarClass.includes('assistant') || avatarClass.includes('claude')) return 'assistant';
      return null;
    },
  },
  fillSelectors: [
    '[contenteditable="true"][placeholder]',
    '[contenteditable="true"]',
    'textarea',
  ],
};

export default {
  id: claudeConfig.id,
  matches: claudeConfig.matches,
  extract: () => parseConversationFromDom(claudeConfig),
  fill: (content: string) => fillInput(content, claudeConfig.fillSelectors),
};

export { claudeConfig };
