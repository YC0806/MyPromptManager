import React, { useState, useEffect } from 'react'
import { Package, FileText, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterReleasesOnly, setFilterReleasesOnly] = useState(false)

  useEffect(() => {
    loadTimeline()
  }, [filterReleasesOnly])

  const loadTimeline = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration
      const mockEvents = [
        {
          id: 1,
          type: 'release',
          title: 'API Documentation Prompt',
          version: 'v1.2.0',
          channel: 'prod',
          notes: 'Updated API examples',
          author: 'john',
          time: new Date(),
          project: 'api-docs',
        },
        {
          id: 2,
          type: 'draft',
          title: 'Customer Support Template',
          changes: 3,
          author: 'jane',
          time: new Date(Date.now() - 3600000),
          project: 'customer-support',
        },
        {
          id: 3,
          type: 'release',
          title: 'Code Review Prompt',
          version: 'v2.0.0',
          channel: 'beta',
          notes: 'Major update with new features',
          author: 'bob',
          time: new Date(Date.now() - 7200000),
          project: 'dev-tools',
        },
      ]

      const filtered = filterReleasesOnly
        ? mockEvents.filter(e => e.type === 'release')
        : mockEvents

      setEvents(filtered)
    } catch (error) {
      console.error('Failed to load timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [{ label: 'Timeline' }]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">Timeline</h1>
            <p className="text-zinc-600">View all releases and activity across your prompts</p>
          </div>
          <Button
            variant={filterReleasesOnly ? 'default' : 'outline'}
            onClick={() => setFilterReleasesOnly(!filterReleasesOnly)}
          >
            {filterReleasesOnly ? 'Show All' : 'Releases Only'}
          </Button>
        </div>

        {/* Timeline Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">Loading timeline...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, index) => (
              <TimelineEvent key={event.id} event={event} isLast={index === events.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineEvent({ event, isLast }) {
  const isRelease = event.type === 'release'

  return (
    <div className="relative pl-8">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-4 top-12 bottom-0 w-px bg-zinc-200"></div>
      )}

      {/* Timeline Dot */}
      <div className={`absolute left-0 top-4 w-8 h-8 rounded-full flex items-center justify-center ${
        isRelease ? 'bg-teal-100' : 'bg-yellow-100'
      }`}>
        {isRelease ? (
          <Package className="w-4 h-4 text-teal-600" />
        ) : (
          <FileText className="w-4 h-4 text-yellow-600" />
        )}
      </div>

      {/* Event Card */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription className="mt-1">
                {event.project} • By @{event.author} • {formatDate(event.time)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isRelease ? (
                <>
                  <Badge variant="default" className="font-mono">
                    {event.version}
                  </Badge>
                  <Badge variant={event.channel === 'prod' ? 'success' : 'outline'}>
                    {event.channel}
                  </Badge>
                </>
              ) : (
                <Badge variant="warning">
                  {event.changes} changes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {isRelease && event.notes && (
          <CardContent>
            <p className="text-sm text-zinc-600">{event.notes}</p>
          </CardContent>
        )}
        <CardFooter>
          <Button variant="ghost" size="sm">View Details</Button>
          {isRelease && (
            <>
              <Button variant="ghost" size="sm">Compare</Button>
              <Button variant="ghost" size="sm">Rollback</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
