// Unified Progress Calculation Service
// Fixes milestone vs manual progress conflicts and provides single source of truth

import { CentralizedProject } from './centralizedDb'

export interface ProgressData {
  calculatedProgress: number
  manualProgress: number | null
  milestoneProgress: number
  finalProgress: number
  progressSource: 'manual' | 'milestone' | 'default'
  lastUpdated: string
  isValid: boolean
  warnings: string[]
}

export interface WorkloadData {
  projectWorkload: number
  initiativeWorkload: number
  totalWorkload: number
  availableCapacity: number
  overBeyondAvailable: number
  workloadCap: number
  overBeyondCap: number
  isOverloaded: boolean
  warnings: string[]
}

export class ProgressCalculationService {
  /**
   * Calculate project progress with unified logic
   * Priority: Manual progress > Milestone progress > Default progress
   */
  static calculateProjectProgress(project: CentralizedProject): ProgressData {
    const warnings: string[] = []
    
    // Calculate milestone-based progress
    const milestoneProgress = this.calculateMilestoneProgress(project)
    
    // Get manual progress (if set)
    const manualProgress = project.manualProgress !== undefined ? project.manualProgress : null
    
    // Debug logging for troubleshooting
    console.log(`[ProgressCalculation] Project: ${project.name}`, {
      milestones: project.milestones?.length || 0,
      milestoneProgress,
      manualProgress,
      defaultProgress: project.progress,
      assignedEmployees: project.assignedEmployees?.length || 0
    })
    
    // Determine final progress and source
    let finalProgress: number = 0
    let progressSource: 'manual' | 'milestone' | 'default'
    
    if (manualProgress !== null && manualProgress !== undefined) {
      finalProgress = manualProgress
      progressSource = 'manual'
      
      // Check for significant deviation from milestone progress
      if (Math.abs(manualProgress - milestoneProgress) > 10) {
        warnings.push(`Manual progress (${manualProgress}%) differs significantly from milestone progress (${milestoneProgress.toFixed(1)}%)`)
      }
    } else if (project.milestones && project.milestones.length > 0) {
      finalProgress = milestoneProgress
      progressSource = 'milestone'
    } else {
      // Use project.progress if it exists and is valid, otherwise calculate a default
      if (project.progress !== null && project.progress !== undefined && project.progress >= 0) {
        finalProgress = project.progress
        progressSource = 'default'
      } else {
        // Calculate default progress based on project age and status
        finalProgress = this.calculateDefaultProgress(project)
        progressSource = 'default'
      }
    }
    
    // Ensure progress is a valid number
    if (isNaN(finalProgress) || !isFinite(finalProgress)) {
      finalProgress = 0
      warnings.push('Progress value was invalid, reset to 0%')
    }
    
    // Validate progress range
    if (finalProgress < 0 || finalProgress > 100) {
      finalProgress = Math.max(0, Math.min(100, finalProgress))
      warnings.push(`Progress value was outside valid range, clamped to ${finalProgress}%`)
    }
    
    console.log(`[ProgressCalculation] Final result for ${project.name}:`, {
      finalProgress,
      progressSource,
      warnings: warnings.length
    })
    
    return {
      calculatedProgress: finalProgress,
      manualProgress,
      milestoneProgress,
      finalProgress,
      progressSource,
      lastUpdated: project.lastActivity || project.updatedAt || project.createdAt,
      isValid: warnings.length === 0,
      warnings
    }
  }
  
  /**
   * Calculate progress based on completed milestones
   */
  private static calculateMilestoneProgress(project: CentralizedProject): number {
    if (!project.milestones || project.milestones.length === 0) {
      return 0
    }
    
    const completedMilestones = project.milestones.filter(m => m.completed).length
    return (completedMilestones / project.milestones.length) * 100
  }

  /**
   * Calculate default progress based on project age and status
   */
  private static calculateDefaultProgress(project: CentralizedProject): number {
    const now = new Date()
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    
    // If project hasn't started yet
    if (now < startDate) {
      return 0
    }
    
    // If project is completed
    if (project.status === 'completed' || project.status === 'Completed') {
      return 100
    }
    
    // If project is cancelled
    if (project.status === 'cancelled' || project.status === 'Cancelled') {
      return 0
    }
    
    // Calculate progress based on time elapsed
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedTime = now.getTime() - startDate.getTime()
    
    if (totalDuration <= 0) {
      return 0
    }
    
    const timeBasedProgress = Math.min(95, (elapsedTime / totalDuration) * 100)
    
    // Adjust based on project status
    let statusMultiplier = 1
    switch (project.status?.toLowerCase()) {
      case 'pending':
      case 'not started':
        statusMultiplier = 0.1
        break
      case 'in progress':
      case 'active':
        statusMultiplier = 0.8
        break
      case 'on hold':
        statusMultiplier = 0.3
        break
      default:
        statusMultiplier = 0.5
    }
    
    const finalProgress = Math.max(5, timeBasedProgress * statusMultiplier)
    
    console.log(`[ProgressCalculation] Default progress for ${project.name}:`, {
      timeBasedProgress,
      statusMultiplier,
      finalProgress,
      status: project.status
    })
    
    return Math.round(finalProgress)
  }
  
