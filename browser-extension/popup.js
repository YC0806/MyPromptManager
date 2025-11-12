/**
 * Popup script for MyPromptManager AI History Sync
 */

// DOM elements - Sync Tab
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

// DOM elements - Library Tab
const searchInput = document.getElementById('searchInput');
const itemsList = document.getElementById('itemsList');
const itemDetailModal = document.getElementById('itemDetailModal');
const itemDetailTitle = document.getElementById('itemDetailTitle');
const itemTypeBadge = document.getElementById('itemTypeBadge');
const itemDate = document.getElementById('itemDate');
const itemContent = document.getElementById('itemContent');
const fillInputBtn = document.getElementById('fillInputBtn');
const copyBtn = document.getElementById('copyBtn');
const closeDetailModal = document.getElementById('closeDetailModal');

// State
let allItems = [];
let filteredItems = [];
let currentFilter = 'all';
let selectedItem = null;

// Initialize popup
async function init() {
  await loadStatus();
  await loadConfig();
  setupEventListeners();
  setupTabNavigation();
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
      return response.config;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  // Return default config if failed
  return {
    apiUrl: 'http://localhost:8000/v1',
    autoSync: true,
    syncInterval: 5
  };
}

// Setup event listeners
function setupEventListeners() {
  extractBtn.addEventListener('click', handleExtract);
  syncAllBtn.addEventListener('click', handleSyncAll);
  settingsBtn.addEventListener('click', toggleSettings);
  saveSettingsBtn.addEventListener('click', handleSaveSettings);
  cancelSettingsBtn.addEventListener('click', toggleSettings);

  // Library tab listeners
  searchInput.addEventListener('input', handleSearch);
  closeDetailModal.addEventListener('click', closeModal);
  copyBtn.addEventListener('click', handleCopy);
  fillInputBtn.addEventListener('click', handleFillInput);

  // Filter buttons
  document.querySelectorAll('.filter-button').forEach(btn => {
    btn.addEventListener('click', (e) => handleFilterChange(e.target.dataset.filter));
  });
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

// ============================================================================
// Library Tab Functions
// ============================================================================

// Setup tab navigation
function setupTabNavigation() {
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', async (e) => {
      const tabName = e.target.dataset.tab;

      // Update active tab button
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      if (tabName === 'sync') {
        document.getElementById('syncTab').classList.add('active');
      } else if (tabName === 'library') {
        document.getElementById('libraryTab').classList.add('active');
        // Load library items when switching to library tab
        await loadLibraryItems();
      }
    });
  });
}

