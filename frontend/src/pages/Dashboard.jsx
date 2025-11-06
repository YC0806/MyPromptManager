import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Package, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { commonApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalReleases: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // In real implementation, fetch from API
      // For now, using mock data
      setStats({
        totalPrompts: 42,
        totalReleases: 128,
        recentActivity: [
          { id: 1, type: 'release', title: 'API Documentation Prompt', version: 'v1.2.0', time: new Date() },
          { id: 2, type: 'draft', title: 'Customer Support Template', time: new Date() },
          { id: 3, type: 'release', title: 'Code Review Prompt', version: 'v2.0.0', time: new Date() },
        ],
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
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Total Prompts
              </CardTitle>
              <FileText className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">{stats.totalPrompts}</div>
              <p className="text-xs text-zinc-500 mt-1">
                <TrendingUp className="inline w-3 h-3 text-green-500 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Total Releases
              </CardTitle>
              <Package className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">{stats.totalReleases}</div>
              <p className="text-xs text-zinc-500 mt-1">
                <TrendingUp className="inline w-3 h-3 text-green-500 mr-1" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                Active Drafts
              </CardTitle>
              <Clock className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">7</div>
              <p className="text-xs text-zinc-500 mt-1">
                3 ready to publish
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
                <CardDescription>Latest updates to your prompts and releases</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => navigate('/timeline')}>
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigate(`/prompts/${activity.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'release' ? 'bg-teal-100' : 'bg-yellow-100'
                    }`}>
                      {activity.type === 'release' ? (
                        <Package className="w-5 h-5 text-teal-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{activity.title}</p>
                      <p className="text-sm text-zinc-500">
                        {activity.type === 'release' ? `Released ${activity.version}` : 'Draft saved'} • {formatDate(activity.time)}
                      </p>
                    </div>
                  </div>
                  {activity.type === 'release' && (
                    <Badge variant="success">{activity.version}</Badge>
                  )}
                </div>
              ))}
            </div>
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
