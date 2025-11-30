import { DEFAULT_CONFIG } from '../core/models.js';

const CONFIG_KEY = 'config';

export async function getConfig() {
  const result = await chrome.storage.sync.get(CONFIG_KEY);
  return {
    ...DEFAULT_CONFIG,
    ...(result[CONFIG_KEY] || {}),
  };
}

export async function saveConfig(config) {
  await chrome.storage.sync.set({ [CONFIG_KEY]: { ...DEFAULT_CONFIG, ...config } });
  return getConfig();
}

export async function saveLocal(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

export async function getLocal(key) {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

export async function getAllLocal() {
  return chrome.storage.local.get(null);
}

export async function listHistories() {
  const items = await getAllLocal();
  return Object.entries(items)
    .filter(([key]) => key.startsWith('history_'))
    .map(([, value]) => value);
}
