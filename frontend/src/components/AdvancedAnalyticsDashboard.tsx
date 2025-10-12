// Advanced Analytics Dashboard Component
// Provides business intelligence, predictive insights, and performance metrics

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { toast } from 'sonner'

interface ProjectInsights {
  velocity: number
  burndown: BurndownData[]
  riskScore: number
  resourceUtilization: number
  predictions: ProjectPredictions
  healthScore: number
  timelineAccuracy: number
}

interface BurndownData {
  date: string
  remainingWork: number
  idealRemaining: number
  actualProgress: number
}

interface ProjectPredictions {
  estimatedCompletion: string
  confidence: number
  riskFactors: string[]
  recommendedActions: string[]
}

interface TeamPerformanceReport {
  productivity: number
  workloadDistribution: WorkloadDistribution[]
  skillGaps: SkillGap[]
  recommendations: string[]
  utilizationRate: number
  averageVelocity: number
}

interface WorkloadDistribution {
  employeeId: string
  employeeName: string
  projectWorkload: number
  initiativeWorkload: number
  totalWorkload: number
  capacity: number
  utilizationRate: number
}

interface SkillGap {
  skill: string
  requiredLevel: number
  currentLevel: number
  gap: number
  affectedProjects: string[]
}

interface BusinessMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageProjectDuration: number
  totalEmployees: number
  averageWorkload: number
  budgetUtilization: number
  timelineAccuracy: number
}

