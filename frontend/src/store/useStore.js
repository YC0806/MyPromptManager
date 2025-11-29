import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      // Current Channel
      currentChannel: 'prod', // 'prod' or 'beta'
      setCurrentChannel: (channel) => set({ currentChannel: channel }),

      // View Mode (for lists)
      viewMode: 'table', // 'table' or 'cards'
      setViewMode: (mode) => set({ viewMode: mode }),

      // Theme Mode
      theme: 'light', // 'light' or 'dark'
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

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
    }),
    {
      name: 'prompt-manager-storage',
      partialize: (state) => ({
        theme: state.theme,
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

export default useStore
