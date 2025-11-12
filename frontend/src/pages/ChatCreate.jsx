import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Upload } from 'lucide-react'
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
  })
  const [jsonContent, setJsonContent] = useState('')
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
    setJsonContent(value)
    setParseError('')

    // Try to parse and validate
    if (value.trim()) {
      try {
        JSON.parse(value)
        setParseError('')
      } catch (error) {
        setParseError('Invalid JSON format')
      }
    }
  }

  const handleSave = async () => {
    try {
      // Validate JSON
      let chatData
      try {
        chatData = JSON.parse(jsonContent)
      } catch (error) {
        alert('Invalid JSON format. Please check your input.')
        return
      }

      setSaving(true)

      // Combine metadata with chat data
      const finalData = {
        ...metadata,
        ...chatData,
        // Metadata takes precedence
        title: metadata.title || chatData.title || 'Untitled Chat',
        description: metadata.description || chatData.description || '',
        labels: metadata.labels.length > 0 ? metadata.labels : (chatData.labels || chatData.tags || []),
      }

      const response = await chatsAPI.create(finalData)
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

  const exampleJson = `{
  "title": "My AI Conversation",
  "description": "A conversation about...",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I'm doing well, thank you!",
      "timestamp": "2024-01-01T12:00:05Z"
    }
  ]
}`

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Create New Chat</h1>
            <p className="text-zinc-600 mt-1">Import chat conversation from JSON format</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/chats')}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleSave}
              disabled={saving || !metadata.title.trim() || !jsonContent.trim() || !!parseError}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Chat'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* JSON Editor (Main - 8/12) */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Chat Content (JSON Format)</CardTitle>
                <CardDescription>
                  Paste or write your chat data in JSON format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jsonContent}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className={`min-h-[500px] font-mono text-sm ${
                    parseError ? 'border-red-500' : ''
                  }`}
                  placeholder={exampleJson}
                />
                {parseError && (
                  <p className="text-red-500 text-sm mt-2">{parseError}</p>
                )}
                <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                  <span>
                    {jsonContent.length > 0 && !parseError ? '✓ Valid JSON' : parseError ? '✗ Invalid JSON' : ''}
                  </span>
                  <span>Characters: {jsonContent.length}</span>
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
                  {exampleJson}
                </pre>
                <div className="mt-4 text-sm text-zinc-600 space-y-1">
                  <p>• <code className="bg-zinc-200 px-1 rounded">messages</code>: Array of message objects</p>
                  <p>• <code className="bg-zinc-200 px-1 rounded">role</code>: "user" or "assistant"</p>
                  <p>• <code className="bg-zinc-200 px-1 rounded">content</code>: Message text</p>
                  <p>• <code className="bg-zinc-200 px-1 rounded">timestamp</code>: ISO date string (optional)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Panel (Secondary - 4/12) */}
          <div className="col-span-4 space-y-6">
            <Card>
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
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>• Import conversations from ChatGPT, Claude, or other AI tools</p>
                <p>• Ensure JSON is properly formatted</p>
                <p>• Include message role (user/assistant)</p>
                <p>• Add timestamps for better tracking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
