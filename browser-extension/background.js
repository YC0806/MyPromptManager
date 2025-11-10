/**
 * Background Service Worker for MyPromptManager AI History Sync
 */

// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:8000/api/v1',
  autoSync: true,
  syncInterval: 5, // minutes
};

// Load configuration from storage
async function loadConfig() {
  const result = await chrome.storage.sync.get('config');
  return result.config || DEFAULT_CONFIG;
}

// Save configuration to storage
async function saveConfig(config) {
  await chrome.storage.sync.set({ config });
}

// Initialize configuration on install
chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadConfig();
  await saveConfig(config);
  console.log('MyPromptManager AI History Sync 已安装');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractConversation') {
    handleConversationExtraction(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }

  if (request.action === 'getConfig') {
    loadConfig()
      .then(config => sendResponse({ success: true, config }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'saveConfig') {
    saveConfig(request.config)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle conversation extraction and sync
async function handleConversationExtraction(conversationData) {
  try {
    const config = await loadConfig();

    // Save to local storage first
    const historyKey = `history_${conversationData.provider}_${conversationData.conversationId}`;
    await chrome.storage.local.set({ [historyKey]: conversationData });

    // Sync to backend if auto-sync is enabled
    if (config.autoSync) {
      await syncToBackend(conversationData, config.apiUrl);
    }

    return { saved: true, synced: config.autoSync };
  } catch (error) {
    console.error('Error handling conversation extraction:', error);
    throw error;
  }
}

// Sync conversation to backend API
async function syncToBackend(conversationData, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/ai-histories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: conversationData.provider,
        conversation_id: conversationData.conversationId,
        title: conversationData.title,
        messages: conversationData.messages,
        metadata: conversationData.metadata,
        extracted_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Conversation synced to backend:', result);
    return result;
  } catch (error) {
    console.error('Error syncing to backend:', error);
    throw error;
  }
}

// Periodic sync of all saved conversations
async function periodicSync() {
  try {
    const config = await loadConfig();
    if (!config.autoSync) return;

    const items = await chrome.storage.local.get(null);
    const historyItems = Object.entries(items)
      .filter(([key]) => key.startsWith('history_'))
      .map(([, value]) => value);

    for (const item of historyItems) {
      try {
        await syncToBackend(item, config.apiUrl);
      } catch (error) {
        console.error(`Failed to sync conversation ${item.conversationId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during periodic sync:', error);
  }
}

// Set up periodic sync
setInterval(async () => {
  const config = await loadConfig();
  if (config.autoSync) {
    await periodicSync();
  }
}, 5 * 60 * 1000); // Every 5 minutes
