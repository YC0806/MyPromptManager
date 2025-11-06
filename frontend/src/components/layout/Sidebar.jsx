import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  FileText,
  FileCode,
  MessageSquare,
  Package,
  Clock,
  Radio,
  History,
  GitBranch,
  Database,
  ArrowRightLeft,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/store/useStore'

const navSections = [
  {
    title: 'Explore',
    icon: Layers,
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { name: 'Search', icon: Search, path: '/search' },
      { name: 'Projects', icon: FolderOpen, path: '/projects' },
    ],
  },
  {
    title: 'Content',
    icon: FileText,
    items: [
      { name: 'Prompts', icon: FileText, path: '/prompts' },
      { name: 'Templates', icon: FileCode, path: '/templates' },
      { name: 'Chats', icon: MessageSquare, path: '/chats' },
      { name: 'Releases', icon: Package, path: '/releases' },
      { name: 'Timeline', icon: Clock, path: '/timeline' },
      { name: 'Channels', icon: Radio, path: '/channels' },
    ],
  },
  {
    title: 'Advanced',
    icon: GitBranch,
    advanced: true,
    items: [
      { name: 'Revisions', icon: History, path: '/revisions' },
      { name: 'Repo', icon: GitBranch, path: '/repo' },
    ],
  },
  {
    title: 'Admin',
    icon: Database,
    items: [
      { name: 'Index Status', icon: Database, path: '/admin/index' },
      { name: 'Migration', icon: ArrowRightLeft, path: '/admin/migration' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { mode, sidebarCollapsed } = useStore()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  if (sidebarCollapsed) {
    return null
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white shadow-sm overflow-y-auto z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">MyPrompt</h1>
          <p className="text-xs text-zinc-500">Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {navSections.map((section) => {
          // Hide Advanced section if in Simple mode
          if (section.advanced && mode === 'simple') return null

          return (
            <div key={section.title} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-2">
                <section.icon className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs uppercase text-zinc-500 font-semibold tracking-wide">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200',
                          active
                            ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-500 font-medium'
                            : 'text-zinc-600 hover:bg-zinc-50'
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <div className="text-xs text-zinc-500 text-center">
          <p>Mode: <span className="font-semibold text-teal-600">{mode === 'simple' ? 'Simple' : 'Advanced'}</span></p>
        </div>
      </div>
    </aside>
  )
}
