/**
 * Content Script for Gemini
 * Extracts conversation history from gemini.google.com
 */

(function() {
  'use strict';

  const PROVIDER = 'Gemini';

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
    // Gemini uses various URL patterns
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];

    // Try hash-based routing
    const hashMatch = window.location.hash.match(/\/chat\/([a-zA-Z0-9-_]+)/);
    return hashMatch ? hashMatch[1] : `gemini_${Date.now()}`;
  }

  // Get conversation title
  function getConversationTitle() {
    // Try to get title from page
    const titleSelectors = [
      '[class*="conversation-title"]',
      '[class*="chat-title"]',
      'h1',
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        let title = element.textContent.trim();
        title = title.replace(/\s*-\s*Gemini.*$/, '').trim();
        if (title && title !== 'Gemini') {
          return title;
        }
      }
    }

    // Fallback to first user message
    const firstUserMessage = document.querySelector('[class*="user-message"]');
    if (firstUserMessage) {
      return firstUserMessage.textContent.substring(0, 100);
    }

    return 'Untitled Conversation';
  }

  // Extract messages from the page
  function extractMessages() {
    const messages = [];

    // Try multiple selectors
    const selectors = [
      '[class*="message"]',
      '[class*="turn"]',
      '[data-test-id*="message"]',
    ];

    let messageElements = [];
    for (const selector of selectors) {
      messageElements = document.querySelectorAll(selector);
      if (messageElements.length > 0) break;
    }

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
    const className = element.className.toLowerCase();
    const html = element.outerHTML.toLowerCase();

    // Check for user indicators
    if (className.includes('user') || html.includes('user-turn') || html.includes('user-message')) {
      return 'user';
    }

    // Check for model/assistant indicators
    if (className.includes('model') || className.includes('assistant') ||
        html.includes('model-turn') || html.includes('assistant')) {
      return 'assistant';
    }

    // Check for Gemini-specific patterns
    if (element.querySelector('[class*="model-response"]') ||
        element.querySelector('[class*="assistant"]')) {
      return 'assistant';
    }

    if (element.querySelector('[class*="user-query"]') ||
        element.querySelector('[class*="user-input"]')) {
      return 'user';
    }

    return null;
  }

  // Extract content from message element
  function extractMessageContent(element) {
    // Find content container
    const contentSelectors = [
      '[class*="message-content"]',
      '[class*="response-content"]',
      '[class*="query-content"]',
      '.markdown',
      '[class*="markdown"]',
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
      // Find the main input element (Gemini uses contenteditable divs and textareas)
      const inputSelectors = [
        '[contenteditable="true"]',
        'textarea[placeholder]',
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

      // Adjust height if needed
      if (!isContentEditable && inputElement.style) {
        inputElement.style.height = 'auto';
        inputElement.style.height = inputElement.scrollHeight + 'px';
      }

      console.log('Content filled successfully');
      return true;
    } catch (error) {
      console.error('Error filling input:', error);
      throw error;
    }
  }

  console.log('MyPromptManager: Gemini content script loaded');
})();
