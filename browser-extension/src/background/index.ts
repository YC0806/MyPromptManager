import { getConfig, saveConfig } from '../services/config.js';
import { getProviderConfigs, refreshProviderConfigs } from '../services/dom-providers.js';
import { saveAndSyncConversation, syncAllHistories } from '../services/sync.js';
import { Conversation } from '../shared/models';

chrome.runtime.onInstalled.addListener(async () => {
  const config = await getConfig();
  await saveConfig(config);
  await refreshProviderConfigs(true);
  console.log('MyPromptManager extension installed');
});

setInterval(() => {
  refreshProviderConfigs().catch((error) => console.error('[Background] Periodic provider refresh failed', error));
}, 1000 * 60 * 30);

chrome.runtime.onMessage.addListener(
  (request: { action: string; data?: Conversation; config?: unknown }, sender, sendResponse) => {
    const handle = async () => {
      switch (request.action) {
        case 'extractConversation': {
          const result = await saveAndSyncConversation(request.data as Conversation);
          sendResponse({ success: true, data: result });
          return;
        }
        case 'getDomProviders': {
          const providers = await getProviderConfigs();
          sendResponse({ success: true, providers: providers.providers, version: providers.version });
          return;
        }
        case 'refreshDomProviders': {
          const providers = await refreshProviderConfigs(true);
          sendResponse({ success: true, providers: providers.providers, version: providers.version, source: providers.from });
          return;
        }
        case 'getConfig': {
          const config = await getConfig();
          sendResponse({ success: true, config });
          return;
        }
        case 'saveConfig': {
          const config = await saveConfig(request.config);
          sendResponse({ success: true, config });
          return;
        }
        case 'syncAll': {
          await syncAllHistories();
          sendResponse({ success: true });
          return;
        }
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    };

    handle().catch((error) => {
      console.error('[Background] Error handling message', request.action, error);
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }
);
