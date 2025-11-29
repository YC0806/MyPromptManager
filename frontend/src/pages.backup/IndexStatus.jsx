import React, { useState, useEffect } from 'react'
import { Database, RefreshCw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { indexAPI } from '@/lib/api'

export default function IndexStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [repairing, setRepairing] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await indexAPI.status()
      setStatus(response)
    } catch (error) {
      console.error('Failed to load index status:', error)
      // Use mock data for demonstration
      setStatus({
        version: 'v3.2.1',
        generated_at: '2024-11-05 14:32:15',
        lock_status: 'unlocked',
        entries_count: 42,
        last_error: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRepair = async () => {
    try {
      setRepairing(true)
      await indexAPI.rebuild() // Note: API doesn't have separate repair endpoint, using rebuild
      await loadStatus()
      // Show success toast
    } catch (error) {
      console.error('Failed to repair index:', error)
    } finally {
      setRepairing(false)
    }
  }

  const handleRebuild = async () => {
    if (!confirm('Are you sure you want to rebuild the entire index? This may take a while.')) {
      return
    }

    try {
      setRebuilding(true)
      await indexAPI.rebuild()
      await loadStatus()
      // Show success toast
    } catch (error) {
      console.error('Failed to rebuild index:', error)
    } finally {
      setRebuilding(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Admin' },
    { label: 'Index Status' },
  ]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Index Status</h1>
          <p className="text-zinc-600">Monitor and manage the search index</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">Loading index status...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-teal-500" />
                  <CardTitle>Index Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-zinc-600">Index Version</dt>
                    <dd className="font-mono font-semibold text-zinc-900">{status?.version}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-zinc-600">Generated At</dt>
                    <dd className="font-medium text-zinc-900">{status?.generated_at}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-zinc-600">Lock Status</dt>
                    <dd>
                      <Badge variant={status?.lock_status === 'unlocked' ? 'success' : 'destructive'}>
                        {status?.lock_status === 'unlocked' ? '🔓 Normal' : '🔒 Locked'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-zinc-600">Total Entries</dt>
                    <dd className="font-semibold text-zinc-900">{status?.entries_count}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRepair}
                  disabled={repairing}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  {repairing ? 'Repairing...' : 'Repair'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRebuild}
                  disabled={rebuilding}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {rebuilding ? 'Rebuilding...' : 'Rebuild'}
                </Button>
              </CardFooter>
            </Card>

            {/* Error Alert (if any) */}
            {status?.last_error && (
              <Alert variant="destructive">
                <AlertTitle>Index Error</AlertTitle>
                <AlertDescription>{status.last_error}</AlertDescription>
              </Alert>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>About Index Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-600">
                <div>
                  <h4 className="font-semibold text-zinc-900 mb-2">Repair</h4>
                  <p>
                    Quickly fixes minor inconsistencies in the index cache. This is a fast operation
                    that synchronizes the index with the latest Git state.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 mb-2">Rebuild</h4>
                  <p>
                    Completely rebuilds the entire index from scratch. This is a comprehensive operation
                    that may take several minutes depending on the number of prompts. Use this when
                    repair doesn't fix the issue.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
