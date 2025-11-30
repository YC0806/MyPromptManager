import { parseConversationFromDom } from '../content/dom-parser';
import { DomProviderConfig, Role } from '../shared/models';
import { fillInput } from './utils';

function detectDeepseekRole(element: Element): Role | null {
  const dataRole =
    element.getAttribute('data-role') ||
    element.getAttribute('data-message-role') ||
    element.getAttribute('data-message-author') ||
    element.getAttribute('role');

  if (dataRole) {
    const roleLower = dataRole.toLowerCase();
    if (roleLower.includes('user')) return 'user';
    if (roleLower.includes('assistant') || roleLower.includes('bot')) return 'assistant';
  }

  const className = (element.className || '').toString().toLowerCase();
  const classWords = className.split(/[\s-_]+/);
  if (classWords.includes('user') || className.includes('useritem') || className.includes('usermessage')) {
    if (!classWords.includes('assistant') && !className.includes('assistant')) {
      return 'user';
    }
  }

  if (
    classWords.includes('assistant') ||
    classWords.includes('bot') ||
    classWords.includes('ai') ||
    className.includes('assistantitem') ||
    className.includes('assistantmessage') ||
    className.includes('botmessage') ||
    className.includes('aimessage')
  ) {
    return 'assistant';
  }

  const avatarElement = element.querySelector('[class*="avatar" i], [class*="icon" i], img');
  if (avatarElement) {
    const avatarClass = (avatarElement.className || '').toString().toLowerCase();
    const avatarAlt = (avatarElement.getAttribute('alt') || '').toLowerCase();
    const avatarSrc = (avatarElement.getAttribute('src') || '').toLowerCase();

    if (avatarClass.includes('user') || avatarAlt.includes('user') || avatarSrc.includes('user')) {
      return 'user';
    }
    if (
      avatarClass.includes('assistant') ||
      avatarClass.includes('bot') ||
      avatarClass.includes('ai') ||
      avatarAlt.includes('assistant') ||
      avatarAlt.includes('bot') ||
      avatarAlt.includes('deepseek') ||
      avatarSrc.includes('assistant') ||
      avatarSrc.includes('bot') ||
      avatarSrc.includes('deepseek')
    ) {
      return 'assistant';
    }
  }

  return null;
}

function cleanMessageText(text: string): string {
  if (!text) return '';
  const lines = text.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.match(/^复制$/) &&
      !trimmed.match(/^Copy$/) &&
      !trimmed.match(/^编辑$/) &&
      !trimmed.match(/^Edit$/) &&
      !trimmed.match(/^删除$/) &&
      !trimmed.match(/^Delete$/) &&
      !trimmed.match(/^重试$/) &&
      !trimmed.match(/^Retry$/) &&
      !trimmed.match(/^\d{1,2}:\d{2}/) &&
      !trimmed.match(/^点赞$/) &&
      !trimmed.match(/^Like$/) &&
      !trimmed.match(/^分享$/) &&
      !trimmed.match(/^Share$/) &&
      !trimmed.match(/^更多$/) &&
      !trimmed.match(/^More$/) &&
      !trimmed.match(/^User$/) &&
      !trimmed.match(/^Assistant$/) &&
      !trimmed.match(/^用户$/) &&
      !trimmed.match(/^助手$/) &&
      !trimmed.match(/^DeepSeek$/)
    );
  });

  return lines.join('\n').trim();
}

function deepseekContentExtractor(element: Element): string {
  const contentSelectors = [
    '.message-content',
    '[class*="MessageContent"]',
    '[class*="messageContent"]',
    '[class*="Content"]',
    '[class*="content"]',
    '.markdown-body',
    '.markdown',
    '[class*="Markdown"]',
    '[class*="markdown"]',
    '[class*="text-content"]',
    '[class*="textContent"]',
    '[class*="Text"]',
    '[class*="text"]',
    'pre',
    'p',
  ];

  for (const selector of contentSelectors) {
    const contentElement = element.querySelector(selector);
    if (contentElement) {
      const clone = contentElement.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll(
          [
            'button',
            '[class*="toolbar" i]',
            '[class*="action" i]',
            '[class*="btn" i]',
          ].join(',')
        )
        .forEach((el) => el.remove());

      const text = clone.textContent || '';
      if (text.trim().length > 0) {
        return cleanMessageText(text);
      }
    }
  }

  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      [
        'button',
        '[class*="toolbar" i]',
        '[class*="action" i]',
        '[class*="btn" i]',
        '[class*="avatar" i]',
        '[class*="icon" i]',
        '[class*="timestamp" i]',
        '[class*="time" i]',
        '[class*="role" i]',
        '[class*="author" i]',
      ].join(',')
    )
    .forEach((el) => el.remove());

  return cleanMessageText(clone.textContent || '');
}

