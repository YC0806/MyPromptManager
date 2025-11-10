import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, LayoutGrid, List, MoreVertical, Plus } from 'lucide-react'
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
import { formatDate, getLabelColor, getStatusColor } from '@/lib/utils'

export default function PromptsList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    label: '',
    author: '',
  })

  useEffect(() => {
    loadPrompts()
  }, [filters])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const response = await searchAPI.search({
        type: 'prompt', // Only fetch prompts
        labels: filters.label || undefined,
        author: filters.author || undefined,
      })
      setPrompts(response.items || [])
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Prompts' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Prompts</h1>
            <p className="text-zinc-600 mt-1">Manage your prompt templates and versions</p>
          </div>
          <Button className="bg-teal-500 hover:bg-teal-600">
            <Plus className="w-4 h-4 mr-2" />
            New Prompt
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
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">Loading prompts...</p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView prompts={prompts} onSelect={(prompt) => navigate(`/prompts/${prompt.id}`)} />
        ) : (
          <CardsView prompts={prompts} onSelect={(prompt) => navigate(`/prompts/${prompt.id}`)} />
        )}
      </div>
    </div>
  )
}

function TableView({ prompts, onSelect }) {
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
          {prompts.map((prompt) => (
            <tr
              key={prompt.id}
              className="hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
              onClick={() => onSelect(prompt)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-teal-500" />
                  <div>
                    <p className="font-semibold text-zinc-900">{prompt.title}</p>
                    <p className="text-xs text-zinc-500">{prompt.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1 flex-wrap">
                  {prompt.labels?.slice(0, 3).map((label, idx) => (
                    <Badge key={idx} className={getLabelColor(idx)}>
                      {label}
                    </Badge>
                  ))}
                  {prompt.labels?.length > 3 && (
                    <Badge variant="outline">+{prompt.labels.length - 3}</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {prompt.latestRelease ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {prompt.latestRelease.version}
                    </Badge>
                    <Badge variant={prompt.latestRelease.channel === 'prod' ? 'success' : 'secondary'}>
                      {prompt.latestRelease.channel}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-zinc-400 text-sm">No releases</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={prompt.draftStatus || 'in_sync'} />
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {formatDate(prompt.updated_at)}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                @{prompt.author}
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
      {prompts.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No prompts found. Create your first prompt to get started!
        </div>
      )}
    </div>
  )
}

function CardsView({ prompts, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
        <Card
          key={prompt.id}
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => onSelect(prompt)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <FileText className="w-8 h-8 text-teal-500" />
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
            <CardTitle className="mt-2">{prompt.title}</CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              {prompt.labels?.slice(0, 3).map((label, idx) => (
                <Badge key={idx} className={getLabelColor(idx)}>
                  {label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">
              {prompt.description || 'No description'}
            </CardDescription>
            <div className="mt-4 flex justify-between items-center">
              {prompt.latestRelease ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">
                    {prompt.latestRelease.version}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {prompt.latestRelease.channel}
                  </Badge>
                </div>
              ) : (
                <span className="text-xs text-zinc-400">No releases</span>
              )}
              <StatusBadge status={prompt.draftStatus || 'in_sync'} />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-zinc-500">
            <span>Updated {formatDate(prompt.updated_at)}</span>
            <span className="mx-2">•</span>
            <span>@{prompt.author}</span>
          </CardFooter>
        </Card>
      ))}
      {prompts.length === 0 && (
        <div className="col-span-full text-center py-12 text-zinc-500">
          No prompts found. Create your first prompt to get started!
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
