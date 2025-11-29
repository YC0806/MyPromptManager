import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, LayoutGrid, List, MoreVertical, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { chatsAPI } from '@/lib/api'
import { formatDate, getLabelColor } from '@/lib/utils'

export default function ChatsList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadChats()
  }, [currentPage])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await chatsAPI.list()
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
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-teal-500" />
              <h1 className="text-3xl font-bold text-foreground">Chats</h1>
            </div>
            <p className="text-muted-foreground mt-1">Manage your AI conversation history</p>
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
        <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
          <div className="flex items-center justify-between gap-4">
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
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView
            chats={chats}
            onSelect={(chat) => navigate(`/chats/${chat.id}`)}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        ) : (
          <CardsView
            chats={chats}
            onSelect={(chat) => navigate(`/chats/${chat.id}`)}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  )
}

function TableView({ chats, onSelect, currentPage, setCurrentPage, itemsPerPage }) {
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
    }
    return sortOrder === 'asc' ?
      <ArrowUp className="w-3 h-3 ml-1" /> :
      <ArrowDown className="w-3 h-3 ml-1" />
  }

  // Sort chats
  const sortedChats = [...chats].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'title' || sortBy === 'author') {
      aVal = (aVal || '').toLowerCase()
      bVal = (bVal || '').toLowerCase()
    } else if (sortBy === 'created_at') {
      aVal = new Date(aVal || 0).getTime()
      bVal = new Date(bVal || 0).getTime()
    } else if (sortBy === 'labels') {
      aVal = (a.labels?.[0] || '').toLowerCase()
      bVal = (b.labels?.[0] || '').toLowerCase()
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  // Paginate
  const totalPages = Math.ceil(sortedChats.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedChats = sortedChats.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center">
                Title
                {getSortIcon('title')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleSort('labels')}
            >
              <div className="flex items-center">
                Labels
                {getSortIcon('labels')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center">
                Created
                {getSortIcon('created_at')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleSort('author')}
            >
              <div className="flex items-center">
                Creator
                {getSortIcon('author')}
              </div>
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paginatedChats.map((chat) => (
            <tr
              key={chat.id}
              className="hover:bg-muted/60 transition-colors duration-200 cursor-pointer"
              onClick={() => onSelect(chat)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-teal-500" />
                  <div>
                    <p className="font-semibold text-foreground">{chat.title}</p>
                    {chat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{chat.description}</p>
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
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {formatDate(chat.created_at)}
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
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
        <div className="text-center py-12 text-muted-foreground">
          No chats found. Create your first chat to get started!
        </div>
      )}
      {chats.length > 0 && (
        <div className="border-t border-border p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedChats.length)} of {sortedChats.length} chats
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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
      )}
    </div>
  )
}

function CardsView({ chats, onSelect, currentPage, setCurrentPage, itemsPerPage }) {
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Sort chats
  const sortedChats = [...chats].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'title' || sortBy === 'author') {
      aVal = (aVal || '').toLowerCase()
      bVal = (bVal || '').toLowerCase()
    } else if (sortBy === 'created_at') {
      aVal = new Date(aVal || 0).getTime()
      bVal = new Date(bVal || 0).getTime()
    } else if (sortBy === 'labels') {
      aVal = (a.labels?.[0] || '').toLowerCase()
      bVal = (b.labels?.[0] || '').toLowerCase()
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  // Paginate
  const totalPages = Math.ceil(sortedChats.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedChats = sortedChats.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedChats.map((chat) => (
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
          <CardFooter className="text-xs text-muted-foreground">
            <span>Created {formatDate(chat.created_at)}</span>
          </CardFooter>
          </Card>
        ))}
        {chats.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No chats found. Create your first chat to get started!
          </div>
        )}
      </div>
      {chats.length > 0 && (
        <div className="mt-6 bg-card rounded-lg shadow-sm p-4 flex items-center justify-between border border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedChats.length)} of {sortedChats.length} chats
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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
      )}
    </>
  )
}
