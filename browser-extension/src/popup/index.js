import { detectProvider } from '../services/provider-registry.js';
import { getConfig, saveConfig } from '../services/config.js';
import { fetchLibraryItems, fetchItemDetail } from '../services/library.js';
import { renderTemplate } from '../core/template.js';

// DOM elements - Sync Tab
const currentProviderEl = document.getElementById('currentProvider');
const savedCountEl = document.getElementById('savedCount');
const extractBtn = document.getElementById('extractBtn');
const syncAllBtn = document.getElementById('syncAllBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsSection = document.getElementById('settingsSection');
const apiUrlInput = document.getElementById('apiUrl');
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
const templateVariablesSection = document.getElementById('templateVariablesSection');
const templateVariablesForm = document.getElementById('templateVariablesForm');
const renderTemplateBtn = document.getElementById('renderTemplateBtn');
const fillInputBtn = document.getElementById('fillInputBtn');
const copyBtn = document.getElementById('copyBtn');
const closeDetailModal = document.getElementById('closeDetailModal');

const state = {
  allItems: [],
  filteredItems: [],
  currentFilter: 'all',
  selectedItem: null,
  config: null,
};

async function init() {
  state.config = await loadConfigIntoUI();
  await loadStatus();
  setupEventListeners();
  setupTabNavigation();
}

async function loadStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const provider = tab ? detectProvider(tab.url) : null;
    currentProviderEl.textContent = provider?.id || '未检测到';

    const items = await chrome.storage.local.get(null);
    const historyCount = Object.keys(items).filter((key) => key.startsWith('history_')).length;
    savedCountEl.textContent = historyCount;
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

async function loadConfigIntoUI() {
  try {
    const config = await getConfig();
    apiUrlInput.value = config.apiUrl;
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return { apiUrl: 'http://localhost:8000/v1' };
  }
}

function setupEventListeners() {
  extractBtn.addEventListener('click', handleExtract);
  syncAllBtn.addEventListener('click', handleSyncAll);
  settingsBtn.addEventListener('click', toggleSettings);
  saveSettingsBtn.addEventListener('click', handleSaveSettings);
  cancelSettingsBtn.addEventListener('click', toggleSettings);

  searchInput.addEventListener('input', handleSearch);
  closeDetailModal.addEventListener('click', closeModal);
  copyBtn.addEventListener('click', handleCopy);
  fillInputBtn.addEventListener('click', handleFillInput);
  if (renderTemplateBtn) {
    renderTemplateBtn.addEventListener('click', handleRenderTemplate);
  }

  document.querySelectorAll('.filter-button').forEach((btn) => {
    btn.addEventListener('click', (e) => handleFilterChange(e.target.dataset.filter));
  });
}

async function handleExtract() {
  try {
    extractBtn.disabled = true;
    extractBtn.textContent = '提取中...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const provider = tab ? detectProvider(tab.url) : null;
    if (!provider) {
      alert('当前页面不是支持的 AI 提供商。\n\n支持的提供商：ChatGPT, DeepSeek, Claude, Gemini, Doubao');
      return;
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'extractConversation' });
    } catch (error) {
      if (error.message.includes('Could not establish connection') ||
        error.message.includes('Receiving end does not exist')) {
        alert('内容脚本未加载。\n\n请刷新页面后重试，或确保您在对话页面上。');
        return;
      }
      throw error;
    }

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

async function handleSyncAll() {
  try {
    syncAllBtn.disabled = true;
    syncAllBtn.textContent = '同步中...';

    const response = await chrome.runtime.sendMessage({ action: 'syncAll' });
    if (response?.success) {
      alert('所有对话同步完成！');
    } else {
      alert('同步失败：' + (response?.error || '未知错误'));
    }
  } catch (error) {
    console.error('Error syncing all:', error);
    alert('同步失败：' + error.message);
  } finally {
    syncAllBtn.disabled = false;
    syncAllBtn.textContent = '同步所有对话';
  }
}

function toggleSettings() {
  settingsSection.classList.toggle('hidden');
}

async function handleSaveSettings() {
  try {
    const config = { apiUrl: apiUrlInput.value };
    const saved = await saveConfig(config);
    state.config = saved;
    alert('设置保存成功！');
    toggleSettings();
    await loadStatus();
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('设置保存失败：' + error.message);
  }
}

function setupTabNavigation() {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', async (e) => {
      const tabName = e.target.dataset.tab;

      document.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
      e.target.classList.add('active');

      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });

      if (tabName === 'sync') {
        const syncTab = document.getElementById('syncTab');
        syncTab.classList.add('active');
        syncTab.classList.remove('hidden');
      } else if (tabName === 'library') {
        const libraryTab = document.getElementById('libraryTab');
        libraryTab.classList.add('active');
        libraryTab.classList.remove('hidden');
        await loadLibraryItems();
      }
    });
  });
}

