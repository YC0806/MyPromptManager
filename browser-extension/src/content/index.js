import { detectProvider } from '../services/provider-registry.js';
import { getConfig } from '../services/config.js';

const provider = detectProvider(window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractConversation') {
    handleExtract()
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'fillInput') {
    handleFill(request.content)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return undefined;
});

async function handleExtract() {
  if (!provider) {
    throw new Error('当前页面不是支持的 AI 提供商');
  }

  const conversationData = await provider.extract();
  const response = await chrome.runtime.sendMessage({
    action: 'extractConversation',
    data: conversationData,
  });

  if (!response || !response.success) {
    throw new Error(response?.error || '后台处理失败');
  }

  return conversationData;
}

async function handleFill(content) {
  if (!provider) {
    throw new Error('当前页面不是支持的 AI 提供商');
  }
  await provider.fill(content);
}

async function autoExtractIfEnabled() {
  try {
    if (!provider) return;
    const config = await getConfig();
    if (config.autoSync) {
      setTimeout(() => {
        handleExtract().catch((error) => console.error('[Content] Auto-extract failed:', error));
      }, 3000);
    }
  } catch (error) {
    console.error('[Content] Auto-extract config error:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoExtractIfEnabled);
} else {
  autoExtractIfEnabled();
}

console.log('MyPromptManager content script loaded', { provider: provider?.id || 'unknown' });
