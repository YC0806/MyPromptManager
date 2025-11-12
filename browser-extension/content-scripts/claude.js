/**
 * Content Script for Claude
 * Extracts conversation history from claude.ai
 */

(function() {
  'use strict';

  const PROVIDER = 'Claude';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractConversation') {
      extractConversation()
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Will respond asynchronously
    }

    if (request.action === 'fillInput') {
      fillInputField(request.content)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Will respond asynchronously
    }
  });

  // Extract conversation from the page
  async function extractConversation() {
    try {
      // Get conversation ID from URL
      const conversationId = getConversationId();
      if (!conversationId) {
        throw new Error('无法获取对话 ID');
      }

      // Get conversation title
      const title = getConversationTitle();

      // Extract messages
      const messages = extractMessages();

      if (messages.length === 0) {
        throw new Error('未找到对话消息');
      }

      // Build conversation data
      const conversationData = {
        provider: PROVIDER,
        conversationId,
        title,
        messages,
        metadata: {
          url: window.location.href,
          extractedAt: new Date().toISOString(),
          messageCount: messages.length,
        },
      };

      // Send to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'extractConversation',
        data: conversationData,
      });

      return conversationData;
    } catch (error) {
      console.error('Error extracting conversation:', error);
      throw error;
    }
  }

  // Get conversation ID from URL
  function getConversationId() {
    // Claude uses UUID-style conversation IDs
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  // Get conversation title
  function getConversationTitle() {
    // Try to get title from page
    const titleSelectors = [
      '[class*="ChatTitle"]',
      '[class*="conversation-title"]',
      'h1',
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        let title = element.textContent.trim();
        if (title && title !== 'Claude') {
          return title;
        }
      }
    }

    // Fallback to first user message
    const firstUserMessage = document.querySelector('[data-is-user-message="true"]');
    if (firstUserMessage) {
      return firstUserMessage.textContent.substring(0, 100);
    }

    return 'Untitled Conversation';
  }

  // Extract messages from the page
  function extractMessages() {
    const messages = [];

    // Find all message elements
    const messageElements = document.querySelectorAll('[class*="Message"]');

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

  // Detect message role
  function detectMessageRole(element) {
    // Check for data attributes
    if (element.hasAttribute('data-is-user-message')) {
      return element.getAttribute('data-is-user-message') === 'true' ? 'user' : 'assistant';
    }

    // Check class names
    const className = element.className.toLowerCase();
    if (className.includes('user')) {
      return 'user';
    } else if (className.includes('assistant') || className.includes('claude')) {
      return 'assistant';
    }

    // Check for avatar or icon indicators
    const avatar = element.querySelector('[class*="avatar"], [class*="icon"]');
    if (avatar) {
      const avatarClass = avatar.className.toLowerCase();
      if (avatarClass.includes('user')) {
        return 'user';
      } else if (avatarClass.includes('assistant') || avatarClass.includes('claude')) {
        return 'assistant';
      }
    }

    return null;
  }

  // Extract content from message element
  function extractMessageContent(element) {
    // Find content container
    const contentSelectors = [
      '[class*="MessageContent"]',
      '[class*="message-content"]',
      '.markdown',
      '[class*="markdown"]',
      'p'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        return contentElement.innerText || contentElement.textContent;
      }
    }

    // Fallback
    return element.innerText || element.textContent;
  }

  // Auto-extract on page load (if enabled)
  async function autoExtract() {
    try {
      const config = await chrome.runtime.sendMessage({ action: 'getConfig' });

      if (config.success && config.config.autoSync) {
        setTimeout(() => {
          const conversationId = getConversationId();
          if (conversationId) {
            extractConversation().catch(error => {
              console.error('Auto-extract failed:', error);
            });
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error in auto-extract:', error);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoExtract);
  } else {
    autoExtract();
  }

  // Fill input field with content
  async function fillInputField(content) {
    try {
      // Find the main input element (Claude uses contenteditable divs)
      const inputSelectors = [
        '[contenteditable="true"][placeholder]',
        '[contenteditable="true"]',
        'textarea',
      ];

      let inputElement = null;
      for (const selector of inputSelectors) {
        const elements = document.querySelectorAll(selector);
        // Find the visible input element
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.height > 0 && rect.width > 0) {
            inputElement = el;
            break;
          }
        }
        if (inputElement) break;
      }

      if (!inputElement) {
        throw new Error('无法找到输入框');
      }

      // Check if it's a contenteditable div or textarea
      const isContentEditable = inputElement.contentEditable === 'true';

      if (isContentEditable) {
        inputElement.textContent = content;
        inputElement.innerText = content;
      } else {
        inputElement.value = content;
      }

      // Trigger input events
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      inputElement.dispatchEvent(inputEvent);
      inputElement.dispatchEvent(changeEvent);

      // Focus the input
      inputElement.focus();

      console.log('Content filled successfully');
      return true;
    } catch (error) {
      console.error('Error filling input:', error);
      throw error;
    }
  }

  console.log('MyPromptManager: Claude content script loaded');
})();
