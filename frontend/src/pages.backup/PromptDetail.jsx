import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, X, Clock, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { promptsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function PromptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(null)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [versionNumber, setVersionNumber] = useState('')
  const [content, setContent] = useState('')
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    labels: [],
  })
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [newVersionNumber, setNewVersionNumber] = useState('')

  useEffect(() => {
    loadPrompt()
    loadVersions()
  }, [id])

  const loadPrompt = async () => {
    try {
      setLoading(true)
      const response = await promptsAPI.get(id)
      setPrompt(response)
      setMetadata({
        title: response.title || '',
        description: response.description || '',
        labels: response.labels || [],
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
          await handleVersionSelect(response.versions[0].id)
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  const handleVersionSelect = async (versionId) => {
    try {
      setSelectedVersion(versionId)
      const versionData = await promptsAPI.getVersion(id, versionId)
      setVersionNumber(versionData.version_number)
      setContent(versionData.content || '')
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

  const handleSaveMetaData = async () => {
      await promptsAPI.update(id, metadata.title, metadata.labels, metadata.description)
  }

  const handleOpenVersionDialog = () => {
    // Suggest next version number
    const currentVersion = versionNumber || '1.0.0'
    const versionParts = currentVersion.split('.')
    if (versionParts.length === 3) {
      const [major, minor, patch] = versionParts
      const nextPatch = parseInt(patch) + 1
      setNewVersionNumber(`${major}.${minor}.${nextPatch}`)
    } else {
      setNewVersionNumber('1.0.0')
    }
    setShowVersionDialog(true)
  }

  const handleSaveNewVersion = async () => {
    if (!newVersionNumber.trim()) {
      alert('Please enter a version number')
      return
    }

    try {
      setSaving(true)
      setShowVersionDialog(false)
      await promptsAPI.createVersion(id, newVersionNumber, content)
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{metadata.title}</h1>
            <div className="flex gap-2 mt-2">
              {metadata.labels.map((label, idx) => (
                <Badge key={idx} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/prompts')}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleOpenVersionDialog}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save as New Version'}
            </Button>

            <Button variant="outline" onClick={() => navigate(`/prompts/${id}/timeline`)}>
              <History className="w-4 h-4 mr-2" />
              Timeline
            </Button>
          </div>
        </div>

        {/* Content Layout: Left (Main) + Right (Secondary) */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - Left (8/12) */}
          <div className="col-span-8">
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Prompt Content - {versionNumber}</CardTitle>
                <CardDescription>
                  Edit your prompt content in Markdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  placeholder="Enter your prompt content here..."
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

          {/* Secondary Content Area - Right (4/12) */}
          <div className="col-span-4 space-y-6">
            {/* Metadata */}
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Edit prompt properties</CardDescription>
                <Button
                    className="bg-teal-500 hover:bg-teal-600"
                    onClick={handleSaveMetaData}
                    disabled={saving}
                >
                <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save MetaData'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Enter title..."
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

            {/* Version History */}
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
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
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No versions yet</p>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion === version.id
                            ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700'
                            : 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                        }`}
                        onClick={() => handleVersionSelect(version.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {version.version_number.substring(0, 8)}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {version.id.substring(0, 8)} - {formatDate(version.created_at)}
                            </p>
                          </div>
                          {selectedVersion === version.id && (
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
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-amber-900 dark:text-amber-400 text-sm">Note</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                <p>• Each save creates a new version</p>
                <p>• All versions are preserved</p>
                <p>• Click on a version to view its content</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Version Number Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
            <DialogDescription>
              Enter a version number for this new version (e.g., 1.0.0, 2.1.3)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version">Version Number</Label>
              <Input
                id="version"
                value={newVersionNumber}
                onChange={(e) => setNewVersionNumber(e.target.value)}
                placeholder="e.g., 1.0.0"
                autoFocus
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveNewVersion()
                  }
                }}
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Current version: {versionNumber || 'None'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVersionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleSaveNewVersion}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