// Load prompts and templates from API
async function loadLibraryItems() {
  try {
    console.log('[Library] 开始加载 Prompts 和 Templates...');
    itemsList.innerHTML = '<div class="loading">加载中...</div>';

    const config = await loadConfig();
    const apiUrl = config.apiUrl;
    console.log('[Library] API URL:', apiUrl);

    // Fetch prompts and templates
    console.log('[Library] 发送API请求...');
    const [promptsRes, templatesRes] = await Promise.all([
      fetch(`${apiUrl}/prompts?limit=50`),
      fetch(`${apiUrl}/templates?limit=50`)
    ]);

    console.log('[Library] Prompts响应状态:', promptsRes.status);
    console.log('[Library] Templates响应状态:', templatesRes.status);

    if (!promptsRes.ok || !templatesRes.ok) {
      const promptsError = !promptsRes.ok ? `Prompts: ${promptsRes.status}` : '';
      const templatesError = !templatesRes.ok ? `Templates: ${templatesRes.status}` : '';
      throw new Error(`API请求失败 - ${promptsError} ${templatesError}`);
    }

    const promptsData = await promptsRes.json();
    const templatesData = await templatesRes.json();

    console.log('[Library] Prompts数量:', promptsData.prompts.length);
    console.log('[Library] Templates数量:', templatesData.templates.length);

    // Combine and format items
    allItems = [
      ...promptsData.prompts.map(p => ({ ...p, type: 'prompt' })),
      ...templatesData.templates.map(t => ({ ...t, type: 'template' }))
    ];

    console.log('[Library] 总共加载项目:', allItems.length);

    // Sort by updated_at
    allItems.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });

    console.log('[Library] 排序完成，调用 filterItems()');
    filterItems();
  } catch (error) {
    console.error('[Library] 加载失败:', error);
    console.error('[Library] 错误详情:', error.stack);
    itemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">加载失败</div>
        <div class="empty-state-hint">${error.message}</div>
      </div>
    `;
  }
}

// Filter items based on current filter and search
function filterItems() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  filteredItems = allItems.filter(item => {
    // Filter by type
    if (currentFilter !== 'all' && item.type !== currentFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return title.includes(searchTerm) || description.includes(searchTerm);
    }

    return true;
  });

  renderItems();
}

// Render items list
function renderItems() {
  if (filteredItems.length === 0) {
    itemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">没有找到内容</div>
        <div class="empty-state-hint">尝试调整搜索条件或筛选器</div>
      </div>
    `;
    return;
  }

  itemsList.innerHTML = filteredItems.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div class="item-card-header">
        <div class="item-title">${escapeHtml(item.title || 'Untitled')}</div>
        <span class="item-type-badge ${item.type}">${item.type === 'prompt' ? 'Prompt' : 'Template'}</span>
      </div>
      ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ''}
      <div class="item-meta">
        <span class="item-date">${formatDate(item.updated_at || item.created_at)}</span>
      </div>
    </div>
  `).join('');

  // Add click listeners to item cards
  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => handleItemClick(card.dataset.id));
  });
}

// Handle search input
function handleSearch() {
  filterItems();
}

// Handle filter change
function handleFilterChange(filter) {
  currentFilter = filter;

  // Update active filter button
  document.querySelectorAll('.filter-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  filterItems();
}

// Handle item card click
async function handleItemClick(itemId) {
  try {
    selectedItem = allItems.find(item => item.id === itemId);
    if (!selectedItem) return;

    // Fetch full item details
    const config = await loadConfig();
    const apiUrl = config.apiUrl;
    const endpoint = selectedItem.type === 'prompt' ? 'prompts' : 'templates';

    const response = await fetch(`${apiUrl}/${endpoint}/${itemId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch item details');
    }

    const data = await response.json();

    // Update modal content
    itemDetailTitle.textContent = data.metadata.title || 'Untitled';
    itemTypeBadge.textContent = selectedItem.type === 'prompt' ? 'Prompt' : 'Template';
    itemTypeBadge.className = `item-type-badge ${selectedItem.type}`;
    itemDate.textContent = formatDate(data.metadata.updated_at || data.metadata.created_at);
    itemContent.textContent = data.content || '';

    // Store full content for copy/fill
    selectedItem.fullContent = data.content;

    // Show modal
    itemDetailModal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading item details:', error);
    alert('加载内容失败：' + error.message);
  }
}

// Close modal
function closeModal() {
  itemDetailModal.classList.add('hidden');
  selectedItem = null;
}

// Handle copy to clipboard
async function handleCopy() {
  if (!selectedItem || !selectedItem.fullContent) return;

  try {
    await navigator.clipboard.writeText(selectedItem.fullContent);

    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '已复制！';
    copyBtn.style.background = '#10b981';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('复制失败：' + error.message);
  }
}

// Handle fill input (send to content script)
async function handleFillInput() {
  if (!selectedItem || !selectedItem.fullContent) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const provider = detectProvider(tab.url);

    if (!provider) {
      alert('当前页面不是支持的 AI 提供商');
      return;
    }

    // Send message to content script to fill input
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'fillInput',
      content: selectedItem.fullContent
    });

    if (response && response.success) {
      // Visual feedback
      const originalText = fillInputBtn.textContent;
      fillInputBtn.textContent = '已填入！';
      fillInputBtn.style.background = '#10b981';

      setTimeout(() => {
        fillInputBtn.textContent = originalText;
        fillInputBtn.style.background = '';
        closeModal();
      }, 1500);
    } else {
      alert('填入失败：' + (response?.error || '未知错误'));
    }
  } catch (error) {
    console.error('Error filling input:', error);
    alert('填入失败：' + error.message);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} 周前`;
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
init();
