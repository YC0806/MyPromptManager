import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, LayoutGrid, List, MoreVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Breadcrumb from '@/components/layout/Breadcrumb'
import useStore from '@/store/useStore'
import { searchAPI } from '@/lib/api'
import { formatDate, getLabelColor } from '@/lib/utils'

export default function ChatsList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    label: '',
    author: '',
  })

  useEffect(() => {
    loadChats()
  }, [filters])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await searchAPI.search({
        type: 'chat', // Only fetch chats
        labels: filters.label || undefined,
        author: filters.author || undefined,
      })
      setChats(response.items || [])
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Chats' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Chats</h1>
            <p className="text-zinc-600 mt-1">Manage your AI conversation history</p>
          </div>
          <Button className="bg-teal-500 hover:bg-teal-600">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-1">
              <Input
                type="text"
                placeholder="Filter by tag..."
                value={filters.label}
                onChange={(e) => setFilters({ ...filters, label: e.target.value })}
                className="w-[200px]"
              />

              <Input
                type="text"
                placeholder="Filter by author..."
                value={filters.author}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                className="w-[200px]"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">Loading chats...</p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView chats={chats} onSelect={(chat) => navigate(`/chats/${chat.id}`)} />
        ) : (
          <CardsView chats={chats} onSelect={(chat) => navigate(`/chats/${chat.id}`)} />
        )}
      </div>
    </div>
  )
}

function TableView({ chats, onSelect }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-50 border-b">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Title
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Tags
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Messages
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Created
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Updated
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {chats.map((chat) => (
            <tr
              key={chat.id}
              className="hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
              onClick={() => onSelect(chat)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-teal-500" />
                  <div>
                    <p className="font-semibold text-zinc-900">{chat.title}</p>
                    {chat.description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">{chat.description}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1 flex-wrap">
                  {chat.labels?.slice(0, 3).map((label, idx) => (
                    <Badge key={idx} className={getLabelColor(idx)}>
                      {label}
                    </Badge>
                  ))}
                  {chat.labels?.length > 3 && (
                    <Badge variant="outline">+{chat.labels.length - 3}</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-zinc-600">
                  {chat.message_count || 0} messages
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {formatDate(chat.created_at)}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {formatDate(chat.updated_at)}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Open</DropdownMenuItem>
                    <DropdownMenuItem>Export</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {chats.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No chats found. Start a conversation to create your first chat!
        </div>
      )}
    </div>
  )
}

function CardsView({ chats, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {chats.map((chat) => (
        <Card
          key={chat.id}
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => onSelect(chat)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <MessageSquare className="w-8 h-8 text-teal-500" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Open</DropdownMenuItem>
                  <DropdownMenuItem>Export</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="mt-2">{chat.title}</CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              {chat.labels?.slice(0, 3).map((label, idx) => (
                <Badge key={idx} className={getLabelColor(idx)}>
                  {label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">
              {chat.description || 'No description'}
            </CardDescription>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-zinc-600">
                {chat.message_count || 0} messages
              </span>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500">
            <span>Updated {formatDate(chat.updated_at)}</span>
          </CardFooter>
        </Card>
      ))}
      {chats.length === 0 && (
        <div className="col-span-full text-center py-12 text-zinc-500">
          No chats found. Start a conversation to create your first chat!
        </div>
      )}
    </div>
  )
}
