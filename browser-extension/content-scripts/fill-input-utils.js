/**
 * Utility functions for filling input fields across different AI providers
 */

/**
 * Fill input field with content (generic implementation)
 * @param {string} content - The content to fill
 * @param {Array<string>} selectors - Array of CSS selectors to try
 * @returns {Promise<boolean>}
 */
async function fillInputField(content, selectors) {
  try {
    let inputElement = null;

    // Try each selector
    for (const selector of selectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) {
        console.log(`Found input element with selector: ${selector}`);
        break;
      }
    }

    if (!inputElement) {
      throw new Error('无法找到输入框');
    }

    // Check if it's a contenteditable div or textarea
    const isContentEditable = inputElement.contentEditable === 'true';

    if (isContentEditable) {
      // For contenteditable divs
      inputElement.textContent = content;
      inputElement.innerText = content;
    } else {
      // For textareas
      inputElement.value = content;
    }

    // Trigger various events to ensure the input is recognized
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
    ];

    events.forEach(event => inputElement.dispatchEvent(event));

    // Focus the input
    inputElement.focus();

    // Adjust height if needed (for auto-expanding textareas)
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
