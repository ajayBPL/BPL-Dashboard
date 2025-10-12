// Centralized Workload Calculation Service for Backend
// Provides single source of truth for employee workload calculations

import { PrismaClient } from '@prisma/client'

export interface WorkloadCalculationResult {
  employeeId: string
  projectWorkload: number
  initiativeWorkload: number
  totalWorkload: number
  availableCapacity: number
  overBeyondAvailable: number
  workloadCap: number
  overBeyondCap: number
  isOverloaded: boolean
  warnings: string[]
  lastCalculated: Date
}

export class WorkloadCalculationService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Calculate comprehensive workload for a specific employee
   */
  async calculateEmployeeWorkload(employeeId: string): Promise<WorkloadCalculationResult> {
    const warnings: string[] = []

    try {
      // Get employee data
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found`)
      }

      // Get all active project assignments
      const projectAssignments = await this.prisma.projectAssignment.findMany({
        where: { 
          employeeId: employeeId,
          project: {
            status: 'ACTIVE'
          }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      })

      // Calculate project workload
      const projectWorkload = projectAssignments.reduce((total, assignment) => {
        return total + assignment.involvementPercentage
      }, 0)

      // Get all active initiatives assigned to employee
      const initiatives = await this.prisma.initiative.findMany({
        where: {
          assignedTo: employeeId,
          status: 'ACTIVE'
        }
      })

      // Calculate initiative workload
      const initiativeWorkload = initiatives.reduce((total, initiative) => {
        return total + initiative.workloadPercentage
      }, 0)

      const totalWorkload = projectWorkload + initiativeWorkload

      // Get employee capacity limits
      const workloadCap = employee.workloadCap || 100
      const overBeyondCap = employee.overBeyondCap || 20

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

      // Check for high individual project involvement
      projectAssignments.forEach(assignment => {
        if (assignment.involvementPercentage > 50) {
          warnings.push(`High involvement (${assignment.involvementPercentage}%) in project: ${assignment.project.title}`)
        }
      })

      return {
        employeeId,
        projectWorkload,
        initiativeWorkload,
        totalWorkload,
        availableCapacity,
        overBeyondAvailable,
        workloadCap,
        overBeyondCap,
        isOverloaded: totalWorkload > workloadCap || initiativeWorkload > overBeyondCap,
        warnings,
        lastCalculated: new Date()
      }

    } catch (error) {
      console.error(`Error calculating workload for employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Calculate workload for multiple employees
   */
  async calculateMultipleEmployeeWorkloads(employeeIds: string[]): Promise<WorkloadCalculationResult[]> {
    const results: WorkloadCalculationResult[] = []

    for (const employeeId of employeeIds) {
      try {
        const workload = await this.calculateEmployeeWorkload(employeeId)
        results.push(workload)
      } catch (error) {
        console.error(`Failed to calculate workload for employee ${employeeId}:`, error)
        // Add error result
        results.push({
          employeeId,
          projectWorkload: 0,
          initiativeWorkload: 0,
          totalWorkload: 0,
          availableCapacity: 0,
          overBeyondAvailable: 0,
          workloadCap: 100,
          overBeyondCap: 20,
          isOverloaded: false,
          warnings: [`Failed to calculate workload: ${error instanceof Error ? error.message : 'Unknown error'}`],
          lastCalculated: new Date()
        })
      }
    }

    return results
  }

  /**
   * Validate if an employee can be assigned to a project with given involvement
   */
  async validateAssignmentCapacity(
    employeeId: string, 
    newInvolvementPercentage: number,
    excludeProjectId?: string
  ): Promise<{
    canAssign: boolean
    currentWorkload: number
    newTotalWorkload: number
    availableCapacity: number
    warnings: string[]
  }> {
    const warnings: string[] = []

    try {
      // Get current workload excluding the project being modified
      const projectAssignments = await this.prisma.projectAssignment.findMany({
        where: { 
          employeeId: employeeId,
          project: {
            status: 'ACTIVE'
          },
          ...(excludeProjectId && { projectId: { not: excludeProjectId } })
        }
      })

      const currentProjectWorkload = projectAssignments.reduce((total, assignment) => {
        return total + assignment.involvementPercentage
      }, 0)

      const newTotalProjectWorkload = currentProjectWorkload + newInvolvementPercentage

      // Get employee capacity
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeId },
        select: { workloadCap: true }
      })

      const workloadCap = employee?.workloadCap || 100
      const availableCapacity = workloadCap - currentProjectWorkload

      // Check if assignment is possible
      const canAssign = newTotalProjectWorkload <= workloadCap

      if (!canAssign) {
        warnings.push(`Assignment would exceed capacity: ${newTotalProjectWorkload.toFixed(1)}% > ${workloadCap}%`)
      }

      if (newInvolvementPercentage > 50) {
        warnings.push(`High involvement percentage: ${newInvolvementPercentage}%`)
      }

      return {
        canAssign,
        currentWorkload: currentProjectWorkload,
        newTotalWorkload: newTotalProjectWorkload,
        availableCapacity,
        warnings
      }

    } catch (error) {
      console.error(`Error validating assignment capacity for employee ${employeeId}:`, error)
      return {
        canAssign: false,
        currentWorkload: 0,
        newTotalWorkload: newInvolvementPercentage,
        availableCapacity: 0,
        warnings: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Get workload summary for all employees
   */
  async getWorkloadSummary(): Promise<{
    totalEmployees: number
    overloadedEmployees: number
    averageWorkload: number
    totalProjectWorkload: number
    totalInitiativeWorkload: number
    capacityUtilization: number
  }> {
    try {
      // Get all employees
      const employees = await this.prisma.user.findMany({
        where: {
          role: {
            in: ['EMPLOYEE', 'MANAGER', 'RD_MANAGER']
          }
        }
      })

      const employeeIds = employees.map(emp => emp.id)
      const workloads = await this.calculateMultipleEmployeeWorkloads(employeeIds)

      const totalEmployees = workloads.length
      const overloadedEmployees = workloads.filter(w => w.isOverloaded).length
      const averageWorkload = workloads.reduce((sum, w) => sum + w.totalWorkload, 0) / totalEmployees
      const totalProjectWorkload = workloads.reduce((sum, w) => sum + w.projectWorkload, 0)
      const totalInitiativeWorkload = workloads.reduce((sum, w) => sum + w.initiativeWorkload, 0)
      const totalCapacity = workloads.reduce((sum, w) => sum + w.workloadCap, 0)
      const capacityUtilization = totalCapacity > 0 ? (totalProjectWorkload / totalCapacity) * 100 : 0

      return {
        totalEmployees,
        overloadedEmployees,
        averageWorkload,
        totalProjectWorkload,
        totalInitiativeWorkload,
        capacityUtilization
      }

    } catch (error) {
      console.error('Error getting workload summary:', error)
      throw error
    }
  }
}

// Export singleton instance
export const workloadCalculationService = new WorkloadCalculationService(new PrismaClient())
