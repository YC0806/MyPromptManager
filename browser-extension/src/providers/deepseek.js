import { fillInput } from './utils.js';

const PROVIDER_ID = 'DeepSeek';

function matches(url) {
  return url.includes('chat.deepseek.com');
}

function getConversationId() {
  const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-]+)/);
  if (hashMatch) return hashMatch[1];
  const pathMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
  return pathMatch ? pathMatch[1] : `deepseek_${Date.now()}`;
}

function getConversationTitle() {
  const selectors = ['.chat-title', '[class*="title"]', 'h1', 'title'];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      let title = element.textContent.trim();
      title = title.replace(/\s*-\s*DeepSeek.*$/, '').trim();
      if (title && title !== 'DeepSeek') {
        return title;
      }
    }
  }

  const firstUserMessage = document.querySelector('[class*="user-message"], .user-message');
  if (firstUserMessage) {
    return firstUserMessage.textContent.substring(0, 100);
  }
  return 'Untitled Conversation';
}

function detectMessageRole(element) {
  // 1. 检查 data 属性
  const dataRole = element.getAttribute('data-role') ||
    element.getAttribute('data-message-role') ||
    element.getAttribute('data-message-author') ||
    element.getAttribute('role');

  if (dataRole) {
    const roleLower = dataRole.toLowerCase();
    if (roleLower.includes('user') || roleLower === 'user') return 'user';
    if (roleLower.includes('assistant') || roleLower.includes('bot') || roleLower === 'assistant') return 'assistant';
  }

  // 2. 检查 className（更精确的匹配）
  const className = (element.className || '').toLowerCase();
  const classWords = className.split(/[\s-_]+/);

  // 检查是否有明确的用户类名
  if (classWords.includes('user') || className.includes('useritem') || className.includes('usermessage')) {
    if (!classWords.includes('assistant') && !className.includes('assistant')) {
      return 'user';
    }
  }

  // 检查是否有明确的助手类名
  if (classWords.includes('assistant') || classWords.includes('bot') || classWords.includes('ai') ||
      className.includes('assistantitem') || className.includes('assistantmessage') ||
      className.includes('botmessage') || className.includes('aimessage')) {
    return 'assistant';
  }

  // 3. 检查子元素的图标或头像
  const avatarElement = element.querySelector('[class*="avatar" i], [class*="icon" i], img');
  if (avatarElement) {
    const avatarClass = (avatarElement.className || '').toLowerCase();
    const avatarAlt = (avatarElement.alt || '').toLowerCase();
    const avatarSrc = (avatarElement.src || '').toLowerCase();

    if (avatarClass.includes('user') || avatarAlt.includes('user') || avatarSrc.includes('user')) {
      return 'user';
    }
    if (avatarClass.includes('assistant') || avatarClass.includes('bot') || avatarClass.includes('ai') ||
        avatarAlt.includes('assistant') || avatarAlt.includes('bot') || avatarAlt.includes('deepseek') ||
        avatarSrc.includes('assistant') || avatarSrc.includes('bot') || avatarSrc.includes('deepseek')) {
      return 'assistant';
    }
  }

  // 4. 检查是否有角色标签
  const roleLabel = element.querySelector('[class*="role" i], [class*="author" i], [class*="name" i]');
  if (roleLabel) {
    const labelText = (roleLabel.textContent || '').toLowerCase();
    if (labelText.includes('user') || labelText.includes('用户') || labelText.includes('you')) {
      return 'user';
    }
    if (labelText.includes('assistant') || labelText.includes('助手') || labelText.includes('deepseek') || labelText.includes('ai')) {
      return 'assistant';
    }
  }

  // 5. 通过位置判断（通常用户消息在右侧，AI在左侧或有特定对齐）
  const styles = window.getComputedStyle(element);
  const textAlign = styles.textAlign;
  const justifyContent = styles.justifyContent;
  const alignSelf = styles.alignSelf;

  if (textAlign === 'right' || justifyContent === 'flex-end' || alignSelf === 'flex-end') {
    // 可能是用户消息，但需要进一步确认
    const hasAssistantKeyword = className.includes('assistant') || className.includes('bot');
    if (!hasAssistantKeyword) {
      return 'user';
    }
  }

  // 6. HTML内容匹配（最后的手段）
  const html = element.outerHTML.toLowerCase();
  const userPattern = /(class|data-role|data-author)=["'][^"']*user[^"']*["']/;
  const assistantPattern = /(class|data-role|data-author)=["'][^"']*(assistant|bot|ai|deepseek)[^"']*["']/;

  const userMatch = userPattern.test(html);
  const assistantMatch = assistantPattern.test(html);

  if (userMatch && !assistantMatch) return 'user';
  if (assistantMatch && !userMatch) return 'assistant';

  // 如果都无法判断，返回 null
  console.warn('[DeepSeek] 无法确定消息角色:', {
    className: element.className,
    dataRole,
    html: element.outerHTML.substring(0, 200)
  });

  return null;
}

function extractMessageContent(element) {
  // 1. 尝试使用精确的内容选择器
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
      // 过滤掉按钮和工具栏
      const clone = contentElement.cloneNode(true);
      // 移除按钮、工具栏等元素
      clone.querySelectorAll('button, [class*="toolbar" i], [class*="action" i], [class*="btn" i]').forEach(el => el.remove());

      const text = clone.innerText || clone.textContent;
      if (text && text.trim().length > 0) {
        return cleanMessageText(text);
      }
    }
  }

  // 2. 如果没有找到精确的内容元素，使用整个元素的文本
  const clone = element.cloneNode(true);

  // 移除不需要的子元素
  clone.querySelectorAll([
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
  ].join(',')).forEach(el => el.remove());

  const text = clone.innerText || clone.textContent;
  return cleanMessageText(text);
}