async function loadLibraryItems() {
  try {
    itemsList.innerHTML = '<div class="loading">加载中...</div>';
    const { items } = await fetchLibraryItems();
    state.allItems = items;
    filterItems();
  } catch (error) {
    console.error('[Library] 加载失败:', error);
    itemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">加载失败</div>
        <div class="empty-state-hint">${error.message}</div>
      </div>
    `;
  }
}

function filterItems() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  state.filteredItems = state.allItems.filter((item) => {
    if (state.currentFilter !== 'all' && item.type !== state.currentFilter) {
      return false;
    }
    if (searchTerm) {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return title.includes(searchTerm) || description.includes(searchTerm);
    }
    return true;
  });

  renderItems();
}

function renderItems() {
  if (!state.filteredItems.length) {
    itemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">没有找到内容</div>
        <div class="empty-state-hint">尝试调整搜索条件或筛选器</div>
      </div>
    `;
    return;
  }

  itemsList.innerHTML = state.filteredItems.map((item) => `
    <div class="item-card" data-id="${item.id}" data-type="${item.type}">
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

  document.querySelectorAll('.item-card').forEach((card) => {
    card.addEventListener('click', () => handleItemClick(card.dataset.id, card.dataset.type));
  });
}

function handleSearch() {
  filterItems();
}

function handleFilterChange(filter) {
  state.currentFilter = filter;
  document.querySelectorAll('.filter-button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  filterItems();
}

async function handleItemClick(itemId, type) {
  try {
    state.selectedItem = state.allItems.find((item) => item.id === itemId && item.type === type);
    if (!state.selectedItem) return;

    const data = await fetchItemDetail(itemId, type);

    itemDetailTitle.textContent = data.title || state.selectedItem.title || 'Untitled';
    itemTypeBadge.textContent = state.selectedItem.type === 'prompt' ? 'Prompt' : 'Template';
    itemTypeBadge.className = `item-type-badge ${state.selectedItem.type}`;
    itemDate.textContent = formatDate(data.updated_at || data.created_at);
    itemContent.textContent = data.content || 'No content available';

    state.selectedItem.fullContent = data.content || '';
    state.selectedItem.variables = data.variables || [];
    state.selectedItem.originalContent = data.content || '';

    if (state.selectedItem.type === 'template' && state.selectedItem.variables.length > 0) {
      renderTemplateVariables(state.selectedItem.variables);
      templateVariablesSection.classList.remove('hidden');
      fillInputBtn.classList.add('hidden');
      copyBtn.classList.add('hidden');
      renderTemplateBtn.classList.remove('hidden');
    } else {
      templateVariablesSection.classList.add('hidden');
      fillInputBtn.classList.remove('hidden');
      copyBtn.classList.remove('hidden');
      if (renderTemplateBtn) {
        renderTemplateBtn.classList.add('hidden');
      }
    }

    itemDetailModal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading item details:', error);
    alert('加载内容失败：' + error.message);
  }
}

function closeModal() {
  itemDetailModal.classList.add('hidden');
  state.selectedItem = null;
  if (templateVariablesForm) {
    templateVariablesForm.innerHTML = '';
  }
}

function renderTemplateVariables(variables) {
  if (!templateVariablesForm) return;
  templateVariablesForm.innerHTML = '';

  variables.forEach((variable) => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'input-group';

    const label = document.createElement('label');
    label.className = 'input-label';
    label.textContent = variable.name || variable.key;
    if (variable.description) {
      label.title = variable.description;
      label.textContent += ` (${variable.description})`;
    }

    const defaultValue = variable.default !== undefined ? variable.default : variable.default_value;
    let inputElement;
    if (defaultValue && String(defaultValue).length > 50) {
      inputElement = document.createElement('textarea');
      inputElement.className = 'input-field';
      inputElement.rows = 3;
    } else {
      inputElement = document.createElement('input');
      if (variable.type === 'int' || variable.type === 'float') {
        inputElement.type = 'number';
        if (variable.type === 'float') inputElement.step = 'any';
      } else if (variable.type === 'bool') {
        inputElement.type = 'checkbox';
        inputElement.checked = defaultValue === true || defaultValue === 'true';
      } else {
        inputElement.type = 'text';
      }
      inputElement.className = 'input-field';
    }

    inputElement.name = variable.name || variable.key;

    if (variable.type === 'bool') {
      inputElement.checked = defaultValue === true || defaultValue === 'true';
    } else {
      inputElement.placeholder = defaultValue !== undefined ? String(defaultValue) : `Enter ${variable.name || variable.key}`;
      inputElement.value = defaultValue !== undefined ? String(defaultValue) : '';
    }

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(inputElement);
    templateVariablesForm.appendChild(fieldDiv);
  });
}

function handleRenderTemplate() {
  if (!state.selectedItem || !state.selectedItem.variables) return;
  try {
    const inputs = templateVariablesForm.querySelectorAll('input, textarea');
    const values = {};
    inputs.forEach((input) => {
      if (input.type === 'checkbox') {
        values[input.name] = input.checked;
      } else {
        values[input.name] = input.value || input.placeholder;
      }
    });

    const renderedContent = renderTemplate(state.selectedItem.originalContent, state.selectedItem.variables, values);
    itemContent.textContent = renderedContent;
    state.selectedItem.fullContent = renderedContent;

    fillInputBtn.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
    renderTemplateBtn.classList.add('hidden');

    const originalText = renderTemplateBtn.textContent;
    renderTemplateBtn.textContent = '已渲染！';
    renderTemplateBtn.style.background = '#10b981';
    setTimeout(() => {
      renderTemplateBtn.textContent = originalText;
      renderTemplateBtn.style.background = '';
    }, 2000);
  } catch (error) {
    console.error('Error rendering template:', error);
    alert('渲染模版失败：' + error.message);
  }
}

async function handleCopy() {
  if (!state.selectedItem || !state.selectedItem.fullContent) return;
  try {
    await navigator.clipboard.writeText(state.selectedItem.fullContent);
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

async function handleFillInput() {
  if (!state.selectedItem || !state.selectedItem.fullContent) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const provider = tab ? detectProvider(tab.url) : null;
    if (!provider) {
      alert('当前页面不是支持的 AI 提供商');
      return;
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillInput',
        content: state.selectedItem.fullContent,
      });
    } catch (error) {
      if (error.message.includes('Could not establish connection') ||
        error.message.includes('Receiving end does not exist')) {
        alert('内容脚本未加载。\n\n请刷新页面后重试。');
        return;
      }
      throw error;
    }

    if (response && response.success) {
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

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
