import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Package, Clock, TrendingUp, ArrowRight, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalTemplates: 0,
    totalChats: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch counts for all item types
      const [promptsRes, templatesRes, chatsRes, recentItems] = await Promise.all([
        api.prompts.list({ limit: 1 }),
        api.templates.list({ limit: 1 }),
        api.chats.list({ limit: 1 }),
        api.search.search({ limit: 10 }) // Get recent items across all types
      ])

      // Build recent activity from search results
      const recentActivity = (recentItems.items || []).map(item => ({
        id: item.id,
        type: item.type || 'prompt',
        title: item.title,
        slug: item.slug,
        time: new Date(item.updated_at || item.created_at),
      }))

      setStats({
        totalPrompts: promptsRes.total || 0,
        totalTemplates: templatesRes.total || 0,
        totalChats: chatsRes.total || 0,
        recentActivity,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [{ label: 'Dashboard' }]

  return (
    <div className="min-h-screen">
      <Breadcrumb items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Dashboard</h1>
          <p className="text-zinc-600">Welcome back! Here's what's happening with your prompts.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => navigate('/prompts')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Total Prompts
              </CardTitle>
              <FileText className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {loading ? '...' : stats.totalPrompts}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Click to view all prompts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => navigate('/templates')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Total Templates
              </CardTitle>
              <Package className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {loading ? '...' : stats.totalTemplates}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Click to view all templates
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => navigate('/chats')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Total Chats
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {loading ? '...' : stats.totalChats}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Click to view all chats
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all items</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-zinc-500">Loading...</div>
            ) : stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p>No recent activity yet.</p>
                <p className="text-sm mt-2">Create your first prompt or template to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => {
                  const getIcon = (type) => {
                    switch(type) {
                      case 'template': return <Package className="w-5 h-5 text-purple-600" />
                      case 'chat': return <MessageSquare className="w-5 h-5 text-blue-600" />
                      default: return <FileText className="w-5 h-5 text-teal-600" />
                    }
                  }

                  const getIconBg = (type) => {
                    switch(type) {
                      case 'template': return 'bg-purple-100'
                      case 'chat': return 'bg-blue-100'
                      default: return 'bg-teal-100'
                    }
                  }

                  const getRoute = (type, id) => {
                    switch(type) {
                      case 'template': return `/templates/${id}`
                      case 'chat': return `/chats/${id}`
                      default: return `/prompts/${id}`
                    }
                  }

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => navigate(getRoute(activity.type, activity.id))}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconBg(activity.type)}`}>
                          {getIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{activity.title}</p>
                          <p className="text-sm text-zinc-500">
                            Updated {formatDate(activity.time)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {activity.type}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/prompts')}>
                <FileText className="mr-2 w-4 h-4" />
                View All Prompts
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/releases')}>
                <Package className="mr-2 w-4 h-4" />
                View Releases
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/timeline')}>
                <Clock className="mr-2 w-4 h-4" />
                View Timeline
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-white">Get Started</CardTitle>
              <CardDescription className="text-white/80">
                New to MyPromptManager? Learn the basics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
