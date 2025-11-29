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
import { promptsAPI } from '@/lib/api'

export default function PromptCreate() {
  const navigate = useNavigate()
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    labels: [],
  })
  const [content, setContent] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleSave = async () => {
    if (!metadata.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!content.trim()) {
      alert('Please enter content')
      return
    }

    try {
      setSaving(true)
      const response = await promptsAPI.create(
        metadata.title,
        content,
        metadata.labels,
        metadata.description
      )
      // Navigate to the newly created prompt
      navigate(`/prompts/${response.id}`)
    } catch (error) {
      console.error('Failed to create prompt:', error)
      alert('Failed to create prompt: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Prompts', href: '/prompts' },
    { label: 'Create New Prompt' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Create New Prompt</h1>
            <p className="text-zinc-600 dark:text-zinc-300 mt-1">Write metadata and content for your new prompt</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/prompts')}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleSave}
              disabled={saving || !metadata.title.trim() || !content.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Prompt'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Editor (Main - 8/12) */}
          <div className="col-span-8">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your prompt content in Markdown</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  placeholder="Enter your prompt content here...

# Example Prompt

Write your content using Markdown syntax:
- **Bold text**
- *Italic text*
- Lists and formatting"
                />
                <div className="flex items-center justify-between mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    Words: {content.split(/\s+/).filter(w => w.length > 0).length} |
                    Characters: {content.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Panel (Secondary - 4/12) */}
          <div className="col-span-4 space-y-6">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Define prompt properties</CardDescription>
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
                    className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
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
                    className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <Label>Labels</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Add label..."
                      className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
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
                    {metadata.labels.map((label, idx) => (
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
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-400">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p>• Give your prompt a clear, descriptive title</p>
                <p>• Use labels to organize and categorize</p>
                <p>• Write content using Markdown for formatting</p>
                <p>• You can edit and create new versions later</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
