import { getConfig } from './config.js';
import { getJson } from '../platform/http.js';

export async function fetchLibraryItems(limit = 50) {
  const config = await getConfig();
  const [promptsRes, templatesRes] = await Promise.all([
    getJson(`${config.apiUrl}/prompts?limit=${limit}`),
    getJson(`${config.apiUrl}/templates?limit=${limit}`),
  ]);

  const prompts = (promptsRes.items || []).map((item) => ({ ...item, type: 'prompt' }));
  const templates = (templatesRes.items || []).map((item) => ({ ...item, type: 'template' }));

  const items = [...prompts, ...templates].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB - dateA;
  });

  return { items, apiUrl: config.apiUrl };
}

export async function fetchItemDetail(id, type) {
  const config = await getConfig();
  const endpoint = type === 'template' ? 'templates' : 'prompts';

  const meta = await getJson(`${config.apiUrl}/${endpoint}/${id}`);

  let content = '';
  let variables = [];

  try {
    const versions = await getJson(`${config.apiUrl}/${endpoint}/${id}/versions`);
    if (versions.versions?.length) {
      const latestId = versions.versions[0].id;
      const versionData = await getJson(`${config.apiUrl}/${endpoint}/${id}/versions/${latestId}`);
      content = versionData.content || '';
      variables = versionData.variables || [];
    }
  } catch (error) {
    console.error('[LibraryService] Failed to load versions', error);
  }

  return {
    ...meta,
    type,
    content,
    variables,
  };
}
