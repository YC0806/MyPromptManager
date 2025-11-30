import { Conversation, DomProviderConfig, Message, Role } from '../shared/models';

function matchFromPattern(value: string | null | undefined, pattern?: string): string | null {
  if (!value || !pattern) return value || null;
  try {
    const regex = new RegExp(pattern);
    const result = value.match(regex);
    if (result && result[1]) {
      return result[1];
    }
  } catch (error) {
    console.warn('[DomParser] Invalid regex pattern', pattern, error);
  }
  return value || null;
}

function resolveConversationId(config: DomProviderConfig): string | null {
  if (typeof config.getConversationId === 'function') return config.getConversationId();

  if (config.conversationIdPattern) {
    const urlMatch = window.location.href.match(new RegExp(config.conversationIdPattern));
    if (urlMatch?.[1]) return urlMatch[1];
  }

  if (config.conversationIdSelector) {
    const element = document.querySelector(config.conversationIdSelector);
    const rawValue = config.conversationIdAttribute
      ? element?.getAttribute(config.conversationIdAttribute)
      : element?.textContent;
    const value = rawValue?.trim() || '';
    if (value) {
      return matchFromPattern(value, config.conversationIdPattern);
    }
  }

  return null;
}

function normalizeTitle(config: DomProviderConfig): string {
  if (typeof config.getTitle === 'function') return config.getTitle();

  const selectors = config.titleSelector ? config.titleSelector.split(',').map((s) => s.trim()) : ['title'];
  let title = '';

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const value = (config.titleAttribute ? element.getAttribute(config.titleAttribute) : element.textContent) || '';
      if (value.trim()) {
        title = value.trim();
        break;
      }
    }
  }

  if (!title) {
    title = document.title || config.titleFallback || 'Untitled Conversation';
  }

  if (config.titlePrefixToRemove?.length) {
    config.titlePrefixToRemove.forEach((prefix) => {
      if (title.startsWith(prefix)) {
        title = title.slice(prefix.length).trim();
      }
    });
  }

  if (config.titleSuffixToRemove?.length) {
    config.titleSuffixToRemove.forEach((suffix) => {
      if (title.endsWith(suffix)) {
        title = title.slice(0, -suffix.length).trim();
      }
    });
  }

  return title || 'Untitled Conversation';
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function collectMessageElements(config: DomProviderConfig): Element[] {
  if (typeof config.findMessageElements === 'function') {
    return config.findMessageElements();
  }

  const selectors = config.messageSelectors ?? [];
  const seen = new Set<Element>();
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => seen.add(el));
  });
  return Array.from(seen);
}

function detectRole(element: Element, config: DomProviderConfig): Role | null {
  const roleConfig = config.role;
  const className = (element.className || '').toString().toLowerCase();

  if (roleConfig?.attribute) {
    const attrValue = element.getAttribute(roleConfig.attribute);
    if (attrValue) {
      const normalized = attrValue.toLowerCase();
      if (roleConfig.values?.[normalized]) {
        return roleConfig.values[normalized];
      }
    }
  }

  if (roleConfig?.classHints) {
    for (const [keyword, role] of Object.entries(roleConfig.classHints)) {
      if (className.includes(keyword.toLowerCase())) {
        return role;
      }
    }
  }

  const dataRole = element.getAttribute('data-role') || element.getAttribute('data-message-role');
  if (dataRole) {
    const normalized = dataRole.toLowerCase();
    if (normalized.includes('user')) return 'user';
    if (normalized.includes('assistant') || normalized.includes('bot')) return 'assistant';
  }

  if (className.includes('user')) return 'user';
  if (className.includes('assistant') || className.includes('bot')) return 'assistant';

  if (typeof roleConfig?.fallback === 'function') {
    return roleConfig.fallback(element);
  }

  return null;
}

function extractContent(element: Element, selectors: string[] = []): string {
  for (const selector of selectors) {
    const match = element.querySelector(selector);
    if (match && (match.textContent || '').trim()) {
      return (match.textContent || '').trim();
    }
  }

  const textContent = element.textContent || '';
  return textContent.trim();
}

function extractTimestamp(element: Element, timestampConfig?: DomProviderConfig['timestamp']): string | null {
  if (!timestampConfig) return null;

  const target = timestampConfig.selector ? element.querySelector(timestampConfig.selector) : element;
  const rawValue = target?.getAttribute(timestampConfig.attribute || 'datetime') || target?.textContent || '';
  const value = rawValue.trim();
  if (!value) return null;

  if (timestampConfig.parser) {
    return timestampConfig.parser(value);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inferRoleFromSequence(messages: Message[]): Role {
  if (messages.length === 0) return 'user';
  const lastRole = messages[messages.length - 1].role;
  return lastRole === 'user' ? 'assistant' : 'user';
}

export function parseConversationFromDom(config: DomProviderConfig): Conversation {
  const conversationId = resolveConversationId(config);
  if (!conversationId) {
    throw new Error('无法获取对话 ID');
  }

  const title = normalizeTitle(config);
  const messageElements = collectMessageElements(config);
  const messages: Message[] = [];

  messageElements.forEach((element, index) => {
    if (config.messageFilter && !config.messageFilter(element)) {
      return;
    }

    const role = detectRole(element, config) ?? inferRoleFromSequence(messages);
    const contentExtractor = config.extractContent ?? ((el: Element) => extractContent(el, config.contentSelectors));
    const content = contentExtractor(element);
    if (!content) return;

    const createdAt = extractTimestamp(element, config.timestamp);
    messages.push({
      id: randomId(`msg_${conversationId}`),
      role,
      content,
      createdAt,
      index,
    });
  });

  if (!messages.length) {
    throw new Error('未找到对话消息');
  }

  return {
    id: randomId(`conv_${conversationId}`),
    provider: config.id,
    conversationId,
    title,
    messages,
    url: window.location.href,
    extractedAt: new Date().toISOString(),
  };
}
