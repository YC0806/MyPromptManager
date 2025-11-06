import React, { useState } from 'react'
import { Search, Bell, HelpCircle, Menu, GitBranch, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useStore from '@/store/useStore'

export default function Topbar() {
  const {
    mode,
    setMode,
    currentProject,
    setCurrentProject,
    currentBranch,
    setCurrentBranch,
    currentChannel,
    setCurrentChannel,
    toggleSidebar,
    sidebarCollapsed,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState('')

  const handleModeToggle = () => {
    setMode(mode === 'simple' ? 'advanced' : 'simple')
  }

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-sm shadow-sm z-30 transition-all duration-200",
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

          {/* Project Selector */}
          <Select value={currentProject} onValueChange={setCurrentProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="api-docs">API Docs</SelectItem>
              <SelectItem value="customer-support">Customer Support</SelectItem>
            </SelectContent>
          </Select>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white">
            <Label htmlFor="mode-toggle" className="text-sm cursor-pointer">
              {mode === 'simple' ? 'Simple' : 'Advanced'}
            </Label>
            <Switch
              id="mode-toggle"
              checked={mode === 'advanced'}
              onCheckedChange={handleModeToggle}
            />
          </div>
        </div>

        {/* Middle Section - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search by type, label, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-16 rounded-lg shadow-sm"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-zinc-100 rounded border border-zinc-200 text-zinc-600">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Branch Selector (Advanced Mode Only) */}
          {mode === 'advanced' && (
            <Select value={currentBranch} onValueChange={setCurrentBranch}>
              <SelectTrigger className="w-[140px]">
                <GitBranch className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">main</SelectItem>
                <SelectItem value="develop">develop</SelectItem>
                <SelectItem value="feature-x">feature-x</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Channel Toggle */}
          <div className="flex gap-2">
            <Badge
              variant={currentChannel === 'prod' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCurrentChannel('prod')}
            >
              prod
            </Badge>
            <Badge
              variant={currentChannel === 'beta' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCurrentChannel('beta')}
            >
              beta
            </Badge>
          </div>

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
