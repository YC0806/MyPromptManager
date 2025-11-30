import { DEFAULT_CONFIG } from '../core/models.js';
import { getConfig as storageGetConfig, saveConfig as storageSaveConfig } from '../platform/storage.js';

export async function getConfig() {
  try {
    return await storageGetConfig();
  } catch (error) {
    console.error('[ConfigService] load failed, using defaults', error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config) {
  return storageSaveConfig(config);
}
