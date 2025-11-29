import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Send, History, User, Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Breadcrumb from '@/components/layout/Breadcrumb'
import PublishModal from '@/components/modals/PublishModal'
import { chatsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function ChatDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [chatData, setChatData] = useState({
    id: '',
    title: '',
    description: '',
    labels: [],
    messages: [],
    created_at: '',
    updated_at: '',
  })
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  useEffect(() => {
    loadChat()
    loadMessages()
  }, [id])

  const loadChat = async () => {
    try {
      const response = await chatsAPI.get(id)
      setChatData(response || {})
    } catch (error) {
      console.error('Failed to load chat:', error)
      // Use mock data for demonstration
      setChatData({
        id: id,
        title: 'Sample Chat',
        description: 'A sample chat conversation',
        labels: ['demo'],
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  const loadMessages = async () => {
    try {
      const response = await chatsAPI.getMessages(id)
      setChatData((prev) => ({ ...prev, messages: response.messages || [] }))
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await chatsAPI.update(id, chatData)
      // Show success toast
    } catch (error) {
      console.error('Failed to save chat:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddLabel = () => {
    if (newLabel.trim() && !chatData.labels.includes(newLabel.trim())) {
      setChatData({ ...chatData, labels: [...chatData.labels, newLabel.trim()] })
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (labelToRemove) => {
    setChatData({
      ...chatData,
      labels: chatData.labels.filter(label => label !== labelToRemove)
    })
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Chats', href: '/chats' },
    { label: chatData.title || 'Untitled' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{chatData.title}</h1>
            <div className="flex gap-2 mt-2">
              {chatData.labels?.map((label, idx) => (
                <Badge key={idx} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => setShowPublishModal(true)}>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button variant="outline" onClick={() => navigate(`/chats/${id}/timeline`)}>
              <History className="w-4 h-4 mr-2" />
              Timeline
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Messages View (8/12) */}
          <div className="col-span-8">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  {chatData.messages?.length || 0} messages • Created {formatDate(chatData.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] overflow-y-auto pr-4">
                  <div className="space-y-4">
                    {chatData.messages?.map((message, idx) => (
                      <MessageBubble key={idx} message={message} />
                    ))}
                    {(!chatData.messages || chatData.messages.length === 0) && (
                      <div className="text-center py-12 text-zinc-500">
                        No messages in this conversation yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Panel (4/12) */}
          <div className="col-span-4">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Chat Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={chatData.title}
                    onChange={(e) => setChatData({ ...chatData, title: e.target.value })}
                    placeholder="Chat title..."
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={chatData.description}
                    onChange={(e) => setChatData({ ...chatData, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>

                {/* Labels */}
                <div>
                  <Label>Labels</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Add label..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddLabel()
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddLabel}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {chatData.labels?.map((label, idx) => (
                      <Badge key={idx} variant="secondary" className="cursor-pointer">
                        {label}
                        <X
                          className="w-3 h-3 ml-1"
                          onClick={() => handleRemoveLabel(label)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-sm text-zinc-700 mb-2">Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Messages:</span>
                      <span className="font-medium">{chatData.messages?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Created:</span>
                      <span className="font-medium">{formatDate(chatData.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Updated:</span>
                      <span className="font-medium">{formatDate(chatData.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Export Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mt-6">
          <Card className="dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
            </CardHeader>
              <CardContent>
                <Tabs defaultValue="json">
                  <TabsList>
                    <TabsTrigger value="json">Raw JSON</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>
                  <TabsContent value="json" className="mt-4">
                    <Textarea
                      value={JSON.stringify(chatData, null, 2)}
                      onChange={(e) => {
                        try {
                          setChatData(JSON.parse(e.target.value))
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="min-h-[300px] font-mono text-xs"
                      placeholder="Chat data in JSON format..."
                    />
                  </TabsContent>
                  <TabsContent value="analysis" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Conversation Statistics</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-600">User Messages:</span>
                            <span className="ml-2 font-medium">
                              {chatData.messages?.filter(m => m.role === 'user').length || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Assistant Messages:</span>
                            <span className="ml-2 font-medium">
                              {chatData.messages?.filter(m => m.role === 'assistant').length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Modals */}
      <PublishModal open={showPublishModal} onClose={() => setShowPublishModal(false)} promptId={id} itemType="chat" />
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-100 text-zinc-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.timestamp && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-1">
            {formatDate(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}
