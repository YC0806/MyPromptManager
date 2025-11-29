import React, { useState } from 'react'
import { GitBranch, Tag, GitMerge, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'

export default function RepoAdvanced() {
  const breadcrumbItems = [
    { label: 'Advanced' },
    { label: 'Repo' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Repository</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Advanced Git operations for your prompts</p>
        </div>

        <Tabs defaultValue="branches" className="w-full">
          <TabsList>
            <TabsTrigger value="branches">
              <GitBranch className="w-4 h-4 mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="cherry-pick">
              <GitMerge className="w-4 h-4 mr-2" />
              Cherry-pick
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="mt-6">
            <BranchesTab />
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <TagsTab />
          </TabsContent>

          <TabsContent value="cherry-pick" className="mt-6">
            <CherryPickTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BranchesTab() {
  const branches = [
    { name: 'main', commit: 'a1b2c3d', message: 'Fix bug in prompt', time: new Date(), ahead: 0, behind: 0 },
    { name: 'feature-x', commit: 'e4f5g6h', message: 'Add new feature', time: new Date(), ahead: 3, behind: 0 },
    { name: 'develop', commit: 'i7j8k9l', message: 'Update template', time: new Date(), ahead: 1, behind: 2 },
  ]

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Branches</CardTitle>
            <CardDescription>Manage Git branches for your prompts</CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Branch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Branch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Latest Commit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Ahead/Behind</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-700">
              {branches.map((branch) => (
                <tr key={branch.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-teal-500" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{branch.name}</span>
                      {branch.name === 'main' && (
                        <Badge variant="outline" className="text-xs">default</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded dark:text-zinc-100">
                        {branch.commit}
                      </code>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{branch.message}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {branch.ahead > 0 || branch.behind > 0 ? (
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">
                        {branch.ahead > 0 && `+${branch.ahead}`}
                        {branch.ahead > 0 && branch.behind > 0 && ' / '}
                        {branch.behind > 0 && `-${branch.behind}`}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm">Switch</Button>
                    <Button variant="ghost" size="sm">Compare</Button>
                    {branch.name !== 'main' && (
                      <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400">Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function TagsTab() {
  const tags = [
    { namespace: 'prompt/12345', versions: ['v1.0.0', 'v0.9.5', 'v0.9.0'] },
    { namespace: 'prompt/67890', versions: ['v2.1.0', 'v2.0.0'] },
  ]

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tags</CardTitle>
            <CardDescription>View Git tags organized by prompt</CardDescription>
          </div>
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Export Manifest
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tags.map((tag) => (
          <div key={tag.namespace} className="border dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-teal-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{tag.namespace}</span>
            </div>
            <div className="space-y-2 ml-6">
              {tag.versions.map((version) => (
                <div key={version} className="flex items-center justify-between py-2 border-b dark:border-zinc-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {version}
                    </Badge>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">2h ago</span>
                  </div>
                  <div className="space-x-2">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Compare</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CherryPickTab() {
  const [selectedCommit, setSelectedCommit] = useState('')
  const [targetBranch, setTargetBranch] = useState('')
  const [conflict, setConflict] = useState(false)

  const handleCheckConflict = () => {
    // Simulate conflict check
    setConflict(Math.random() > 0.5)
  }

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Cherry-pick</CardTitle>
        <CardDescription>Apply specific commits to another branch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Commit</Label>
          <Select value={selectedCommit} onValueChange={setSelectedCommit}>
            <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700">
              <SelectValue placeholder="Choose a commit to cherry-pick" />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700">
              <SelectItem value="a1b2c3d">a1b2c3d - Fix bug in prompt</SelectItem>
              <SelectItem value="e4f5g6h">e4f5g6h - Add new feature</SelectItem>
              <SelectItem value="i7j8k9l">i7j8k9l - Update template</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Target Branch</Label>
          <Select value={targetBranch} onValueChange={setTargetBranch}>
            <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700">
              <SelectValue placeholder="Choose target branch" />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700">
              <SelectItem value="main">main</SelectItem>
              <SelectItem value="develop">develop</SelectItem>
              <SelectItem value="feature-x">feature-x</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCheckConflict}
          disabled={!selectedCommit || !targetBranch}
        >
          Check for Conflicts
        </Button>

        {conflict && (
          <Alert variant="destructive">
            <AlertDescription>
              Conflict detected. Manual resolution required.
            </AlertDescription>
          </Alert>
        )}

        {selectedCommit && targetBranch && !conflict && (
          <div className="pt-4">
            <Button className="bg-teal-500 hover:bg-teal-600">
              Apply Cherry-pick
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