function cleanMessageText(text) {
  if (!text) return '';

  // 按行分割并过滤
  const lines = text.split('\n').filter((line) => {
    const trimmed = line.trim();
    // 过滤掉空行和UI元素文本
    return trimmed.length > 0 &&
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
      !trimmed.match(/^DeepSeek$/);
  });

  return lines.join('\n').trim();
}

function selectMessageElements() {
  const selectors = [
    // 优先尝试更具体的选择器
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

  console.log('[DeepSeek] 开始查找消息元素...');

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    console.log(`[DeepSeek] 选择器 "${selector}" 找到 ${elements.length} 个元素`);

    const filtered = Array.from(elements).filter((el) => {
      const text = el.textContent.trim();
      // 确保元素有足够的文本内容，但不要太大
      const hasValidText = text.length > 5 && text.length < 50000;
      // 确保不是容器元素（容器通常包含多个消息）
      const childMessages = el.querySelectorAll('[class*="message" i], [class*="chat" i]');
      const isNotContainer = childMessages.length < 3;

      return hasValidText && isNotContainer;
    });

    if (filtered.length > 0 && filtered.length < 200) {
      console.log(`[DeepSeek] 使用选择器 "${selector}", 找到 ${filtered.length} 条消息`);

      // 验证是否能检测到角色
      let roleDetectionCount = 0;
      filtered.slice(0, 5).forEach(el => {
        const role = detectMessageRole(el);
        if (role) roleDetectionCount++;
      });

      console.log(`[DeepSeek] 前5条消息中有 ${roleDetectionCount} 条可以检测到角色`);

      // 如果至少能检测到一些角色，就使用这个选择器
      if (roleDetectionCount > 0 || filtered.length <= 10) {
        return filtered;
      }
    }
  }

  // 如果上述选择器都不行，尝试更宽泛的搜索
  console.log('[DeepSeek] 使用备用方法查找消息...');

  const allDivs = Array.from(document.querySelectorAll('div')).filter((div) => {
    const text = div.textContent.trim();
    const className = (div.className || '').toLowerCase();
    const dataRole = div.getAttribute('data-role');

    // 检查是否有角色相关的类名或属性
    const hasRoleIndicator = className.includes('user') ||
      className.includes('assistant') ||
      className.includes('message') ||
      dataRole === 'user' ||
      dataRole === 'assistant';

    // 检查文本长度
    const hasValidText = text.length > 10 && text.length < 10000;

    // 确保不是大容器
    const childCount = div.children.length;
    const isNotLargeContainer = childCount < 20;

    return hasRoleIndicator && hasValidText && isNotLargeContainer;
  });

  console.log(`[DeepSeek] 备用方法找到 ${allDivs.length} 个元素`);

  return allDivs;
}

function extractMessages() {
  const messages = [];
  const messageElements = selectMessageElements();

  console.log(`[DeepSeek] 开始提取 ${messageElements.length} 条消息...`);

  messageElements.forEach((element, index) => {
    const role = detectMessageRole(element);
    const content = extractMessageContent(element);

    console.log(`[DeepSeek] 消息 ${index + 1}:`, {
      role: role || '未知',
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 50) || '',
    });

    if (content && content.trim().length > 0) {
      if (role) {
        messages.push({
          role,
          content: content.trim(),
          timestamp: null,
          index,
        });
      } else {
        // 如果无法检测角色，尝试根据位置推断
        // 通常对话是交替进行的：user, assistant, user, assistant...
        let inferredRole = null;
        if (messages.length > 0) {
          const lastRole = messages[messages.length - 1].role;
          inferredRole = lastRole === 'user' ? 'assistant' : 'user';
          console.log(`[DeepSeek] 根据对话顺序推断角色为: ${inferredRole}`);
        } else {
          // 第一条消息通常是用户
          inferredRole = 'user';
          console.log('[DeepSeek] 第一条消息，推断为用户');
        }

        messages.push({
          role: inferredRole,
          content: content.trim(),
          timestamp: null,
          index,
        });
      }
    }
  });

  console.log(`[DeepSeek] 最终提取了 ${messages.length} 条消息`);

  // 验证消息的合理性
  const userCount = messages.filter(m => m.role === 'user').length;
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  console.log(`[DeepSeek] 用户消息: ${userCount}, AI消息: ${assistantCount}`);

  // 如果角色分布不合理（比如全是user或全是assistant），可能检测有误
  if (messages.length > 2 && (userCount === 0 || assistantCount === 0)) {
    console.warn('[DeepSeek] 角色检测可能有误，尝试重新分配角色...');
    // 重新分配角色，按交替模式
    messages.forEach((msg, idx) => {
      msg.role = idx % 2 === 0 ? 'user' : 'assistant';
    });

    const newUserCount = messages.filter(m => m.role === 'user').length;
    const newAssistantCount = messages.filter(m => m.role === 'assistant').length;
    console.log(`[DeepSeek] 重新分配后 - 用户消息: ${newUserCount}, AI消息: ${newAssistantCount}`);
  }

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
  const inputSelectors = [
    'textarea[placeholder*="输入"]',
    'textarea[placeholder*="问我"]',
    'textarea',
    '[contenteditable="true"]',
  ];
  return fillInput(content, inputSelectors);
}

export default {
  id: PROVIDER_ID,
  matches,
  extract,
  fill,
};
