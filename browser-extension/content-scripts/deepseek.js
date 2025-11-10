/**
 * Content Script for DeepSeek
 * Extracts conversation history from chat.deepseek.com
 */

(function() {
  'use strict';

  const PROVIDER = 'DeepSeek';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractConversation') {
      extractConversation()
        .then(data => sendResponse({ success: true, data }))
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
    // DeepSeek uses hash-based routing
    const match = window.location.hash.match(/\/chat\/([a-zA-Z0-9-]+)/);
    if (match) return match[1];

    // Try to get from pathname
    const pathMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return pathMatch ? pathMatch[1] : `deepseek_${Date.now()}`;
  }

  // Get conversation title
  function getConversationTitle() {
    // Try multiple selectors
    const selectors = [
      '.chat-title',
      '[class*="title"]',
      'h1',
      'title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        let title = element.textContent.trim();
        // Clean up title
        title = title.replace(/\s*-\s*DeepSeek.*$/, '').trim();
        if (title && title !== 'DeepSeek') {
          return title;
        }
      }
    }

    // Fallback to first user message
    const firstUserMessage = document.querySelector('[class*="user-message"], .user-message');
    if (firstUserMessage) {
      return firstUserMessage.textContent.substring(0, 100);
    }

    return 'Untitled Conversation';
  }

  // Extract messages from the page
  function extractMessages() {
    const messages = [];

    // Try multiple selectors for message containers
    const selectors = [
      '.message-item',
      '[class*="message"]',
      '[class*="chat-message"]',
      '.chat-item'
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

  // Detect message role (user or assistant)
  function detectMessageRole(element) {
    const className = element.className.toLowerCase();
    const html = element.outerHTML.toLowerCase();

    if (className.includes('user') || html.includes('user')) {
      return 'user';
    } else if (className.includes('assistant') || className.includes('bot') || html.includes('assistant')) {
      return 'assistant';
    }

    // Check for specific DeepSeek class patterns
    if (element.querySelector('[class*="user"]')) {
      return 'user';
    } else if (element.querySelector('[class*="assistant"], [class*="bot"]')) {
      return 'assistant';
    }

    return null;
  }

  // Extract content from message element
  function extractMessageContent(element) {
    // Find content container
    const contentSelectors = [
      '.message-content',
      '[class*="content"]',
      '.markdown',
      '[class*="markdown"]'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        return contentElement.innerText || contentElement.textContent;
      }
    }

    // Fallback to element text content
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

  console.log('MyPromptManager: DeepSeek content script loaded');
})();