export function AdvancedAnalyticsDashboard() {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceReport | null>(null)
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projectInsights, setProjectInsights] = useState<ProjectInsights | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadProjectInsights(selectedProject)
    }
  }, [selectedProject])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('bpl-token')
      if (!token) return

      // Load business metrics
      const metricsResponse = await fetch(`${API_ENDPOINTS.ANALYTICS}/business-metrics`, {
        headers: getDefaultHeaders(token)
      })
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setBusinessMetrics(metricsData.data)
      }

      // Load team performance
      const teamResponse = await fetch(`${API_ENDPOINTS.ANALYTICS}/team-performance`, {
        headers: getDefaultHeaders(token)
      })
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeamPerformance(teamData.data)
      }

      // Load predictive analytics
      const predictiveResponse = await fetch(`${API_ENDPOINTS.ANALYTICS}/predictive`, {
        headers: getDefaultHeaders(token)
      })
      if (predictiveResponse.ok) {
        const predictiveData = await predictiveResponse.json()
        setPredictiveAnalytics(predictiveData.data)
      }

    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectInsights = async (projectId: string) => {
    try {
      const token = localStorage.getItem('bpl-token')
      if (!token) return

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}/project-insights/${projectId}`, {
        headers: getDefaultHeaders(token)
      })

      if (response.ok) {
        const data = await response.json()
        setProjectInsights(data.data)
      }
    } catch (error) {
      console.error('Error loading project insights:', error)
      toast.error('Failed to load project insights')
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'text-green-600 bg-green-100'
    if (riskScore < 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getHealthColor = (healthScore: number) => {
    if (healthScore >= 80) return 'text-green-600 bg-green-100'
    if (healthScore >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Business intelligence and predictive insights</p>
        </div>
        <Button onClick={loadAnalyticsData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Business Metrics Overview */}
      {businessMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {businessMetrics.activeProjects} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.averageWorkload}%</div>
              <p className="text-xs text-muted-foreground">
                {businessMetrics.totalEmployees} employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline Accuracy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.timelineAccuracy}%</div>
              <p className="text-xs text-muted-foreground">
                Avg {businessMetrics.averageProjectDuration} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.budgetUtilization}%</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="project">Project Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>Current project status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {businessMetrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Projects</span>
                      <Badge variant="secondary">{businessMetrics.activeProjects}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completed Projects</span>
                      <Badge variant="outline">{businessMetrics.completedProjects}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Projects</span>
                      <Badge>{businessMetrics.totalProjects}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Indicators</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {businessMetrics && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Timeline Accuracy</span>
                        <span className="text-sm text-muted-foreground">{businessMetrics.timelineAccuracy}%</span>
                      </div>
                      <Progress value={businessMetrics.timelineAccuracy} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm text-muted-foreground">{businessMetrics.budgetUtilization}%</span>
                      </div>
                      <Progress value={businessMetrics.budgetUtilization} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Team Utilization</span>
                        <span className="text-sm text-muted-foreground">{businessMetrics.averageWorkload}%</span>
                      </div>
                      <Progress value={businessMetrics.averageWorkload} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-4">
          {teamPerformance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Productivity */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Productivity</CardTitle>
                  <CardDescription>Overall team performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Productivity Score</span>
                      <Badge className={getHealthColor(teamPerformance.productivity)}>
                        {teamPerformance.productivity}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Utilization Rate</span>
                      <Badge className={getHealthColor(teamPerformance.utilizationRate)}>
                        {teamPerformance.utilizationRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Velocity</span>
                      <Badge variant="outline">{teamPerformance.averageVelocity}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workload Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Workload Distribution</CardTitle>
                  <CardDescription>Team member workload breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamPerformance.workloadDistribution.slice(0, 5).map((member) => (
                      <div key={member.employeeId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{member.employeeName}</span>
                          <span className="text-sm text-muted-foreground">{member.utilizationRate}%</span>
                        </div>
                        <Progress value={member.utilizationRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skill Gaps */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Skill Gaps Analysis</CardTitle>
                  <CardDescription>Identified skill gaps and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamPerformance.skillGaps.map((gap) => (
                      <div key={gap.skill} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{gap.skill}</div>
                          <div className="text-sm text-muted-foreground">
                            Required: {gap.requiredLevel}/10 | Current: {gap.currentLevel}/10
                          </div>
                        </div>
                        <Badge variant={gap.gap > 2 ? "destructive" : "secondary"}>
                          Gap: {gap.gap}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-4">
          {predictiveAnalytics && (
            <div className="space-y-6">
              {/* Project Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Completion Predictions</CardTitle>
                  <CardDescription>AI-powered project outcome forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveAnalytics.projectPredictions?.slice(0, 5).map((project: any) => (
                      <div key={project.projectId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{project.projectName}</div>
                          <div className="text-sm text-muted-foreground">
                            Predicted completion: {new Date(project.predictedCompletion).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getHealthColor(project.confidence)}>
                            {project.confidence}% confidence
                          </Badge>
                          {project.riskFactors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {project.riskFactors.length} risk factors
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resource Forecast */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Demand Forecast</CardTitle>
                    <CardDescription>Predicted resource requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Next Month</span>
                        <div className="text-right">
                          <div className="font-medium">{predictiveAnalytics.resourceForecast?.nextMonth?.developers || 0} Developers</div>
                          <div className="text-sm text-muted-foreground">{predictiveAnalytics.resourceForecast?.nextMonth?.designers || 0} Designers</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Next Quarter</span>
                        <div className="text-right">
                          <div className="font-medium">{predictiveAnalytics.resourceForecast?.nextQuarter?.developers || 0} Developers</div>
                          <div className="text-sm text-muted-foreground">{predictiveAnalytics.resourceForecast?.nextQuarter?.designers || 0} Designers</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Budget Forecast</CardTitle>
                    <CardDescription>Predicted budget utilization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Month</span>
                        <span className="font-medium">${predictiveAnalytics.budgetForecast?.currentMonth?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Next Month</span>
                        <span className="font-medium">${predictiveAnalytics.budgetForecast?.nextMonth?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Next Quarter</span>
                        <span className="font-medium">${predictiveAnalytics.budgetForecast?.nextQuarter?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Project Insights Tab */}
        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Insights</CardTitle>
              <CardDescription>Detailed analysis for specific projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Project</label>
                  <select 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Choose a project...</option>
                    {/* Project options would be loaded from API */}
                  </select>
                </div>

                {projectInsights && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Velocity</span>
                        <Badge variant="outline">{projectInsights.velocity}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk Score</span>
                        <Badge className={getRiskColor(projectInsights.riskScore)}>
                          {projectInsights.riskScore}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Health Score</span>
                        <Badge className={getHealthColor(projectInsights.healthScore)}>
                          {projectInsights.healthScore}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Risk Factors</div>
                        <div className="space-y-1">
                          {projectInsights.predictions.riskFactors.map((factor, index) => (
                            <div key={index} className="text-sm text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Recommendations</div>
                        <div className="space-y-1">
                          {projectInsights.predictions.recommendedActions.map((action, index) => (
                            <div key={index} className="text-sm text-blue-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
