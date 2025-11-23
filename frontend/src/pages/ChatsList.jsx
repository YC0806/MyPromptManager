import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import useStore from '@/store/useStore'
import { chatsAPI } from '@/lib/api'
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
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadChats()
  }, [filters, sortBy, sortOrder, currentPage])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await chatsAPI.list({
        labels: filters.label || undefined,
        author: filters.author || undefined,
      })
      let items = response.items || []

      // Client-side sorting
      items.sort((a, b) => {
        let aVal = a[sortBy]
        let bVal = b[sortBy]

        if (sortBy === 'title') {
          aVal = (aVal || '').toLowerCase()
          bVal = (bVal || '').toLowerCase()
        } else if (sortBy === 'created_at' || sortBy === 'updated_at') {
          aVal = new Date(aVal || 0).getTime()
          bVal = new Date(bVal || 0).getTime()
        }

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      // Client-side pagination
      const total = Math.ceil(items.length / itemsPerPage)
      setTotalPages(total)
      const startIndex = (currentPage - 1) * itemsPerPage
      const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage)

      setChats(paginatedItems)
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
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-teal-500" />
              <h1 className="text-3xl font-bold text-zinc-900">Chats</h1>
            </div>
            <p className="text-zinc-600 mt-1">Manage your AI conversation history</p>
          </div>
          <Button
            className="bg-teal-500 hover:bg-teal-600"
            onClick={() => navigate('/chats/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-1">
              <Input
                type="text"
                placeholder="Filter by label..."
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

          {/* Sort and Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Creator</SelectItem>
                  <SelectItem value="created_at">Created Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-600">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
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
              Labels
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Created
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Creator
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
              <td className="px-6 py-4 text-sm text-zinc-600">
                {formatDate(chat.created_at)}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                @{chat.author}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(chat); }}>Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Export</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {chats.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No chats found. Create your first chat to get started!
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
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(chat); }}>Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Export</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
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
          </CardContent>
          <CardFooter className="text-xs text-zinc-500">
            <span>Created {formatDate(chat.created_at)}</span>
          </CardFooter>
        </Card>
      ))}
      {chats.length === 0 && (
        <div className="col-span-full text-center py-12 text-zinc-500">
          No chats found. Create your first chat to get started!
        </div>
      )}
    </div>
  )
}
