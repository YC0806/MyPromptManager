import { DomProviderConfig, RoleDetectionConfig, TimestampConfig } from './models';

export type SerializableFunction<T extends (...args: any[]) => any> = T | string;

export interface StoredRoleDetectionConfig
  extends Omit<RoleDetectionConfig, 'fallback'> {
  fallback?: SerializableFunction<(element: Element) => ReturnType<NonNullable<RoleDetectionConfig['fallback']>>>;
}

export interface StoredTimestampConfig extends Omit<TimestampConfig, 'parser'> {
  parser?: SerializableFunction<(value: string) => string | null>;
}

export interface StoredDomProviderConfig
  extends Omit<DomProviderConfig, 'matches' | 'getConversationId' | 'getTitle' | 'findMessageElements' | 'messageFilter' | 'extractContent' | 'timestamp' | 'role'> {
  matches?: SerializableFunction<(url: string) => boolean> | string[];
  getConversationId?: SerializableFunction<() => string | null>;
  getTitle?: SerializableFunction<() => string>;
  findMessageElements?: SerializableFunction<() => Element[]>;
  messageFilter?: SerializableFunction<(element: Element) => boolean>;
  extractContent?: SerializableFunction<(element: Element) => string>;
  timestamp?: StoredTimestampConfig;
  role?: StoredRoleDetectionConfig;
}

function restoreFunction<T extends (...args: any[]) => any>(candidate?: SerializableFunction<T>): T | undefined {
  if (!candidate) return undefined;
  if (typeof candidate === 'function') return candidate;

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${candidate})`)();
    return typeof fn === 'function' ? (fn as T) : undefined;
  } catch (error) {
    console.warn('[ProviderConfig] Failed to restore function', error);
    return undefined;
  }
}

function normalizePatterns(matches?: SerializableFunction<(url: string) => boolean> | string[]): string[] {
  if (!matches) return [];
  if (Array.isArray(matches)) return matches;
  if (typeof matches === 'string') return [matches];
  return [];
}

export function deserializeDomProviderConfig(config: StoredDomProviderConfig): DomProviderConfig {
  const matchesFn = restoreFunction<(url: string) => boolean>(config.matches as SerializableFunction<(url: string) => boolean>);
  const getConversationIdFn = restoreFunction<() => string | null>(config.getConversationId);
  const getTitleFn = restoreFunction<() => string>(config.getTitle);
  const findMessageElementsFn = restoreFunction<() => Element[]>(config.findMessageElements);
  const messageFilterFn = restoreFunction<(element: Element) => boolean>(config.messageFilter);
  const extractContentFn = restoreFunction<(element: Element) => string>(config.extractContent);
  const timestamp = config.timestamp
    ? { ...config.timestamp, parser: restoreFunction<(value: string) => string | null>(config.timestamp.parser) }
    : undefined;
  const role = config.role
    ? { ...config.role, fallback: restoreFunction<(element: Element) => ReturnType<NonNullable<RoleDetectionConfig['fallback']>>>(config.role.fallback) }
    : undefined;

  return {
    ...config,
    urlPatterns: normalizePatterns(config.matches),
    matches: matchesFn,
    getConversationId: getConversationIdFn,
    getTitle: getTitleFn,
    findMessageElements: findMessageElementsFn,
    messageFilter: messageFilterFn,
    extractContent: extractContentFn,
    timestamp,
    role,
  };
}

export function matchesUrl(config: DomProviderConfig, url: string): boolean {
  if (typeof config.matches === 'function') return !!config.matches(url);
  if (config.urlPatterns?.length) {
    return config.urlPatterns.some((pattern) => {
      try {
        const regex = pattern.startsWith('/') && pattern.lastIndexOf('/') > 0
          ? new RegExp(pattern.slice(1, pattern.lastIndexOf('/')), pattern.slice(pattern.lastIndexOf('/') + 1))
          : new RegExp(pattern, 'i');
        return regex.test(url);
      } catch (error) {
        const loweredPattern = pattern.toLowerCase();
        return url.toLowerCase().includes(loweredPattern);
      }
    });
  }
  return false;
}

export const BUILTIN_PROVIDER_CONFIGS: StoredDomProviderConfig[] = [
  {
    id: 'ChatGPT',
    urlPatterns: ['chat.openai.com', 'chatgpt.com'],
    conversationIdPattern: '/c/([a-zA-Z0-9-]+)',
    titleSelector: 'title',
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
  },
  {
    id: 'Claude',
    urlPatterns: ['claude.ai'],
    conversationIdPattern: '/chat/([a-zA-Z0-9-]+)',
    titleSelector: '[class*="ChatTitle"], [class*="conversation-title"], h1',
    messageSelectors: ['[class*="Message"]'],
    contentSelectors: ['[class*="MessageContent"]', '[class*="message-content"]', '.markdown', '[class*="markdown"]', 'p'],
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
    },
    fillSelectors: ['[contenteditable="true"][placeholder]', '[contenteditable="true"]', 'textarea'],
  },
  {
    id: 'Gemini',
    urlPatterns: ['gemini.google.com'],
    conversationIdPattern: '/chat/([a-zA-Z0-9-_]+)',
    titleSelector: '[class*="conversation-title"], [class*="chat-title"], h1',
    messageSelectors: ['[class*="message"]', '[class*="turn"]', '[data-test-id*="message"]'],
    contentSelectors: ['[class*="message-content"]', '[class*="response-content"]', '[class*="query-content"]', '.markdown', '[class*="markdown"]'],
    role: {
      classHints: {
        user: 'user',
        'user-turn': 'user',
        'user-message': 'user',
        model: 'assistant',
        assistant: 'assistant',
      },
    },
    fillSelectors: ['[contenteditable="true"]', 'textarea[placeholder]', 'textarea'],
  },
  {
    id: 'DeepSeek',
    urlPatterns: ['chat.deepseek.com'],
    conversationIdPattern: '/chat/([a-zA-Z0-9-]+)',
    titleSelector: '.chat-title, [class*="title"], h1, title',
    messageSelectors: [
      '.message-item',
      '[class*="MessageItem"]',
      '[class*="messageItem"]',
      '[class*="Message"]',
      '[class*="message"]',
      '[data-role]',
    ],
    contentSelectors: ['.message-content', '[class*="Markdown"]', '[class*="markdown"]', '[class*="Content"]', 'pre', 'p'],
    role: {
      attribute: 'data-role',
      classHints: {
        user: 'user',
        assistant: 'assistant',
        bot: 'assistant',
        ai: 'assistant',
      },
    },
    fillSelectors: ['textarea[placeholder*="输入"]', 'textarea', '[contenteditable="true"]'],
  },
  {
    id: 'Doubao',
    urlPatterns: ['doubao.com'],
    conversationIdPattern: '/chat/([a-zA-Z0-9-_]+)',
    titleSelector: '[class*="conversation-title"], [class*="chat-title"], [data-testid="conversation-title"], .title, h1, h2, title',
    messageSelectors: ['[class*="message"]', '[class*="chat-item"]', '[data-role]'],
    contentSelectors: ['[class*="message-content"]', '[class*="content"]', '[class*="text"]', '.markdown', '[class*="markdown"]', 'p'],
    role: {
      attribute: 'data-role',
      classHints: {
        'user-message': 'user',
        user: 'user',
        assistant: 'assistant',
        bot: 'assistant',
        ai: 'assistant',
      },
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
  },
];
