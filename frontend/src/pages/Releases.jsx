import React, { useState, useEffect } from 'react'
import { Package, GitBranch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'

export default function Releases() {
  const [releases, setReleases] = useState({ prod: [], beta: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReleases()
  }, [])

  const loadReleases = async () => {
    try {
      setLoading(true)
      // Mock data - channel-based format
      const mockReleases = {
        prod: [
          { id: 1, title: 'API Prompt', version: 'v1.2.0', time: new Date(), notes: 'Updated examples' },
          { id: 2, title: 'API Prompt', version: 'v1.1.0', time: new Date(Date.now() - 86400000), notes: 'Added OAuth' },
          { id: 4, title: 'Support Template', version: 'v2.0.0', time: new Date(Date.now() - 172800000), notes: 'Major update' },
        ],
        beta: [
          { id: 3, title: 'API Prompt', version: 'v1.3.0-beta', time: new Date(Date.now() - 43200000), notes: 'Testing new features' },
        ],
      }

      setReleases(mockReleases)
    } catch (error) {
      console.error('Failed to load releases:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [{ label: 'Releases' }]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Releases</h1>
          <p className="text-zinc-600">View all published releases</p>
        </div>

        {/* Swimlane Timeline */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">Loading releases...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Production Lane */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-teal-500" />
                Production
              </h2>
              <div className="relative">
                <div className="absolute left-0 top-4 right-0 h-px bg-teal-200"></div>
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  <div className="sticky left-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 pr-4 z-10">
                    <Badge variant="success" className="text-xs">prod</Badge>
                  </div>
                  {releases.prod?.map((release) => (
                    <ReleaseCard key={release.id} release={release} channel="prod" />
                  ))}
                  {releases.prod?.length === 0 && (
                    <div className="text-sm text-zinc-400">No production releases</div>
                  )}
                </div>
              </div>
            </div>

            {/* Beta Lane */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-500" />
                Beta
              </h2>
              <div className="relative">
                <div className="absolute left-0 top-4 right-0 h-px bg-zinc-200"></div>
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  <div className="sticky left-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 pr-4 z-10">
                    <Badge variant="outline" className="text-xs">beta</Badge>
                  </div>
                  {releases.beta?.map((release) => (
                    <ReleaseCard key={release.id} release={release} channel="beta" />
                  ))}
                  {releases.beta?.length === 0 && (
                    <div className="text-sm text-zinc-400">No beta releases</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReleaseCard({ release, channel }) {
  return (
    <Card className="w-64 flex-shrink-0 relative z-0">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Package className="w-5 h-5 text-teal-500" />
          <Badge variant="default" className="font-mono text-xs">
            {release.version}
          </Badge>
        </div>
        <CardTitle className="text-base">{release.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-600 line-clamp-2">{release.notes}</p>
        <p className="text-xs text-zinc-500 mt-2">
          {formatDate(release.time)}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" variant="ghost" className="text-xs">
          Compare
        </Button>
        <Button size="sm" variant="ghost" className="text-xs">
          Rollback
        </Button>
      </CardFooter>
    </Card>
  )
}
