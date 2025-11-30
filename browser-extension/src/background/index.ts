import { getConfig, saveConfig } from '../services/config.js';
import { saveAndSyncConversation, syncAllHistories } from '../services/sync.js';
import { Conversation } from '../shared/models';

chrome.runtime.onInstalled.addListener(async () => {
  const config = await getConfig();
  await saveConfig(config);
  console.log('MyPromptManager extension installed');
});

chrome.runtime.onMessage.addListener(
  (request: { action: string; data?: Conversation; config?: unknown }, sender, sendResponse) => {
    const handle = async () => {
      switch (request.action) {
        case 'extractConversation': {
          const result = await saveAndSyncConversation(request.data as Conversation);
          sendResponse({ success: true, data: result });
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
