import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { chatsAPI } from '@/lib/api'

export default function ChatCreate() {
  const navigate = useNavigate()
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    labels: [],
    provider: '',
    model: '',
  })
  const [messagesJson, setMessagesJson] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [parseError, setParseError] = useState('')

  const handleAddLabel = () => {
    if (newLabel.trim() && !metadata.labels.includes(newLabel.trim())) {
      setMetadata({ ...metadata, labels: [...metadata.labels, newLabel.trim()] })
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (labelToRemove) => {
    setMetadata({
      ...metadata,
      labels: metadata.labels.filter(label => label !== labelToRemove)
    })
  }

  const handleJsonChange = (value) => {
    setMessagesJson(value)
    setParseError('')

    if (value.trim()) {
      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) {
          setParseError('Messages must be an array')
        } else {
          setParseError('')
        }
      } catch (error) {
        setParseError('Invalid JSON format')
      }
    }
  }

  const handleSave = async () => {
    if (!metadata.title.trim()) {
      alert('Please enter a title')
      return
    }

    let messages = []
    if (messagesJson.trim()) {
      try {
        messages = JSON.parse(messagesJson)
        if (!Array.isArray(messages)) {
          alert('Messages must be an array')
          return
        }
      } catch (error) {
        alert('Invalid JSON format. Please check your input.')
        return
      }
    }

    try {
      setSaving(true)
      const response = await chatsAPI.create(metadata.title, {
        description: metadata.description,
        labels: metadata.labels,
        provider: metadata.provider || undefined,
        model: metadata.model || undefined,
        messages: messages,
      })
      navigate(`/chats/${response.id}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
      alert('Failed to create chat: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Chats', href: '/chats' },
    { label: 'Create New Chat' },
  ]

  const exampleMessages = `[
  {
    "role": "user",
    "content": "Hello, how are you?"
  },
  {
    "role": "assistant",
    "content": "I'm doing well, thank you!"
  }
]`

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Create New Chat</h1>
            <p className="text-zinc-600 dark:text-zinc-300 mt-1">Import chat messages in JSON format</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/chats')}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleSave}
              disabled={saving || !metadata.title.trim() || !!parseError}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Chat'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Messages JSON Editor (Main - 8/12) */}
          <div className="col-span-8">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Messages (JSON Array)</CardTitle>
                <CardDescription>
                  Paste or write your messages array in JSON format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={messagesJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className={`min-h-[500px] font-mono text-sm ${
                    parseError ? 'border-red-500' : ''
                  }`}
                  placeholder={exampleMessages}
                />
                {parseError && (
                  <p className="text-red-500 text-sm mt-2">{parseError}</p>
                )}
                <div className="flex items-center justify-between mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {messagesJson.length > 0 && !parseError ? '✓ Valid JSON' : parseError ? '✗ Invalid' : ''}
                  </span>
                  <span>Characters: {messagesJson.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Example Format */}
            <Card className="mt-6 bg-zinc-50">
              <CardHeader>
                <CardTitle className="text-sm">Expected JSON Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono text-zinc-700 whitespace-pre-wrap">
                  {exampleMessages}
                </pre>
                <div className="mt-4 text-sm text-zinc-600 space-y-1">
                  <p>• <code className="bg-zinc-200 px-1 rounded">role</code>: "user", "assistant", or "system"</p>
                  <p>• <code className="bg-zinc-200 px-1 rounded">content</code>: Message text</p>
                  <p>• <code className="bg-zinc-200 px-1 rounded">timestamp</code>: ISO date string (optional)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Panel (Secondary - 4/12) */}
          <div className="col-span-4 space-y-6">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Define chat properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Enter title..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Enter description..."
                    rows={3}
                  />
                </div>

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
                    <Button variant="outline" size="sm" onClick={handleAddLabel}>
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {metadata.labels.map((label, idx) => (
                      <Badge key={idx} variant="secondary" className="cursor-pointer">
                        {label}
                        <X className="w-3 h-3 ml-1" onClick={() => handleRemoveLabel(label)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    value={metadata.provider}
                    onChange={(e) => setMetadata({ ...metadata, provider: e.target.value })}
                    placeholder="e.g., OpenAI, Claude..."
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={metadata.model}
                    onChange={(e) => setMetadata({ ...metadata, model: e.target.value })}
                    placeholder="e.g., gpt-4, claude-3..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>• Only paste the messages array, not the full chat object</p>
                <p>• Title and other metadata are entered in the sidebar</p>
                <p>• Messages can be empty to create a placeholder chat</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