  /**
   * Calculate employee workload with unified logic
   */
  static calculateEmployeeWorkload(
    employeeId: string, 
    projects: CentralizedProject[], 
    initiatives: any[],
    employeeData: any
  ): WorkloadData {
    const warnings: string[] = []
    
    // Calculate project workload from active projects
    const projectWorkload = projects
      .filter(p => p.status === 'active' || p.status === 'ACTIVE')
      .reduce((total, project) => {
        const assignment = project.assignedEmployees?.find(emp => emp.employeeId === employeeId)
        return total + (assignment?.involvementPercentage || 0)
      }, 0)
    
    // Calculate initiative workload from active initiatives
    const initiativeWorkload = initiatives
      .filter(i => i.assignedTo === employeeId && i.status === 'active')
      .reduce((total, initiative) => total + (initiative.workloadPercentage || 0), 0)
    
    const totalWorkload = projectWorkload + initiativeWorkload
    
    // Get employee capacity limits
    const workloadCap = employeeData?.workloadCap || 100
    const overBeyondCap = employeeData?.overBeyondCap || 20
    
    // Calculate available capacity
    const availableCapacity = Math.max(0, workloadCap - projectWorkload)
    const overBeyondAvailable = Math.max(0, overBeyondCap - initiativeWorkload)
    
    // Check for overload warnings
    if (totalWorkload > workloadCap) {
      warnings.push(`Total workload (${totalWorkload.toFixed(1)}%) exceeds capacity (${workloadCap}%)`)
    }
    
    if (initiativeWorkload > overBeyondCap) {
      warnings.push(`Over & Beyond workload (${initiativeWorkload.toFixed(1)}%) exceeds capacity (${overBeyondCap}%)`)
    }
    
    return {
      projectWorkload,
      initiativeWorkload,
      totalWorkload,
      availableCapacity,
      overBeyondAvailable,
      workloadCap,
      overBeyondCap,
      isOverloaded: totalWorkload > workloadCap || initiativeWorkload > overBeyondCap,
      warnings
    }
  }
  
  /**
   * Validate progress consistency across project
   */
  static validateProgressConsistency(project: CentralizedProject): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check milestone vs progress consistency
    const progressData = this.calculateProjectProgress(project)
    
    if (!progressData.isValid) {
      issues.push(...progressData.warnings)
    }
    
    // Check total involvement percentage - Employee workload can be anything, but warn if extremely high
    const totalInvolvement = project.assignedEmployees?.reduce((sum, emp) => sum + emp.involvementPercentage, 0) || 0
    if (totalInvolvement > 500) { // Only warn for extremely high team involvement
      issues.push(`Total team involvement (${totalInvolvement}%) is extremely high`)
      recommendations.push('Consider if this level of team involvement is necessary')
    } else if (totalInvolvement > 200) {
      // Add as warning for high team involvement (but not blocking)
      issues.push(`Total team involvement (${totalInvolvement}%) is high`)
      recommendations.push('Monitor team workload distribution')
    }
    
    // Check for employees with excessive workload
    if (project.assignedEmployees) {
      for (const assignment of project.assignedEmployees) {
        if (assignment.involvementPercentage > 50) {
          issues.push(`Employee ${assignment.employeeId} has high involvement (${assignment.involvementPercentage}%)`)
          recommendations.push('Consider reducing involvement or adding more team members')
        }
      }
    }
    
    // Check milestone completion consistency
    if (project.milestones && project.milestones.length > 0) {
      const completedMilestones = project.milestones.filter(m => m.completed).length
      const totalMilestones = project.milestones.length
      
      if (completedMilestones === totalMilestones && progressData.finalProgress < 100) {
        issues.push('All milestones completed but project progress is not 100%')
        recommendations.push('Update project progress to 100% or mark project as completed')
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }
  
  /**
   * Force progress update for projects stuck at 0%
   * This bypasses validation for manual progress updates
   */
  static forceProgressUpdate(project: CentralizedProject, newProgress: number): {
    success: boolean
    message: string
    updatedProject: CentralizedProject
  } {
    // Basic validation only
    if (newProgress < 0 || newProgress > 100) {
      return {
        success: false,
        message: 'Progress must be between 0% and 100%',
        updatedProject: project
      }
    }

    // Create updated project with new progress
    const updatedProject = {
      ...project,
      progress: newProgress,
      manualProgress: newProgress, // Set as manual progress
      lastActivity: new Date().toISOString()
    }

    return {
      success: true,
      message: `Progress updated to ${newProgress}%`,
      updatedProject
    }
  }

  /**
   * Get progress color based on progress value
   */
  static getProgressColor(progress: number): string {
    if (progress >= 90) return 'text-green-600 dark:text-green-400'
    if (progress >= 70) return 'text-blue-600 dark:text-blue-400'
    if (progress >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  /**
   * Get workload color based on workload percentage
   */
  static getWorkloadColor(workload: number, capacity: number = 100): string {
    const percentage = (workload / capacity) * 100
    
    if (percentage <= 50) return 'text-green-600 dark:text-green-400'
    if (percentage <= 80) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage <= 100) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  /**
   * Format progress for display
   */
  static formatProgress(progress: number): string {
    return `${progress.toFixed(1)}%`
  }
  
  /**
   * Format workload for display
   */
  static formatWorkload(workload: number, capacity: number = 100): string {
    const percentage = (workload / capacity) * 100
    return `${workload.toFixed(1)}% (${percentage.toFixed(1)}% of capacity)`
  }
}

// Export utility functions for backward compatibility
export const calculateProjectProgress = ProgressCalculationService.calculateProjectProgress
export const calculateEmployeeWorkload = ProgressCalculationService.calculateEmployeeWorkload
export const validateProgressConsistency = ProgressCalculationService.validateProgressConsistency
export const getProgressColor = ProgressCalculationService.getProgressColor
export const getWorkloadColor = ProgressCalculationService.getWorkloadColor
export const formatProgress = ProgressCalculationService.formatProgress
export const formatWorkload = ProgressCalculationService.formatWorkload
