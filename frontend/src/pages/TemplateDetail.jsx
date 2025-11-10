import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Send, History, RotateCcw, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Breadcrumb from '@/components/layout/Breadcrumb'
import PublishModal from '@/components/modals/PublishModal'
import RollbackModal from '@/components/modals/RollbackModal'
import { templatesAPI } from '@/lib/api'

export default function TemplateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    labels: [],
    type: 'template',
    variables: [], // Template-specific: variable definitions
  })
  const [saving, setSaving] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showRollbackModal, setShowRollbackModal] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [id])

  const loadTemplate = async () => {
    try {
      const response = await templatesAPI.get(id)
      setContent(response.content || '')
      setMetadata({
        title: response.metadata?.title || '',
        description: response.metadata?.description || '',
        labels: response.metadata?.labels || [],
        type: 'template',
        variables: response.metadata?.variables || [],
      })
    } catch (error) {
      console.error('Failed to load template:', error)
      // Use mock data for demonstration
      setContent('# Sample Template\n\nHello {{name}}, this is a sample template with {{variable}}.')
      setMetadata({
        title: 'Sample Template',
        description: 'A sample template for demonstration',
        labels: ['demo'],
        type: 'template',
        variables: [],
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // Combine metadata and content into frontmatter format
      const frontmatter = `---
title: ${metadata.title}
description: ${metadata.description}
labels: ${JSON.stringify(metadata.labels)}
type: template
variables: ${JSON.stringify(metadata.variables)}
---

${content}`
      await templatesAPI.update(id, frontmatter)
      // Show success toast
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Templates', href: '/templates' },
    { label: metadata.title || 'Untitled' },
  ]

  const statusData = {
    latestRelease: { version: 'v1.0.0', channel: 'prod' },
    draft: { message: '2 changes ahead' },
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} status={statusData} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <FileCode className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-zinc-900">{metadata.title}</h1>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="success">v1.0.0</Badge>
              <Badge variant="outline">prod</Badge>
              <Badge className="bg-purple-100 text-purple-700">Template</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowPublishModal(true)}>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button variant="outline" onClick={() => navigate('/templates/' + id + '/compare')}>
              <History className="w-4 h-4 mr-2" />
              Compare
            </Button>
            <Button variant="outline" onClick={() => setShowRollbackModal(true)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </Button>
          </div>
        </div>

        {/* Content */}
        <EditorContent
          content={content}
          setContent={setContent}
          metadata={metadata}
          setMetadata={setMetadata}
        />
      </div>

      {/* Modals */}
      <PublishModal open={showPublishModal} onClose={() => setShowPublishModal(false)} promptId={id} itemType="template" />
      <RollbackModal open={showRollbackModal} onClose={() => setShowRollbackModal(false)} promptId={id} itemType="template" />
    </div>
  )
}

function EditorContent({ content, setContent, metadata, setMetadata }) {
  // Extract variables from template content (e.g., {{variable_name}})
  const extractVariables = (text) => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = [...text.matchAll(regex)]
    return [...new Set(matches.map(m => m[1]))]
  }

  const detectedVariables = extractVariables(content)

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Editor (7/12) */}
      <div className="col-span-7">
        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>Edit your template content with variables like {`{{variable_name}}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Enter your template content here... Use {{variable_name}} for variables."
            />
            <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
              <span>Words: {content.split(/\s+/).length} | Variables: {detectedVariables.length}</span>
              <span>⚡ Auto-save enabled</span>
            </div>
          </CardContent>
        </Card>

        {/* Variables Preview */}
        {detectedVariables.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Detected Variables</CardTitle>
              <CardDescription>Variables found in your template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable, idx) => (
                  <Badge key={idx} variant="outline" className="font-mono">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inspector (5/12) */}
      <div className="col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
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
              <div className="flex gap-2 flex-wrap mt-2">
                {metadata.labels.map((label, idx) => (
                  <Badge key={idx} variant="secondary">
                    {label}
                  </Badge>
                ))}
                <Button variant="outline" size="sm">+ Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Template Variables</CardTitle>
            <CardDescription>Define variable descriptions and defaults</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectedVariables.length > 0 ? (
                detectedVariables.map((variable, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 rounded-lg">
                    <div className="font-mono text-sm font-semibold text-purple-600 mb-1">
                      {`{{${variable}}}`}
                    </div>
                    <Input
                      placeholder="Description..."
                      className="text-xs mb-2"
                      size="sm"
                    />
                    <Input
                      placeholder="Default value..."
                      className="text-xs"
                      size="sm"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No variables detected yet. Add {`{{variable_name}}`} to your template.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📦 Version Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 mb-4">
              Suggested: <span className="font-semibold">v1.0.1 (patch)</span>
            </p>
            <RadioGroup defaultValue="patch">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="major" id="major" />
                <Label htmlFor="major">Major (v2.0.0)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor">Minor (v1.1.0)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patch" id="patch" />
                <Label htmlFor="patch">Patch (v1.0.1)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Release Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="prod">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prod" id="prod" />
                <Label htmlFor="prod">Production</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beta" id="beta" />
                <Label htmlFor="beta">Beta</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Audit Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-600">Modified:</span>
              <span className="font-medium">@john</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Time:</span>
              <span className="font-medium">2h ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
