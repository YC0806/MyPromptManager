import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { History, ArrowLeft, Trash2, User, Bot, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import axios from 'axios'
import { formatDate } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function AIHistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/ai-histories/${id}`)
      setHistory(response.data)
    } catch (error) {
      console.error('Failed to load AI history:', error)
      alert('Failed to load AI history')
      navigate('/ai-histories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this AI history?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/ai-histories/${id}`)
      navigate('/ai-histories')
    } catch (error) {
      console.error('Failed to delete AI history:', error)
      alert('Failed to delete AI history')
    }
  }

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    alert('消息已复制到剪贴板')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${history.provider}_${history.conversation_id}_${Date.now()}.json`
    link.click()
  }

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

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'AI Histories', href: '/ai-histories' },
    { label: history?.title || 'Loading...' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!history) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ai-histories')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <History className="w-6 h-6 text-teal-500" />
                <Badge className={`${getProviderColor(history.provider)} border`}>
                  {history.provider}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-zinc-900">{history.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>对话信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-1">对话 ID</p>
                <p className="text-sm text-zinc-900 font-mono">{history.conversation_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-1">消息数量</p>
                <p className="text-sm text-zinc-900">
                  {history.metadata?.messageCount || history.messages?.length || 0} 条
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-1">创建时间</p>
                <p className="text-sm text-zinc-900">{formatDate(history.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-1">更新时间</p>
                <p className="text-sm text-zinc-900">{formatDate(history.updated_at)}</p>
              </div>
              {history.metadata?.url && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-zinc-600 mb-1">原始链接</p>
                  <a
                    href={history.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700 underline break-all"
                  >
                    {history.metadata.url}
                  </a>
                </div>
              )}
              {history.metadata?.extractedAt && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-zinc-600 mb-1">提取时间</p>
                  <p className="text-sm text-zinc-900">{formatDate(history.metadata.extractedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">对话内容</h2>

          {history.messages && history.messages.length > 0 ? (
            history.messages.map((message, index) => (
              <MessageCard
                key={index}
                message={message}
                index={index}
                onCopy={handleCopyMessage}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500">暂无对话消息</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageCard({ message, index, onCopy }) {
  const isUser = message.role === 'user'

  return (
    <Card className={isUser ? 'bg-teal-50 border-teal-100' : 'bg-white'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUser ? (
              <>
                <User className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">用户</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">AI 助手</span>
              </>
            )}
            <span className="text-xs text-zinc-500">#{index + 1}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message.content)}
          >
            <Copy className="w-3 h-3 mr-1" />
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 leading-relaxed">
            {message.content}
          </pre>
        </div>
        {message.timestamp && (
          <p className="text-xs text-zinc-500 mt-3">{formatDate(message.timestamp)}</p>
        )}
      </CardContent>
    </Card>
  )
}