function findDeepseekMessages(): Element[] {
  const selectors = [
    '.message-item',
    '[class*="MessageItem"]',
    '[class*="messageItem"]',
    '[class*="Message"]',
    '[class*="message"]',
    '[class*="chat-message"]',
    '[class*="ChatMessage"]',
    '.chat-item',
    '[class*="ChatItem"]',
    '[class*="chatItem"]',
    '[role="article"]',
    'div[data-message-id]',
    'div[data-role="user"]',
    'div[data-role="assistant"]',
    'div[data-role]',
    '[class*="conversation"] > div',
    '[class*="Conversation"] > div',
  ];

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));
    const filtered = elements.filter((el) => {
      const text = (el.textContent || '').trim();
      const hasValidText = text.length > 5 && text.length < 50000;
      const childMessages = el.querySelectorAll('[class*="message" i], [class*="chat" i]');
      const isNotContainer = childMessages.length < 3;
      return hasValidText && isNotContainer;
    });

    if (filtered.length > 0 && filtered.length < 200) {
      const roleDetectionCount = filtered.slice(0, 5).filter((el) => detectDeepseekRole(el)).length;
      if (roleDetectionCount > 0 || filtered.length <= 10) {
        return filtered;
      }
    }
  }

  return Array.from(document.querySelectorAll('div')).filter((div) => {
    const text = (div.textContent || '').trim();
    const className = (div.className || '').toString().toLowerCase();
    const dataRole = div.getAttribute('data-role');

    const hasRoleIndicator =
      className.includes('user') ||
      className.includes('assistant') ||
      className.includes('message') ||
      dataRole === 'user' ||
      dataRole === 'assistant';

    const hasValidText = text.length > 10 && text.length < 10000;
    const childCount = div.children.length;
    const isNotLargeContainer = childCount < 20;

    return hasRoleIndicator && hasValidText && isNotLargeContainer;
  });
}

const deepseekConfig: DomProviderConfig = {
  id: 'DeepSeek',
  matches: (url: string) => url.includes('chat.deepseek.com'),
  getConversationId: () => {
    const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-]+)/);
    if (hashMatch) return hashMatch[1];
    const pathMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return pathMatch ? pathMatch[1] : `deepseek_${Date.now()}`;
  },
  getTitle: () => {
    const selectors = ['.chat-title', '[class*="title"]', 'h1', 'title'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        let title = element.textContent.trim();
        title = title.replace(/\s*-\s*DeepSeek.*$/, '').trim();
        if (title && title !== 'DeepSeek') {
          return title;
        }
      }
    }

    const firstUserMessage = document.querySelector('[class*="user-message"], .user-message');
    if (firstUserMessage?.textContent) {
      return firstUserMessage.textContent.substring(0, 100);
    }
    return 'Untitled Conversation';
  },
  findMessageElements: findDeepseekMessages,
  extractContent: deepseekContentExtractor,
  role: {
    fallback: detectDeepseekRole,
  },
  fillSelectors: [
    'textarea[placeholder*="输入"]',
    'textarea[placeholder*="问我"]',
    'textarea',
    '[contenteditable="true"]',
  ],
};

export default {
  id: deepseekConfig.id,
  matches: deepseekConfig.matches,
  extract: () => parseConversationFromDom(deepseekConfig),
  fill: (content: string) => fillInput(content, deepseekConfig.fillSelectors),
};

export { deepseekConfig };
