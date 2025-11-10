import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, LayoutGrid, List, MoreVertical, Download, Trash2, Eye } from 'lucide-react'
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
import axios from 'axios'
import { formatDate } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function AIHistoriesList() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useStore()
  const [histories, setHistories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    provider: '',
  })

  useEffect(() => {
    loadHistories()
  }, [filters])

  const loadHistories = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.provider) {
        params.provider = filters.provider
      }

      const response = await axios.get(`${API_BASE_URL}/ai-histories`, { params })
      setHistories(response.data.histories || [])
    } catch (error) {
      console.error('Failed to load AI histories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (historyId) => {
    if (!confirm('Are you sure you want to delete this AI history?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/ai-histories/${historyId}`)
      loadHistories()
    } catch (error) {
      console.error('Failed to delete AI history:', error)
      alert('Failed to delete AI history')
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'AI Histories' },
  ]

  const providerColors = {
    chatgpt: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    deepseek: 'bg-blue-100 text-blue-700 border-blue-200',
    claude: 'bg-purple-100 text-purple-700 border-purple-200',
    gemini: 'bg-orange-100 text-orange-700 border-orange-200',
  }

  const getProviderColor = (provider) => {
    const key = provider?.toLowerCase()
    return providerColors[key] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">AI Histories</h1>
            <p className="text-zinc-600 mt-1">
              AI 对话历史记录（通过浏览器插件自动同步）
            </p>
          </div>
          <div className="text-sm text-zinc-500">
            共 {histories.length} 条记录
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-1">
              <select
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                className="px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Providers</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="DeepSeek">DeepSeek</option>
                <option value="Claude">Claude</option>
                <option value="Gemini">Gemini</option>
              </select>
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
            <p className="text-zinc-500">加载中...</p>
          </div>
        ) : histories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <History className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">暂无 AI 对话历史</h3>
            <p className="text-zinc-600 mb-6">
              请安装浏览器插件并访问 AI 提供商网站以自动同步对话历史
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('/browser-extension', '_blank')}
            >
              查看插件安装指南
            </Button>
          </div>
        ) : viewMode === 'table' ? (
          <TableView
            histories={histories}
            onSelect={(history) => navigate(`/ai-histories/${history.id}`)}
            onDelete={handleDelete}
            getProviderColor={getProviderColor}
          />
        ) : (
          <CardsView
            histories={histories}
            onSelect={(history) => navigate(`/ai-histories/${history.id}`)}
            onDelete={handleDelete}
            getProviderColor={getProviderColor}
          />
        )}
      </div>
    </div>
  )
}

function TableView({ histories, onSelect, onDelete, getProviderColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-50 border-b">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              标题
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              提供商
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              消息数
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              更新时间
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {histories.map((history) => (
            <tr
              key={history.id}
              className="hover:bg-zinc-50 cursor-pointer transition-colors"
              onClick={() => onSelect(history)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-900">{history.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {history.conversation_id?.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge className={`${getProviderColor(history.provider)} border`}>
                  {history.provider}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-zinc-600">
                  {history.metadata?.messageCount || history.messages?.length || 0}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-zinc-600">{formatDate(history.updated_at)}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onSelect(history)
                    }}>
                      <Eye className="w-4 h-4 mr-2" />
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(history.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardsView({ histories, onSelect, onDelete, getProviderColor }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {histories.map((history) => (
        <Card
          key={history.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelect(history)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-500" />
                <Badge className={`${getProviderColor(history.provider)} border text-xs`}>
                  {history.provider}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onSelect(history)
                  }}>
                    <Eye className="w-4 h-4 mr-2" />
                    查看详情
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(history.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="mt-3 line-clamp-2">{history.title}</CardTitle>
            <CardDescription className="text-xs">
              ID: {history.conversation_id?.substring(0, 20)}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-zinc-600">
              <div>
                <span className="font-medium">
                  {history.metadata?.messageCount || history.messages?.length || 0}
                </span>{' '}
                条消息
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-zinc-500">
              更新于 {formatDate(history.updated_at)}
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
