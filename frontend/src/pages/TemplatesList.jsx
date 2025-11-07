import React, { useState, useEffect } from 'react'
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
import { commonApi } from '@/lib/api'
import { formatDate, getLabelColor, getStatusColor } from '@/lib/utils'

export default function TemplatesList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode, mode } = useStore()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    label: '',
    author: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [filters])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await commonApi.search({
        type: 'template', // Only fetch templates
        labels: filters.label || undefined,
        author: filters.author || undefined,
      })
      setTemplates(response.data.results || [])
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
          <Button className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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

            {/* Bulk Actions (Advanced Mode Only) */}
            {mode === 'advanced' && (
              <Button variant="outline">Bulk Actions</Button>
            )}
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
              Latest Release
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Status
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Updated
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              Author
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
              <td className="px-6 py-4">
                {template.latestRelease ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {template.latestRelease.version}
                    </Badge>
                    <Badge variant={template.latestRelease.channel === 'prod' ? 'success' : 'secondary'}>
                      {template.latestRelease.channel}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-zinc-400 text-sm">No releases</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={template.draftStatus || 'in_sync'} />
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
                    <DropdownMenuItem>Open</DropdownMenuItem>
                    <DropdownMenuItem>Compare</DropdownMenuItem>
                    <DropdownMenuItem>Publish</DropdownMenuItem>
                    <DropdownMenuItem>Rollback</DropdownMenuItem>
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
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 border-l-purple-500"
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
                  <DropdownMenuItem>Open</DropdownMenuItem>
                  <DropdownMenuItem>Compare</DropdownMenuItem>
                  <DropdownMenuItem>Publish</DropdownMenuItem>
                  <DropdownMenuItem>Rollback</DropdownMenuItem>
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
              <Badge className="bg-purple-100 text-purple-700 text-xs">Template</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">
              {template.description || 'No description'}
            </CardDescription>
            <div className="mt-4 flex justify-between items-center">
              {template.latestRelease ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">
                    {template.latestRelease.version}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {template.latestRelease.channel}
                  </Badge>
                </div>
              ) : (
                <span className="text-xs text-zinc-400">No releases</span>
              )}
              <StatusBadge status={template.draftStatus || 'in_sync'} />
            </div>
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

function StatusBadge({ status }) {
  const statusConfig = {
    in_sync: { label: '✅ In sync', variant: 'success' },
    draft_ahead: { label: '📝 Draft ahead', variant: 'warning' },
    behind: { label: '⚠️ Behind', variant: 'destructive' },
  }

  const config = statusConfig[status] || statusConfig.in_sync

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}
