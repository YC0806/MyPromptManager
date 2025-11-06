import { create } from 'zustand'

const useStore = create((set) => ({
  // UI Mode
  mode: localStorage.getItem('mode') || 'simple', // 'simple' or 'advanced'
  setMode: (mode) => {
    localStorage.setItem('mode', mode)
    set({ mode })
  },

  // Current Branch (for advanced mode)
  currentBranch: localStorage.getItem('currentBranch') || 'main',
  setCurrentBranch: (branch) => {
    localStorage.setItem('currentBranch', branch)
    set({ currentBranch: branch })
  },

  // Current Channel
  currentChannel: 'prod', // 'prod' or 'beta'
  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  // View Mode (for lists)
  viewMode: 'table', // 'table' or 'cards'
  setViewMode: (mode) => set({ viewMode: mode }),

  // Selected Prompt
  selectedPrompt: null,
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),

  // Filters
  filters: {
    types: [],
    labels: [],
    authors: [],
    dateRange: null,
  },
  setFilters: (filters) => set({ filters }),

  // Search Query
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Sidebar collapsed state
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Inspector visible state
  inspectorVisible: false,
  setInspectorVisible: (visible) => set({ inspectorVisible: visible }),
}))

export default useStore
