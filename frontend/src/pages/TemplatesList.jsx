import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCode, LayoutGrid, List, MoreVertical, Plus } from 'lucide-react'
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
import { searchAPI } from '@/lib/api'
import { formatDate, getLabelColor } from '@/lib/utils'

export default function TemplatesList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    label: '',
    author: '',
  })
  const [sortBy, setSortBy] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadTemplates()
  }, [filters, sortBy, sortOrder, currentPage])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await searchAPI.search({
        type: 'template',
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
        } else if (sortBy === 'updated_at' || sortBy === 'created_at') {
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

      setTemplates(paginatedItems)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Templates' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <FileCode className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-zinc-900">Templates</h1>
            </div>
            <p className="text-zinc-600 mt-1">Manage your reusable template files with variables</p>
          </div>
          <Button
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => navigate('/templates/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
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
                  <SelectItem value="updated_at">Updated Time</SelectItem>
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
            <p className="text-zinc-500">Loading templates...</p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView templates={templates} onSelect={(template) => navigate(`/templates/${template.id}`)} />
        ) : (
          <CardsView templates={templates} onSelect={(template) => navigate(`/templates/${template.id}`)} />
        )}
      </div>
    </div>
  )
}

function TableView({ templates, onSelect }) {
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
              Updated
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
          {templates.map((template) => (
            <tr
              key={template.id}
              className="hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
              onClick={() => onSelect(template)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-semibold text-zinc-900">{template.title}</p>
                    <p className="text-xs text-zinc-500">{template.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1 flex-wrap">
                  {template.labels?.slice(0, 3).map((label, idx) => (
                    <Badge key={idx} className={getLabelColor(idx)}>
                      {label}
                    </Badge>
                  ))}
                  {template.labels?.length > 3 && (
                    <Badge variant="outline">+{template.labels.length - 3}</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {formatDate(template.updated_at)}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                @{template.author}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(template); }}>Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {templates.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No templates found. Create your first template to get started!
        </div>
      )}
    </div>
  )
}

function CardsView({ templates, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => onSelect(template)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <FileCode className="w-8 h-8 text-purple-500" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(template); }}>Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="mt-2">{template.title}</CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              {template.labels?.slice(0, 3).map((label, idx) => (
                <Badge key={idx} className={getLabelColor(idx)}>
                  {label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">
              {template.description || 'No description'}
            </CardDescription>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500">
            <span>Updated {formatDate(template.updated_at)}</span>
            <span className="mx-2">•</span>
            <span>@{template.author}</span>
          </CardFooter>
        </Card>
      ))}
      {templates.length === 0 && (
        <div className="col-span-full text-center py-12 text-zinc-500">
          No templates found. Create your first template to get started!
        </div>
      )}
    </div>
  )
}
