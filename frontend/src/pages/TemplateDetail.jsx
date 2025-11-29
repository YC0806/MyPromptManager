import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, X, Clock, FileCode, History } from 'lucide-react'
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
import {promptsAPI, templatesAPI} from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function TemplateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [versionNumber, setVersionNumber] = useState('')
  const [content, setContent] = useState('')
  const [variables, setVariables] = useState([])
  const variableHistoryRef = useRef(new Map())
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
    loadTemplate()
    loadVersions()
  }, [id])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await templatesAPI.get(id)
      setTemplate(response)
      setMetadata({
        title: response.title || '',
        description: response.description || '',
        labels: response.labels || [],
      })
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    try {
      const response = await templatesAPI.listVersions(id)
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
      const versionData = await templatesAPI.getVersion(id, versionId)
      const versionContent = versionData.content || ''
      const versionVariables = (versionData.variables || []).map(variable => ({
        name: variable.name,
        description: variable.description || '',
        default: variable.default || '',
      }))
      const syncedVariables = syncVariablesWithContent(versionContent, versionVariables)
      rememberVariables([...versionVariables, ...syncedVariables])
      setVariables(syncedVariables)
      setVersionNumber(versionData.version_number)
      setContent(versionContent)

    } catch (error) {
      console.error('Failed to load version:', error)
    }
  }
 
  const rememberVariables = (vars = []) => {
    const history = variableHistoryRef.current
    vars.forEach(variable => {
      if (!variable?.name) return
      history.set(variable.name, {
        description: variable.description || '',
        default: variable.default || '',
      })
    })
  }

  const extractVariables = (text) => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = [...text.matchAll(regex)]
    return [...new Set(matches.map(m => m[1]))]
  }

  const syncVariablesWithContent = (text, sourceVariables = []) => {
    const detectedVariables = extractVariables(text)
    const variableMap = new Map(sourceVariables.map(variable => [variable.name, variable]))
    return detectedVariables.map(varName => {
      const existing = variableMap.get(varName) || variableHistoryRef.current.get(varName)
      return {
        name: varName,
        description: existing?.description || '',
        default: existing?.default || '',
      }
    })
  }

  const updateVariables = (text) => {
    setVariables(prevVariables => {
      rememberVariables(prevVariables)
      const synced = syncVariablesWithContent(text, prevVariables)
      rememberVariables(synced)
      return synced
    })
  }

  const handleVariableChange = (varName, field, value) => {
    setVariables(prevVariables => {
      const updated = prevVariables.map(variable =>
        variable.name === varName
          ? { ...variable, [field]: value }
          : variable
      )
      rememberVariables(updated)
      return updated
    })
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
      await templatesAPI.update(id, metadata.title, metadata.labels, metadata.description)
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
      await templatesAPI.createVersion(id, newVersionNumber, content, variables)
      // Reload data
      await loadTemplate()
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
    { label: 'Templates', href: '/templates' },
    { label: metadata.title || 'Loading...' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading template...</p>
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
            <div className="flex items-center gap-3">
              <FileCode className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-foreground">{metadata.title}</h1>
            </div>
            <div className="flex gap-2 mt-2">
              {metadata.labels.map((label, idx) => (
                <Badge key={idx} variant="outline">{label}</Badge>
              ))}
              <Badge className="bg-purple-100 text-purple-700">Template</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/templates')}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleOpenVersionDialog}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save as New Version'}
            </Button>

            <Button variant="outline" onClick={() => navigate(`/templates/${id}/timeline`)}>
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
                <CardTitle>Template Content - {versionNumber}</CardTitle>
                <CardDescription>
                  Edit template content with {`{{variable}}`} placeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => {
                    const newContent = e.target.value
                    setContent(newContent)
                    updateVariables(newContent)
                  }}
                  className="min-h-[600px] font-mono text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  placeholder="Enter your template content with variables..."
                />
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>
                    Words: {content.split(/\s+/).filter(w => w.length > 0).length} |
                    Variables: {variables.length}
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
                <CardDescription>Edit template properties</CardDescription>
                <Button
                    className="bg-purple-500 hover:bg-purple-600"
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

            {/* Version History */}
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Version History
                </CardTitle>
                <CardDescription>
                  Select a version (latest at top)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.length === 0 ? (
                    <p className="text-sm text-zinc-500">No versions yet</p>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion === version.id
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-white hover:bg-zinc-50'
                        }`}
                        onClick={() => handleVersionSelect(version.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold text-zinc-900">
                              {version.version_number}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {version.id.substring(0, 8)} - {formatDate(version.created_at)}
                            </p>
                            {version.variables && version.variables.length > 0 && (
                              <p className="text-xs text-purple-600 mt-1">
                                {version.variables.length} variables
                              </p>
                            )}
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

            {/* Variable Descriptions */}
            {variables.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Variable Descriptions</CardTitle>
                  <CardDescription>Define descriptions and defaults for detected variables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {variables.map((variable) => (
                      <div key={variable.name} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="font-mono text-sm font-semibold text-purple-700 mb-3">
                          {`{{${variable.name}}}`}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Description..."
                            value={variable.description || ''}
                            onChange={(e) => handleVariableChange(variable.name, 'description', e.target.value)}
                          />
                          <Input
                            placeholder="Default value..."
                            value={variables.find(v => v.name === variable.name)?.default || ''}
                            onChange={(e) => handleVariableChange(variable.name, 'default', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Version Number Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveNewVersion()
                  }
                }}
              />
              <p className="text-sm text-zinc-500">
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
              className="bg-purple-500 hover:bg-purple-600"
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
