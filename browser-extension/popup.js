/**
 * Popup script for MyPromptManager AI History Sync
 */

// DOM elements
const currentProviderEl = document.getElementById('currentProvider');
const autoSyncStatusEl = document.getElementById('autoSyncStatus');
const savedCountEl = document.getElementById('savedCount');
const extractBtn = document.getElementById('extractBtn');
const syncAllBtn = document.getElementById('syncAllBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsSection = document.getElementById('settingsSection');
const apiUrlInput = document.getElementById('apiUrl');
const autoSyncToggle = document.getElementById('autoSyncToggle');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

// Initialize popup
async function init() {
  await loadStatus();
  await loadConfig();
  setupEventListeners();
}

// Load current status
async function loadStatus() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Detect provider from URL
    const provider = detectProvider(tab.url);
    currentProviderEl.textContent = provider || '未检测到';

    // Get saved conversation count
    const items = await chrome.storage.local.get(null);
    const historyCount = Object.keys(items).filter(key => key.startsWith('history_')).length;
    savedCountEl.textContent = historyCount;

    // Get config
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (response.success) {
      autoSyncStatusEl.textContent = response.config.autoSync ? '已启用' : '已禁用';
      autoSyncStatusEl.className = response.config.autoSync ? 'status-badge active' : 'status-badge inactive';
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

// Load configuration
async function loadConfig() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (response.success) {
      apiUrlInput.value = response.config.apiUrl;
      autoSyncToggle.checked = response.config.autoSync;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  extractBtn.addEventListener('click', handleExtract);
  syncAllBtn.addEventListener('click', handleSyncAll);
  settingsBtn.addEventListener('click', toggleSettings);
  saveSettingsBtn.addEventListener('click', handleSaveSettings);
  cancelSettingsBtn.addEventListener('click', toggleSettings);
}

// Handle extract current conversation
async function handleExtract() {
  try {
    extractBtn.disabled = true;
    extractBtn.textContent = '提取中...';

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractConversation' });

    if (response && response.success) {
      alert('对话提取成功！');
      await loadStatus();
    } else {
      alert('对话提取失败：' + (response?.error || '未知错误'));
    }
  } catch (error) {
    console.error('Error extracting conversation:', error);
    alert('对话提取失败：' + error.message);
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = '提取当前对话';
  }
}

// Handle sync all conversations
async function handleSyncAll() {
  try {
    syncAllBtn.disabled = true;
    syncAllBtn.textContent = '同步中...';

    const items = await chrome.storage.local.get(null);
    const historyItems = Object.entries(items)
      .filter(([key]) => key.startsWith('history_'))
      .map(([, value]) => value);

    let successCount = 0;
    let failCount = 0;

    for (const item of historyItems) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'extractConversation',
          data: item
        });

        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    alert(`同步完成！成功：${successCount}，失败：${failCount}`);
  } catch (error) {
    console.error('Error syncing all:', error);
    alert('同步失败：' + error.message);
  } finally {
    syncAllBtn.disabled = false;
    syncAllBtn.textContent = '同步所有对话';
  }
}

// Toggle settings section
function toggleSettings() {
  settingsSection.classList.toggle('hidden');
}

// Handle save settings
async function handleSaveSettings() {
  try {
    const config = {
      apiUrl: apiUrlInput.value,
      autoSync: autoSyncToggle.checked,
      syncInterval: 5, // minutes
    };

    const response = await chrome.runtime.sendMessage({
      action: 'saveConfig',
      config
    });

    if (response.success) {
      alert('设置保存成功！');
      toggleSettings();
      await loadStatus();
    } else {
      alert('设置保存失败：' + response.error);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('设置保存失败：' + error.message);
  }
}

// Detect AI provider from URL
function detectProvider(url) {
  if (!url) return null;

  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    return 'ChatGPT';
  } else if (url.includes('chat.deepseek.com')) {
    return 'DeepSeek';
  } else if (url.includes('claude.ai')) {
    return 'Claude';
  } else if (url.includes('gemini.google.com')) {
    return 'Gemini';
  }

  return null;
}

// Initialize on load
init();
