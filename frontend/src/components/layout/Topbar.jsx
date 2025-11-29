import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, HelpCircle, Menu, Settings, Sun, Moon, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useStore from '@/store/useStore'
import api from '@/lib/api'

export default function Topbar() {
  const {
    currentChannel,
    setCurrentChannel,
    toggleSidebar,
    sidebarCollapsed,
    theme,
    toggleTheme,
  } = useStore()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Debounced search against backend index
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const handler = setTimeout(() => {
      runSearch(searchQuery.trim())
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  const parseQuery = (query) => {
    const tokens = query.split(/\s+/)
    const labels = []
    let type
    let author
    const textParts = []

    tokens.forEach((token) => {
      if (token.startsWith('type:')) {
        type = token.replace('type:', '').toLowerCase()
      } else if (token.startsWith('label:')) {
        labels.push(token.replace('label:', ''))
      } else if (token.startsWith('author:')) {
        author = token.replace('author:', '')
      } else {
        textParts.push(token)
      }
    })

    return {
      type,
      labels,
      author,
      q: textParts.join(' ').trim(),
    }
  }

  const runSearch = async (query) => {
    try {
      setSearching(true)
      const params = parseQuery(query)
      const response = await api.search.search({
        ...params,
        q: params.q || undefined,
        labels: params.labels?.length ? params.labels : undefined,
        limit: 6,
      })
      setSearchResults(response.items || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const getRoute = (type, id) => {
    switch (type) {
      case 'template':
        return `/templates/${id}`
      case 'chat':
        return `/chats/${id}`
      default:
        return `/prompts/${id}`
    }
  }

  const handleNavigate = (item) => {
    navigate(getRoute(item.type, item.id))
    setSearchQuery('')
    setSearchResults([])
  }

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleNavigate(searchResults[0])
    }
  }

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm z-30 transition-all duration-200",
      sidebarCollapsed ? "left-0" : "left-[280px]"
    )}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Middle Section - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by type, label, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="pl-10 pr-16 rounded-lg shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300">
              ⌘K
            </kbd>
            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden">
                {searching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No results
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
                        onClick={() => handleNavigate(item)}
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type} • {item.labels?.join(', ') || 'no labels'}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New release published</p>
                  <p className="text-xs text-zinc-500">Prompt v1.2.0 is now live</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Draft saved</p>
                  <p className="text-xs text-zinc-500">Your changes have been saved</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help */}
          <Button variant="ghost" size="icon" title="Help">
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
