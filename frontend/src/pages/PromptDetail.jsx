import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { promptsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function PromptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(null)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [content, setContent] = useState('')
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    labels: [],
  })
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrompt()
    loadVersions()
  }, [id])

  const loadPrompt = async () => {
    try {
      setLoading(true)
      const response = await promptsAPI.get(id)
      setPrompt(response)
      setContent(response.content || '')
      setMetadata({
        title: response.metadata?.title || '',
        description: response.metadata?.description || '',
        labels: response.metadata?.labels || [],
      })
    } catch (error) {
      console.error('Failed to load prompt:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    try {
      const response = await promptsAPI.listVersions(id)
      setVersions(response.versions || [])
      if (response.versions && response.versions.length > 0) {
        setSelectedVersion(response.versions[0].version_id)
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  const handleVersionSelect = async (versionId) => {
    try {
      setSelectedVersion(versionId)
      const versionData = await promptsAPI.getVersion(id, versionId)
      setContent(versionData.content || '')
      setMetadata({
        title: versionData.metadata?.title || '',
        description: versionData.metadata?.description || '',
        labels: versionData.metadata?.labels || [],
      })
    } catch (error) {
      console.error('Failed to load version:', error)
    }
  }

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

  const handleSaveNewVersion = async () => {
    try {
      setSaving(true)
      const frontmatter = `---
title: ${metadata.title}
description: ${metadata.description}
labels: ${JSON.stringify(metadata.labels)}
---

${content}`

      await promptsAPI.update(id, frontmatter)
      // Reload data
      await loadPrompt()
      await loadVersions()
      alert('New version saved successfully!')
    } catch (error) {
      console.error('Failed to save new version:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Prompts', href: '/prompts' },
    { label: metadata.title || 'Loading...' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500">Loading prompt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{metadata.title}</h1>
            <div className="flex gap-2 mt-2">
              {metadata.labels.map((label, idx) => (
                <Badge key={idx} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/prompts')}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleSaveNewVersion}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save as New Version'}
            </Button>
          </div>
        </div>

        {/* Content Layout: Left (Main) + Right (Secondary) */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - Left (8/12) */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
                <CardDescription>
                  Edit your prompt content in Markdown (editing will create a new version)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm"
                  placeholder="Enter your prompt content here..."
                />
                <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                  <span>
                    Words: {content.split(/\s+/).filter(w => w.length > 0).length} |
                    Characters: {content.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Content Area - Right (4/12) */}
          <div className="col-span-4 space-y-6">
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Edit prompt properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Enter title..."
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

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Version History
                </CardTitle>
                <CardDescription>
                  Select a version to view (latest at top)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.length === 0 ? (
                    <p className="text-sm text-zinc-500">No versions yet</p>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.version_id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion === version.version_id
                            ? 'bg-teal-50 border-teal-300'
                            : 'bg-white hover:bg-zinc-50'
                        }`}
                        onClick={() => handleVersionSelect(version.version_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold text-zinc-900">
                              {version.version_id.substring(0, 8)}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {formatDate(version.created_at)}
                            </p>
                          </div>
                          {selectedVersion === version.version_id && (
                            <Badge variant="success" className="ml-2">Current</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900 text-sm">Note</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-800 space-y-2">
                <p>• Each save creates a new version</p>
                <p>• All versions are preserved</p>
                <p>• Click on a version to view its content</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
