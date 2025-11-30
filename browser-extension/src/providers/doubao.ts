import { parseConversationFromDom } from '../content/dom-parser';
import { DomProviderConfig, Role } from '../shared/models';
import { fillInput } from './utils';

function detectDoubaoRole(element: Element): Role | null {
  const dataRole = element.getAttribute('data-role');
  if (dataRole) {
    const lowered = dataRole.toLowerCase();
    if (lowered.includes('user')) return 'user';
    if (lowered.includes('assistant') || lowered.includes('bot')) return 'assistant';
  }

  const className = (element.className || '').toString().toLowerCase();
  if (className.includes('user-message') || className.includes('user')) {
    return 'user';
  }
  if (className.includes('assistant') || className.includes('bot') || className.includes('ai')) {
    return 'assistant';
  }

  const avatar = element.querySelector('[class*="avatar"], [class*="icon"], img');
  if (avatar) {
    const avatarClass = (avatar.className || '').toString().toLowerCase();
    const avatarSrc = (avatar.getAttribute('src') || '').toLowerCase();
    const avatarAlt = (avatar.getAttribute('alt') || '').toLowerCase();
    if (avatarClass.includes('user') || avatarSrc.includes('user') || avatarAlt.includes('user')) return 'user';
    if (
      avatarClass.includes('bot') ||
      avatarClass.includes('ai') ||
      avatarSrc.includes('bot') ||
      avatarSrc.includes('ai') ||
      avatarAlt.includes('豆包') ||
      avatarAlt.includes('bot')
    ) {
      return 'assistant';
    }
  }

  const parent = element.parentElement;
  if (parent) {
    const parentClass = (parent.className || '').toString().toLowerCase();
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

function doubaoTitle(): string {
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
    if (element && element.textContent?.trim()) {
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

  const messageElements = document.querySelectorAll('[class*="message"], [class*="chat-item"]');
  for (const element of messageElements) {
    const role = detectDoubaoRole(element);
    if (role === 'user' && element.textContent) {
      return element.textContent.substring(0, 100);
    }
  }
  return 'Untitled Conversation';
}

const doubaoConfig: DomProviderConfig = {
  id: 'Doubao',
  matches: (url: string) => url.includes('doubao.com'),
  getConversationId: () => {
    const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    if (hashMatch) return hashMatch[1];
    const pathMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    if (pathMatch) return pathMatch[1];
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId') || urlParams.get('conversation_id');
    if (chatId) return chatId;
    return `doubao_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  },
  getTitle: doubaoTitle,
  messageSelectors: ['[class*="message"]', '[class*="chat-item"]', '[data-role]'],
  contentSelectors: [
    '[class*="message-content"]',
    '[class*="content"]',
    '[class*="text"]',
    '.markdown',
    '[class*="markdown"]',
    'p',
    'div[class*="body"]',
  ],
  role: {
    attribute: 'data-role',
    classHints: {
      'user-message': 'user',
      user: 'user',
      assistant: 'assistant',
      bot: 'assistant',
      ai: 'assistant',
    },
    fallback: detectDoubaoRole,
  },
  fillSelectors: [
    'textarea[placeholder*="输入"]',
    'textarea[placeholder*="问"]',
    '[contenteditable="true"][placeholder*="输入"]',
    '[contenteditable="true"][placeholder*="问"]',
    'textarea',
    '[contenteditable="true"]',
    'input[type="text"]',
  ],
};

export default {
  id: doubaoConfig.id,
  matches: doubaoConfig.matches,
  extract: () => parseConversationFromDom(doubaoConfig),
  fill: (content: string) => fillInput(content, doubaoConfig.fillSelectors),
};

export { doubaoConfig };
