// Advanced Analytics Service for Business Intelligence
// Provides data-driven insights, predictive analytics, and performance metrics

import { PrismaClient } from '@prisma/client'
import { db } from './database'
import cacheService from './cacheService'

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

class AnalyticsService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Generate comprehensive project insights
   */
  async generateProjectInsights(projectId: string): Promise<ProjectInsights> {
    const cacheKey = `project_insights:${projectId}`
    
    return await cacheService.wrap(cacheKey, async () => {
      const project = await db.getProjectById(projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      const velocity = await this.calculateVelocity(projectId)
      const burndown = await this.generateBurndownChart(projectId)
      const riskScore = await this.calculateRiskScore(projectId)
      const resourceUtilization = await this.calculateResourceUtilization(projectId)
      const predictions = await this.generatePredictions(projectId)
      const healthScore = await this.calculateHealthScore(projectId)
      const timelineAccuracy = await this.calculateTimelineAccuracy(projectId)

      return {
        velocity,
        burndown,
        riskScore,
        resourceUtilization,
        predictions,
        healthScore,
        timelineAccuracy
      }
    }, { ttl: 300, tags: ['project', projectId] })
  }

  /**
   * Generate team performance report
   */
  async generateTeamPerformanceReport(teamId?: string): Promise<TeamPerformanceReport> {
    const cacheKey = `team_performance:${teamId || 'all'}`
    
    return await cacheService.wrap(cacheKey, async () => {
      const productivity = await this.calculateProductivity(teamId)
      const workloadDistribution = await this.analyzeWorkloadDistribution(teamId)
      const skillGaps = await this.identifySkillGaps(teamId)
      const recommendations = await this.generateRecommendations(teamId)
      const utilizationRate = await this.calculateUtilizationRate(teamId)
      const averageVelocity = await this.calculateAverageVelocity(teamId)

      return {
        productivity,
        workloadDistribution,
        skillGaps,
        recommendations,
        utilizationRate,
        averageVelocity
      }
    }, { ttl: 600, tags: ['team', teamId || 'all'] })
  }

  /**
   * Generate business metrics dashboard
   */
  async generateBusinessMetrics(): Promise<BusinessMetrics> {
    const cacheKey = 'business_metrics'
    
    return await cacheService.wrap(cacheKey, async () => {
      const projects = await db.getAllProjects()
      const users = await db.getAllUsers()
      
      const totalProjects = projects.length
      const activeProjects = projects.filter(p => p.status === 'active').length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      
      const averageProjectDuration = this.calculateAverageProjectDuration(projects)
      const totalEmployees = users.filter(u => u.role !== 'admin').length
      const averageWorkload = await this.calculateAverageWorkload()
      const budgetUtilization = await this.calculateBudgetUtilization(projects)
      const timelineAccuracy = await this.calculateTimelineAccuracy()

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        averageProjectDuration,
        totalEmployees,
        averageWorkload,
        budgetUtilization,
        timelineAccuracy
      }
    }, { ttl: 300, tags: ['business', 'metrics'] })
  }

  /**
   * Generate predictive analytics
   */
  async generatePredictiveAnalytics(): Promise<any> {
    const cacheKey = 'predictive_analytics'
    
    return await cacheService.wrap(cacheKey, async () => {
      const projects = await db.getAllProjects()
      const users = await db.getAllUsers()
      
      // Project completion predictions
      const projectPredictions = await Promise.all(
        projects.map(async (project) => {
          const insights = await this.generateProjectInsights(project.id)
          return {
            projectId: project.id,
            projectName: project.name,
            predictedCompletion: insights.predictions.estimatedCompletion,
            confidence: insights.predictions.confidence,
            riskFactors: insights.predictions.riskFactors
          }
        })
      )

      // Resource demand forecasting
      const resourceForecast = await this.forecastResourceDemand()

      // Budget predictions
      const budgetForecast = await this.forecastBudgetUtilization()

      return {
        projectPredictions,
        resourceForecast,
        budgetForecast,
        generatedAt: new Date().toISOString()
      }
    }, { ttl: 1800, tags: ['predictive', 'analytics'] })
  }

  /**
   * Private calculation methods
   */
  private async calculateVelocity(projectId: string): Promise<number> {
    // Calculate story points or tasks completed per sprint/week
    const project = await db.getProjectById(projectId)
    const milestones = project?.milestones || []
    const completedMilestones = milestones.filter((m: any) => m.completed)
    
    if (milestones.length === 0) return 0
    
    // Simple velocity calculation based on milestone completion rate
    const completionRate = completedMilestones.length / milestones.length
    return Math.round(completionRate * 100)
  }

  private async generateBurndownChart(projectId: string): Promise<BurndownData[]> {
    const project = await db.getProjectById(projectId)
    if (!project) return []

    const milestones = project.milestones || []
    const totalMilestones = milestones.length
    
    if (totalMilestones === 0) return []

    const burndownData: BurndownData[] = []
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i <= totalDays; i += 7) { // Weekly data points
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const completedByDate = milestones.filter((m: any) => 
        m.completed && new Date(m.completedAt!) <= currentDate
      ).length
      
      const remainingWork = totalMilestones - completedByDate
      const idealRemaining = totalMilestones * (1 - i / totalDays)
      const actualProgress = (completedByDate / totalMilestones) * 100

      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        remainingWork,
        idealRemaining: Math.max(0, idealRemaining),
        actualProgress
      })
    }

    return burndownData
  }

  private async calculateRiskScore(projectId: string): Promise<number> {
    const projectData = await db.getProjectById(projectId)
    if (!projectData) return 0

    let riskScore = 0

    // Timeline risk
    const now = new Date()
    const endDate = new Date(projectData.endDate)
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 30) riskScore += 30
    else if (daysRemaining < 60) riskScore += 20
    else if (daysRemaining < 90) riskScore += 10

    // Progress risk
    const milestones = projectData?.milestones || []
    const completedMilestones = milestones.filter((m: any) => m.completed).length
    const progressRate = milestones.length > 0 ? completedMilestones / milestones.length : 0
    
    if (progressRate < 0.3) riskScore += 25
    else if (progressRate < 0.5) riskScore += 15
    else if (progressRate < 0.7) riskScore += 10

    // Resource risk
    const assignments = projectData.assignedEmployees || []
    if (assignments.length === 0) riskScore += 20
    else if (assignments.length < 3) riskScore += 10

    return Math.min(100, riskScore)
  }

  private async calculateResourceUtilization(projectId: string): Promise<number> {
    const project = await db.getProjectById(projectId)
    if (!project) return 0

    const assignments = project.assignedEmployees || []
    if (assignments.length === 0) return 0

    const totalInvolvement = assignments.reduce((sum: number, assignment: any) => 
      sum + (assignment.involvementPercentage || 0), 0
    )

    return Math.round(totalInvolvement / assignments.length)
  }

  private async generatePredictions(projectId: string): Promise<ProjectPredictions> {
    const projectData = await db.getProjectById(projectId)
    if (!projectData) {
      return {
        estimatedCompletion: '',
        confidence: 0,
        riskFactors: [],
        recommendedActions: []
      }
    }

    const milestones = projectData?.milestones || []
    const completedMilestones = milestones.filter((m: any) => m.completed).length
    const totalMilestones = milestones.length

    let estimatedCompletion = projectData.endDate
    let confidence = 50
    const riskFactors: string[] = []
    const recommendedActions: string[] = []

    if (totalMilestones > 0) {
      const completionRate = completedMilestones / totalMilestones
      const progressRate = projectData.progress || 0

      // Adjust completion date based on progress
      if (completionRate < 0.5) {
        const delayDays = Math.ceil((0.5 - completionRate) * 30)
        const newEndDate = new Date(projectData.endDate)
        newEndDate.setDate(newEndDate.getDate() + delayDays)
        estimatedCompletion = newEndDate.toISOString()
        confidence = Math.max(20, 50 - delayDays)
        riskFactors.push('Behind schedule')
        recommendedActions.push('Increase team size or extend timeline')
      } else {
        confidence = Math.min(90, 50 + (completionRate * 40))
      }
    }

    // Add risk factors based on project characteristics
    if (projectData.budget && projectData.budget > 100000) {
      riskFactors.push('High budget project')
      recommendedActions.push('Implement strict budget monitoring')
    }

    if (milestones.length > 10) {
      riskFactors.push('Complex project with many milestones')
      recommendedActions.push('Break down into smaller phases')
    }

    return {
      estimatedCompletion,
      confidence,
      riskFactors,
      recommendedActions
    }
  }

  private async calculateHealthScore(projectId: string): Promise<number> {
    const project = await db.getProjectById(projectId)
    if (!project) return 0

    let healthScore = 100

    // Progress health
    const progress = project.progress || 0
    if (progress < 30) healthScore -= 20
    else if (progress < 50) healthScore -= 10

    // Timeline health
    const now = new Date()
    const endDate = new Date(project.endDate)
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 0) healthScore -= 30
    else if (daysRemaining < 30) healthScore -= 15

    // Resource health
    const assignments = project.assignedEmployees || []
    if (assignments.length === 0) healthScore -= 25
    else if (assignments.length < 2) healthScore -= 10

    return Math.max(0, healthScore)
  }

  private async calculateTimelineAccuracy(projectId?: string): Promise<number> {
    const projects = projectId 
      ? [await db.getProjectById(projectId)].filter(Boolean)
      : await db.getAllProjects()

    const completedProjects = projects.filter(p => p.status === 'completed')
    if (completedProjects.length === 0) return 0

    let totalAccuracy = 0
    completedProjects.forEach(project => {
      const plannedEnd = new Date(project.endDate)
      const actualEnd = new Date(project.updatedAt) // Assuming this is when it was marked complete
      const daysDiff = Math.abs((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24))
      const accuracy = Math.max(0, 100 - (daysDiff / 7) * 10) // 10% penalty per week
      totalAccuracy += accuracy
    })

    return Math.round(totalAccuracy / completedProjects.length)
  }

  private async calculateProductivity(teamId?: string): Promise<number> {
    // Calculate team productivity based on completed work vs time
    const projects = await db.getAllProjects()
    const teamProjects = teamId 
      ? projects.filter(p => p.managerId === teamId)
      : projects

    if (teamProjects.length === 0) return 0

    let totalProductivity = 0
    for (const project of teamProjects) {
      const projectData = await db.getProjectById(project.id)
      const milestones = projectData?.milestones || []
      const completedMilestones = milestones.filter((m: any) => m.completed).length
      const productivity = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0
      totalProductivity += productivity
    }

    return Math.round(totalProductivity / teamProjects.length)
  }

  private async analyzeWorkloadDistribution(teamId?: string): Promise<WorkloadDistribution[]> {
    const users = await db.getAllUsers()
    const teamUsers = teamId 
      ? users.filter(u => u.managerId === teamId)
      : users.filter(u => u.role !== 'admin')

    const distribution: WorkloadDistribution[] = []

    for (const user of teamUsers) {
      const workload = await db.getEmployeeWorkload(user.id)
      
      distribution.push({
        employeeId: user.id,
        employeeName: user.name,
        projectWorkload: workload.projectWorkload,
        initiativeWorkload: workload.initiativeWorkload,
        totalWorkload: workload.totalWorkload,
        capacity: workload.workloadCap,
        utilizationRate: Math.round((workload.totalWorkload / workload.workloadCap) * 100)
      })
    }

    return distribution.sort((a, b) => b.utilizationRate - a.utilizationRate)
  }

  private async identifySkillGaps(teamId?: string): Promise<SkillGap[]> {
    // This would typically integrate with a skills database
    // For now, return mock data based on project requirements
    const projects = await db.getAllProjects()
    
    const skillGaps: SkillGap[] = [
      {
        skill: 'React',
        requiredLevel: 8,
        currentLevel: 6,
        gap: 2,
        affectedProjects: projects.filter(p => p.requiredSkills?.includes('React')).map(p => p.id)
      },
      {
        skill: 'Node.js',
        requiredLevel: 7,
        currentLevel: 5,
        gap: 2,
        affectedProjects: projects.filter(p => p.requiredSkills?.includes('Node.js')).map(p => p.id)
      }
    ]

    return skillGaps.filter(gap => gap.affectedProjects.length > 0)
  }

  private async generateRecommendations(teamId?: string): Promise<string[]> {
    const recommendations: string[] = []
    
    const workloadDistribution = await this.analyzeWorkloadDistribution(teamId)
    const overutilized = workloadDistribution.filter(w => w.utilizationRate > 100)
    const underutilized = workloadDistribution.filter(w => w.utilizationRate < 50)

    if (overutilized.length > 0) {
      recommendations.push(`Consider redistributing workload from overutilized team members: ${overutilized.map(w => w.employeeName).join(', ')}`)
    }

    if (underutilized.length > 0) {
      recommendations.push(`Utilize available capacity from underutilized team members: ${underutilized.map(w => w.employeeName).join(', ')}`)
    }

    const skillGaps = await this.identifySkillGaps(teamId)
    if (skillGaps.length > 0) {
      recommendations.push(`Address skill gaps: ${skillGaps.map(s => s.skill).join(', ')}`)
    }

    return recommendations
  }

  private async calculateUtilizationRate(teamId?: string): Promise<number> {
    const distribution = await this.analyzeWorkloadDistribution(teamId)
    if (distribution.length === 0) return 0

    const totalUtilization = distribution.reduce((sum, w) => sum + w.utilizationRate, 0)
    return Math.round(totalUtilization / distribution.length)
  }

  private async calculateAverageVelocity(teamId?: string): Promise<number> {
    const projects = await db.getAllProjects()
    const teamProjects = teamId 
      ? projects.filter(p => p.managerId === teamId)
      : projects

    let totalVelocity = 0
    for (const project of teamProjects) {
      const velocity = await this.calculateVelocity(project.id)
      totalVelocity += velocity
    }

    return teamProjects.length > 0 ? Math.round(totalVelocity / teamProjects.length) : 0
  }

  private calculateAverageProjectDuration(projects: any[]): number {
    const completedProjects = projects.filter(p => p.status === 'completed')
    if (completedProjects.length === 0) return 0

    const totalDuration = completedProjects.reduce((sum, project) => {
      const start = new Date(project.startDate)
      const end = new Date(project.endDate)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    }, 0)

    return Math.round(totalDuration / completedProjects.length)
  }

  private async calculateAverageWorkload(): Promise<number> {
    const users = await db.getAllUsers()
    const employees = users.filter(u => u.role !== 'admin')
    
    let totalWorkload = 0
    for (const employee of employees) {
      const workload = await db.getEmployeeWorkload(employee.id)
      totalWorkload += workload.totalWorkload
    }

    return employees.length > 0 ? Math.round(totalWorkload / employees.length) : 0
  }

  private async calculateBudgetUtilization(projects: any[]): Promise<number> {
    const projectsWithBudget = projects.filter(p => p.budget && p.budget > 0)
    if (projectsWithBudget.length === 0) return 0

    // This would typically calculate actual vs planned budget
    // For now, return a mock calculation based on progress
    let totalUtilization = 0
    projectsWithBudget.forEach(project => {
      const progress = project.progress || 0
      totalUtilization += progress
    })

    return Math.round(totalUtilization / projectsWithBudget.length)
  }

  private async forecastResourceDemand(): Promise<any> {
    // Mock resource demand forecasting
    return {
      nextMonth: { developers: 5, designers: 2, managers: 1 },
      nextQuarter: { developers: 8, designers: 3, managers: 2 },
      confidence: 75
    }
  }

  private async forecastBudgetUtilization(): Promise<any> {
    // Mock budget forecasting
    return {
      currentMonth: 45000,
      nextMonth: 52000,
      nextQuarter: 180000,
      confidence: 80
    }
  }
}

export default AnalyticsService
export { ProjectInsights, TeamPerformanceReport, BusinessMetrics, BurndownData, ProjectPredictions }
