import { getConfig } from './config.js';
import { getJson } from '../platform/http.js';
import { getLocal, saveLocal } from '../platform/storage.js';
import {
  BUILTIN_PROVIDER_CONFIGS,
  deserializeDomProviderConfig,
  StoredDomProviderConfig,
} from '../shared/provider-config';
import { DomProviderConfig } from '../shared/models';

const PROVIDER_CACHE_KEY = 'dom_provider_configs';
const PROVIDER_VERSION_KEY = 'dom_provider_version';
const PROVIDER_UPDATED_AT_KEY = 'dom_provider_updated_at';
const REFRESH_INTERVAL_MS = 1000 * 60 * 30; // 30 minutes

interface ProviderResponse {
  version?: string;
  providers?: StoredDomProviderConfig[];
}

async function saveCache(providers: StoredDomProviderConfig[], version?: string) {
  await saveLocal(PROVIDER_CACHE_KEY, providers);
  if (version) {
    await saveLocal(PROVIDER_VERSION_KEY, version);
  }
  await saveLocal(PROVIDER_UPDATED_AT_KEY, Date.now());
}

async function loadCache() {
  const [providers, version, updatedAt] = await Promise.all([
    getLocal(PROVIDER_CACHE_KEY),
    getLocal(PROVIDER_VERSION_KEY),
    getLocal(PROVIDER_UPDATED_AT_KEY),
  ]);

  return { providers: providers as StoredDomProviderConfig[] | undefined, version: version as string | undefined, updatedAt: (updatedAt as number) || 0 };
}

function toRuntimeConfigs(providers: StoredDomProviderConfig[] = []): DomProviderConfig[] {
  return providers.map((config) => deserializeDomProviderConfig(config));
}

export async function refreshProviderConfigs(force = false) {
  const cached = await loadCache();

  try {
    const config = await getConfig();
    const data = (await getJson(`${config.apiUrl}/providers`)) as ProviderResponse;

    if (!force && cached.version && data.version && cached.version === data.version && cached.providers?.length) {
      return { providers: cached.providers, runtimeConfigs: toRuntimeConfigs(cached.providers), version: cached.version, from: 'cache' as const };
    }

    if (!data.providers?.length) {
      throw new Error('Empty provider response');
    }

    await saveCache(data.providers, data.version);
    return { providers: data.providers, runtimeConfigs: toRuntimeConfigs(data.providers), version: data.version, from: 'remote' as const };
  } catch (error) {
    console.error('[DomProviders] Failed to refresh provider configs', error);

    if (cached.providers?.length) {
      return { providers: cached.providers, runtimeConfigs: toRuntimeConfigs(cached.providers), version: cached.version, from: 'cache' as const };
    }

    return {
      providers: BUILTIN_PROVIDER_CONFIGS,
      runtimeConfigs: toRuntimeConfigs(BUILTIN_PROVIDER_CONFIGS),
      version: 'builtin',
      from: 'builtin' as const,
    };
  }
}

export async function getProviderConfigs(): Promise<{ providers: StoredDomProviderConfig[]; runtimeConfigs: DomProviderConfig[]; version?: string }> {
  const cached = await loadCache();
  const isStale = !cached.providers?.length || Date.now() - cached.updatedAt > REFRESH_INTERVAL_MS;

  if (isStale) {
    const refreshed = await refreshProviderConfigs();
    if (refreshed.providers.length) return refreshed;
  }

  if (cached.providers?.length) {
    return { providers: cached.providers, runtimeConfigs: toRuntimeConfigs(cached.providers), version: cached.version };
  }

  return {
    providers: BUILTIN_PROVIDER_CONFIGS,
    runtimeConfigs: toRuntimeConfigs(BUILTIN_PROVIDER_CONFIGS),
    version: 'builtin',
  };
}
