import React, { memo, useMemo, useCallback } from 'react'
import { CentralizedProject } from '../utils/centralizedDb'
import { ProgressCalculationService } from '../utils/progressCalculationService'
import { useUsers } from '../contexts/UsersContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Progress } from '../ui/progress'
import { 
  Eye, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  MessageCircle
} from 'lucide-react'
import { 
  calculateTotalInvolvement, 
  getStatusColor, 
  getPriorityColor,
  formatBudget,
  formatDate,
  formatRelativeTime,
  getProjectHealth,
  getProjectRisk
} from '../utils/projectHelpers'

interface ProjectCardProps {
  project: CentralizedProject
  onViewDetails: (projectId: string) => void
}

// Memoized helper functions
const getHealthColor = (health: string) => {
  switch (health) {
    case 'critical': return 'text-red-600 dark:text-red-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'healthy': return 'text-green-600 dark:text-green-400'
    default: return 'text-muted-foreground'
  }
}

const getHealthIcon = (health: string) => {
  switch (health) {
    case 'critical': return <AlertTriangle className="h-4 w-4" />
    case 'warning': return <TrendingUp className="h-4 w-4" />
    case 'healthy': return <TrendingUp className="h-4 w-4" />
    default: return <MessageCircle className="h-4 w-4" />
  }
}

// Optimized ProjectCard with comprehensive memoization
export const ProjectCard = memo(function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  const { getUserById } = useUsers()
  
  // Memoize expensive calculations
  const projectMetrics = useMemo(() => {
    const progressData = ProgressCalculationService.calculateProjectProgress(project)
    const progress = progressData.finalProgress
    const assignedCount = project.assignedEmployees.length
    const totalInvolvement = calculateTotalInvolvement(project)
    const health = getProjectHealth(project)
    const risks = getProjectRisk(project)
    
    return {
      progress,
      assignedCount,
      totalInvolvement,
      health,
      risks
    }
  }, [project])

  // Memoize user initials calculation
  const getUserInitials = useCallback((employeeId: string): string => {
    const apiUser = getUserById(employeeId)
    if (apiUser?.name) {
      return apiUser.name.charAt(0).toUpperCase()
    }
    
    const centralizedUser = project.assignedEmployees.find(emp => emp.employeeId === employeeId)
    if (centralizedUser?.name) {
      return centralizedUser.name.charAt(0).toUpperCase()
    }
    
    return '?'
  }, [getUserById, project.assignedEmployees])

  // Memoize risk indicators
  const riskIndicators = useMemo(() => {
    const indicators = []
    if (projectMetrics.health === 'critical') indicators.push('Critical')
    if (projectMetrics.totalInvolvement > 150) indicators.push('Over-allocated')
    if (projectMetrics.progress < 20 && new Date(project.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      indicators.push('Behind Schedule')
    }
    return indicators
  }, [projectMetrics, project.endDate])

  // Memoize formatted values
  const formattedValues = useMemo(() => ({
    endDate: formatDate(project.endDate),
    relativeTime: formatRelativeTime(project.endDate),
    budget: formatBudget(project.budget),
    statusColor: getStatusColor(project.status),
    priorityColor: getPriorityColor(project.priority),
    healthColor: getHealthColor(projectMetrics.health),
    healthIcon: getHealthIcon(projectMetrics.health)
  }), [project.endDate, project.budget, project.status, project.priority, projectMetrics.health])

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {project.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={formattedValues.statusColor}>
              {project.status}
            </Badge>
            <Badge variant="outline" className={formattedValues.priorityColor}>
              {project.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{projectMetrics.progress}%</span>
          </div>
          <Progress value={projectMetrics.progress} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{projectMetrics.assignedCount} assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formattedValues.endDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formattedValues.relativeTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formattedValues.budget}</span>
          </div>
        </div>

        {/* Health Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={formattedValues.healthColor}>
              {formattedValues.healthIcon}
            </div>
            <span className="text-sm font-medium capitalize">
              {projectMetrics.health} Health
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {projectMetrics.totalInvolvement}% involvement
          </div>
        </div>

        {/* Risk Indicators */}
        {riskIndicators.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {riskIndicators.map((risk, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {risk}
              </Badge>
            ))}
          </div>
        )}

        {/* Team Avatars */}
        {project.assignedEmployees.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Team:</span>
            <div className="flex -space-x-2">
              {project.assignedEmployees.slice(0, 4).map((employee) => (
                <Avatar key={employee.employeeId} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(employee.employeeId)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.assignedEmployees.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{project.assignedEmployees.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewDetails(project.id)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.progress === nextProps.project.progress &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.assignedEmployees.length === nextProps.project.assignedEmployees.length
  )
})