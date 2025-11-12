/**
 * Content Script for ChatGPT
 * Extracts conversation history from chat.openai.com and chatgpt.com
 */

(function() {
  'use strict';

  const PROVIDER = 'ChatGPT';

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
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  // Get conversation title
  function getConversationTitle() {
    // Try to get title from the page
    const titleElement = document.querySelector('title');
    let title = titleElement ? titleElement.textContent : '';

    // Clean up title (remove " | ChatGPT" suffix)
    title = title.replace(/\s*\|\s*ChatGPT.*$/, '').trim();

    // If title is empty or generic, use first user message
    if (!title || title === 'ChatGPT') {
      const firstUserMessage = document.querySelector('[data-message-author-role="user"]');
      if (firstUserMessage) {
        title = firstUserMessage.textContent.substring(0, 100);
      } else {
        title = 'Untitled Conversation';
      }
    }

    return title;
  }

  // Extract messages from the page
  function extractMessages() {
    const messages = [];

    // Find all message elements
    const messageElements = document.querySelectorAll('[data-message-author-role]');

    messageElements.forEach((element, index) => {
      const role = element.getAttribute('data-message-author-role');
      const content = extractMessageContent(element);

      if (content) {
        messages.push({
          role: role === 'user' ? 'user' : 'assistant',
          content,
          timestamp: null, // ChatGPT doesn't show timestamps in UI
          index,
        });
      }
    });

    return messages;
  }

  // Extract content from message element
  function extractMessageContent(element) {
    // Find the message content container
    const contentContainer = element.querySelector('.markdown, .message-content, [class*="markdown"]');

    if (contentContainer) {
      // Get text content, preserving some formatting
      return contentContainer.innerText || contentContainer.textContent;
    }

    // Fallback to element text content
    return element.innerText || element.textContent;
  }

  // Auto-extract on page load (if enabled)
  async function autoExtract() {
    try {
      const config = await chrome.runtime.sendMessage({ action: 'getConfig' });

      if (config.success && config.config.autoSync) {
        // Wait for page to fully load
        setTimeout(() => {
          const conversationId = getConversationId();
          if (conversationId) {
            extractConversation().catch(error => {
              console.error('Auto-extract failed:', error);
            });
          }
        }, 3000); // Wait 3 seconds after page load
      }
    } catch (error) {
      console.error('Error in auto-extract:', error);
    }
  }

  // Fill input field with content
  async function fillInputField(content) {
    try {
      // Find the main input textarea
      const inputSelectors = [
        '#prompt-textarea',
        'textarea[placeholder*="Message"]',
        'textarea[data-id="root"]',
        'textarea',
      ];

      let inputElement = null;
      for (const selector of inputSelectors) {
        inputElement = document.querySelector(selector);
        if (inputElement) break;
      }

      if (!inputElement) {
        throw new Error('无法找到输入框');
      }

      // Set the value
      inputElement.value = content;
      inputElement.textContent = content;

      // Trigger input events to make ChatGPT recognize the change
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      inputElement.dispatchEvent(inputEvent);
      inputElement.dispatchEvent(changeEvent);

      // Focus the input
      inputElement.focus();

      // Adjust height if needed (for auto-expanding textareas)
      if (inputElement.style) {
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

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoExtract);
  } else {
    autoExtract();
  }

  console.log('MyPromptManager: ChatGPT content script loaded');
})();
