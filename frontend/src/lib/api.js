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
   * @returns {Promise<{items: Array, count: number, total: number}>}
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
   * Get prompt by ID (HEAD version metadata)
   * @param {string} id - Prompt ID
   * @returns {Promise<{id: string, title: string, type: string, labels: Array, description: string, updated_at: string, created_at: string, author: string}>}
   */
  get: async (id) => {
    return apiFetch(`${API_BASE}/prompts/${id}`);
  },

  /**
   * Create a new prompt
   * @param {string} title - Prompt title
   * @param {string} content - Prompt content
   * @param {Array} labels - Labels (optional, default: [])
   * @param {string} description - Description (optional, default: '')
   * @returns {Promise<{success: boolean, id: string, version_id: string}>}
   */
  create: async (title, content, labels, description) => {
    return apiFetch(`${API_BASE}/prompts`, {
      method: 'POST',
      body: JSON.stringify({ title, content, labels, description}),
    });
  },

  /**
   * Update a prompt (metadata only, not content)
   * @param {string} id - Prompt ID
   * @param {string} title - Prompt Title
   * @param {Array} labels - Labels (optional)
   * @param {string} description - Description (optional)
   * @returns {Promise<{success: boolean, id: string}>}
   */
  update: async (id, title, labels, description) => {
    return apiFetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, labels, description }),
    });
  },

  /**
   * Delete a prompt
   * @param {string} id - Prompt ID
   * @returns {Promise<{success: boolean, id: string}>}
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
   * Create a new version of a prompt
   * @param {string} id - Prompt ID
   * @param {string} version_number - Version Number
   * @param {string} content - Version Content
   * @returns {Promise<{id: string, version_id: string}>}
   */
  createVersion: async (id, version_number, content) => {
      return apiFetch(`${API_BASE}/prompts/${id}/versions`, {
          method: 'POST',
          body: JSON.stringify({version_number, content}),
    });
  },

  /**
   * Get a specific version of a prompt
   * @param {string} id - Prompt ID
   * @param {string} versionId - Version ID
   * @returns {Promise<{prompt_id: string, id: string, version_number: string, created_at: string, author: string, content: string}>}
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
   * @returns {Promise<{items: Array, count: number, total: number}>}
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
   * Get template by ID (HEAD version metadata)
   * @param {string} id - Template ID
   * @returns {Promise<{id: string, title: string, type: string, labels: Array, description: string, updated_at: string, created_at: string, author: string}>}
   */
  get: async (id) => {
    return apiFetch(`${API_BASE}/templates/${id}`);
  },

  /**
   * Create a new template
   * @param {string} title - Template title
   * @param {string} content - Template content
   * @param {Array} labels - Labels (optional, default: [])
   * @param {string} description - Description (optional, default: '')
   * @param {Array} variables - Variables (optional, format: [{name, type, description, default}])
   * @returns {Promise<{id: string, version_id: string}>}
   */
  create: async (title, content, labels, description, variables) => {
    return apiFetch(`${API_BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify({ title, content, labels, description, variables}),
    });
  },

  /**
   * Update a template (metadata only, not content)
   * @param {string} id - Template ID
   * @param {string} title - Template Title
   * @param {Array} labels - Labels (optional)
   * @param {string} description - Description (optional)
   * @returns {Promise<{success: boolean, id: string}>}
   */
  update: async (id, title, labels, description) => {
    return apiFetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, labels, description }),
    });
  },

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<{success: boolean, id: string}>}
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
   * Create a new version of a template
   * @param {string} id - Template ID
   * @param {string} version_number - Version Number
   * @param {string} content - Version Content
   * @param {Array} variables - Template variables (optional, format: [{name, type, description, default}])
   * @returns {Promise<{id: string, version_id: string}>}
   */
  createVersion: async (id, version_number, content, variables = []) => {
    return apiFetch(`${API_BASE}/templates/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify({ version_number, content, variables }),
    });
  },

  /**
   * Get a specific version of a template
   * @param {string} id - Template ID
   * @param {string} versionId - Version ID
   * @returns {Promise<{template_id: string, id: string, version_number: string, created_at: string, author: string, content: string, variables: Array}>}
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
   * @param {Object} params - Query parameters (provider, limit)
   * @returns {Promise<{chats: Array, count: number, total: number}>}
   */
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.provider) {
      query.append('provider', params.provider);
    }
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
   * Create a new chat (or update if conversation_id matches)
   * @param {Object} chatData - Chat data (title, description, provider, conversation_id, messages, tags, created_at)
   * @returns {Promise<{id: string, created_at: string, message: string}>} or {Promise<{id: string, updated_at: string, message: string}>} if updating
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
   * @param {Object} chatData - Updated chat data (title, description, messages, tags, etc.)
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
   * @param {Object} params - Search parameters (type, labels, author, limit, cursor)
   * @returns {Promise<Array>} Currently returns empty array (implementation incomplete on backend)
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
    if (params.author) query.append('author', params.author);
    if (params.limit) query.append('limit', params.limit);
    if (params.cursor) query.append('cursor', params.cursor);

    return apiFetch(`${API_BASE}/search?${query.toString()}`);
  },
};

// Default export with all APIs
export default {
  prompts: promptsAPI,
  templates: templatesAPI,
  chats: chatsAPI,
  search: searchAPI,
};
