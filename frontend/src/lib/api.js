/**
 * API client for MyPromptManager
 * Unified API (replaces previous simple/detail dual architecture)
 */

const API_BASE = '/v1';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ============================================================================
// Prompts API
// ============================================================================

export const promptsAPI = {
  /**
   * List all prompts
   * @param {Object} params - Query parameters (labels, limit)
   * @returns {Promise<{prompts: Array, count: number, total: number}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.labels) {
      params.labels.forEach(label => query.append('labels', label));
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const url = `${API_BASE}/prompts${query.toString() ? '?' + query.toString() : ''}`;
    return apiFetch(url);
  },

  /**
   * Get prompt by ID (HEAD version)
   * @param {string} id - Prompt ID
   * @returns {Promise<{id: string, metadata: Object, content: string}>}
   */
  get: async (id) => {
    return apiFetch(`${API_BASE}/prompts/${id}`);
  },

  /**
   * Create a new prompt
   * @param {string} content - Prompt content (with frontmatter)
   * @returns {Promise<{id: string, version_id: string, created_at: string}>}
   */
  create: async (content) => {
    return apiFetch(`${API_BASE}/prompts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Update a prompt (creates new version)
   * @param {string} id - Prompt ID
   * @param {string} content - Updated content
   * @returns {Promise<{id: string, version_id: string, updated_at: string}>}
   */
  update: async (id, content) => {
    return apiFetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Delete a prompt
   * @param {string} id - Prompt ID
   * @returns {Promise<null>}
   */
  delete: async (id) => {
    return apiFetch(`${API_BASE}/prompts/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * List all versions of a prompt
   * @param {string} id - Prompt ID
   * @returns {Promise<{prompt_id: string, versions: Array, count: number}>}
   */
  listVersions: async (id) => {
    return apiFetch(`${API_BASE}/prompts/${id}/versions`);
  },

  /**
   * Get a specific version of a prompt
   * @param {string} id - Prompt ID
   * @param {string} versionId - Version ID
   * @returns {Promise<{prompt_id: string, version_id: string, metadata: Object, content: string}>}
   */
  getVersion: async (id, versionId) => {
    return apiFetch(`${API_BASE}/prompts/${id}/versions/${versionId}`);
  },
};

// ============================================================================
// Templates API
// ============================================================================

export const templatesAPI = {
  /**
   * List all templates
   * @param {Object} params - Query parameters (labels, limit)
   * @returns {Promise<{templates: Array, count: number, total: number}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.labels) {
      params.labels.forEach(label => query.append('labels', label));
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const url = `${API_BASE}/templates${query.toString() ? '?' + query.toString() : ''}`;
    return apiFetch(url);
  },

  /**
   * Get template by ID (HEAD version)
   * @param {string} id - Template ID
   * @returns {Promise<{id: string, metadata: Object, content: string}>}
   */
  get: async (id) => {
    return apiFetch(`${API_BASE}/templates/${id}`);
  },

  /**
   * Create a new template
   * @param {string} content - Template content (with frontmatter)
   * @returns {Promise<{id: string, version_id: string, created_at: string}>}
   */
  create: async (content) => {
    return apiFetch(`${API_BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Update a template (creates new version)
   * @param {string} id - Template ID
   * @param {string} content - Updated content
   * @returns {Promise<{id: string, version_id: string, updated_at: string}>}
   */
  update: async (id, content) => {
    return apiFetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<null>}
   */
  delete: async (id) => {
    return apiFetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * List all versions of a template
   * @param {string} id - Template ID
   * @returns {Promise<{template_id: string, versions: Array, count: number}>}
   */
  listVersions: async (id) => {
    return apiFetch(`${API_BASE}/templates/${id}/versions`);
  },

  /**
   * Get a specific version of a template
   * @param {string} id - Template ID
   * @param {string} versionId - Version ID
   * @returns {Promise<{template_id: string, version_id: string, metadata: Object, content: string}>}
   */
  getVersion: async (id, versionId) => {
    return apiFetch(`${API_BASE}/templates/${id}/versions/${versionId}`);
  },
};

// ============================================================================
// Chats API
// ============================================================================

export const chatsAPI = {
  /**
   * List all chats
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise<{chats: Array, count: number, total: number}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const url = `${API_BASE}/chats${query.toString() ? '?' + query.toString() : ''}`;
    return apiFetch(url);
  },

  /**
   * Get chat by ID
   * @param {string} id - Chat ID
   * @returns {Promise<Object>} Chat data
   */
  get: async (id) => {
    return apiFetch(`${API_BASE}/chats/${id}`);
  },

  /**
   * Create a new chat
   * @param {Object} chatData - Chat data
   * @returns {Promise<{id: string, created_at: string}>}
   */
  create: async (chatData) => {
    return apiFetch(`${API_BASE}/chats`, {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  },

  /**
   * Update a chat
   * @param {string} id - Chat ID
   * @param {Object} chatData - Updated chat data
   * @returns {Promise<{id: string, updated_at: string}>}
   */
  update: async (id, chatData) => {
    return apiFetch(`${API_BASE}/chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chatData),
    });
  },

  /**
   * Delete a chat
   * @param {string} id - Chat ID
   * @returns {Promise<null>}
   */
  delete: async (id) => {
    return apiFetch(`${API_BASE}/chats/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Search & Common APIs
// ============================================================================

export const searchAPI = {
  /**
   * Search across all items
   * @param {Object} params - Search parameters
   * @returns {Promise<{items: Array, count: number, next_cursor: string}>}
   */
  search: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.labels) {
      if (Array.isArray(params.labels)) {
        params.labels.forEach(label => query.append('labels', label));
      } else {
        query.append('labels', params.labels);
      }
    }
    if (params.slug) query.append('slug', params.slug);
    if (params.author) query.append('author', params.author);
    if (params.limit) query.append('limit', params.limit);
    if (params.cursor) query.append('cursor', params.cursor);

    return apiFetch(`${API_BASE}/search?${query.toString()}`);
  },
};

export const indexAPI = {
  /**
   * Get index status
   * @returns {Promise<Object>} Status information
   */
  status: async () => {
    return apiFetch(`${API_BASE}/index/status`);
  },

  /**
   * Rebuild index
   * @returns {Promise<{status: string, stats: Object}>}
   */
  rebuild: async () => {
    return apiFetch(`${API_BASE}/index/rebuild`, {
      method: 'POST',
    });
  },
};

export const healthAPI = {
  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  check: async () => {
    return apiFetch(`${API_BASE}/health`);
  },
};

// Default export with all APIs
export default {
  prompts: promptsAPI,
  templates: templatesAPI,
  chats: chatsAPI,
  search: searchAPI,
  index: indexAPI,
  health: healthAPI,
};
