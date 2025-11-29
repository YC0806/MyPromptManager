import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCode, LayoutGrid, List, MoreVertical, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import { templatesAPI } from '@/lib/api'
import { formatDate, getLabelColor } from '@/lib/utils'

export default function TemplatesList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadTemplates()
  }, [currentPage])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await templatesAPI.list({
        type: 'template',
      })
      setTemplates(response.items || [])
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
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 mb-6 border dark:border-zinc-800">
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
            <p className="text-zinc-500">Loading templates...</p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView
            templates={templates}
            onSelect={(template) => navigate(`/templates/${template.id}`)}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        ) : (
          <CardsView
            templates={templates}
            onSelect={(template) => navigate(`/templates/${template.id}`)}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  )
}

function TableView({ templates, onSelect, currentPage, setCurrentPage, itemsPerPage }) {
  const [sortBy, setSortBy] = useState('updated_at')
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

  // Sort templates
  const sortedTemplates = [...templates].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'title' || sortBy === 'author') {
      aVal = (aVal || '').toLowerCase()
      bVal = (bVal || '').toLowerCase()
    } else if (sortBy === 'updated_at') {
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
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTemplates = sortedTemplates.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm overflow-hidden border dark:border-zinc-800">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
          <tr>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center">
                Title
                {getSortIcon('title')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => handleSort('labels')}
            >
              <div className="flex items-center">
                Labels
                {getSortIcon('labels')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => handleSort('updated_at')}
            >
              <div className="flex items-center">
                Updated
                {getSortIcon('updated_at')}
              </div>
            </th>
            <th
              className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => handleSort('author')}
            >
              <div className="flex items-center">
                Creator
                {getSortIcon('author')}
              </div>
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-zinc-800">
          {paginatedTemplates.map((template) => (
            <tr
              key={template.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
              onClick={() => onSelect(template)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{template.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{template.slug}</p>
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
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                {formatDate(template.updated_at)}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
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
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          No templates found. Create your first template to get started!
        </div>
      )}
      {templates.length > 0 && (
        <div className="border-t dark:border-zinc-800 p-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTemplates.length)} of {sortedTemplates.length} templates
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
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
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

function CardsView({ templates, onSelect, currentPage, setCurrentPage, itemsPerPage }) {
  const [sortBy, setSortBy] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Sort templates
  const sortedTemplates = [...templates].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'title' || sortBy === 'author') {
      aVal = (aVal || '').toLowerCase()
      bVal = (bVal || '').toLowerCase()
    } else if (sortBy === 'updated_at') {
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
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTemplates = sortedTemplates.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedTemplates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-zinc-900 dark:border-zinc-800"
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
          <CardFooter className="text-xs text-zinc-500 dark:text-zinc-400">
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
      {templates.length > 0 && (
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 flex items-center justify-between border dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTemplates.length)} of {sortedTemplates.length} templates
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
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
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
