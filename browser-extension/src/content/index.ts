import { detectProvider, Provider } from '../services/provider-registry';
import { getConfig } from '../services/config.js';
import { Conversation, DomProviderConfig } from '../shared/models';
import { parseConversationFromDom } from './dom-parser';
import { deserializeDomProviderConfig, matchesUrl, StoredDomProviderConfig } from '../shared/provider-config';
import { fillInput } from '../providers/utils';

let provider: Provider | undefined = detectProvider(window.location.href);
let domProviderConfig: DomProviderConfig | undefined;

async function loadProviderConfig(forceRefresh = false) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: forceRefresh ? 'refreshDomProviders' : 'getDomProviders',
    });

    const configs = (response?.providers || []).map((cfg: StoredDomProviderConfig) => deserializeDomProviderConfig(cfg));
    domProviderConfig = configs.find((cfg) => matchesUrl(cfg, window.location.href));
  } catch (error) {
    console.error('[Content] Failed to load provider configs', error);
  }

  if (!domProviderConfig && !provider && !forceRefresh) {
    await loadProviderConfig(true);
  }
}

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

async function handleExtract(): Promise<Conversation> {
  if (!domProviderConfig && !provider) {
    throw new Error('当前页面不是支持的 AI 提供商');
  }

  const conversationData = domProviderConfig
    ? parseConversationFromDom(domProviderConfig)
    : await provider!.extract();
  const response = await chrome.runtime.sendMessage({
    action: 'extractConversation',
    data: conversationData,
  });

  if (!response || !response.success) {
    throw new Error(response?.error || '后台处理失败');
  }

  return conversationData;
}

async function handleFill(content: string) {
  if (!domProviderConfig && !provider) {
    throw new Error('当前页面不是支持的 AI 提供商');
  }

  if (domProviderConfig) {
    await fillInput(content, domProviderConfig.fillSelectors);
  } else {
    await provider!.fill(content);
  }
}

async function autoExtractIfEnabled() {
  try {
    if (!domProviderConfig && !provider) return;
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

loadProviderConfig().then(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoExtractIfEnabled);
  } else {
    autoExtractIfEnabled();
  }
});

console.log('MyPromptManager content script loaded', { provider: provider?.id || domProviderConfig?.id || 'unknown' });
