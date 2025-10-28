// Centralized Workload Calculation Service for Backend
// Provides single source of truth for employee workload calculations

import { SupabaseClient } from '@supabase/supabase-js';

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
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate comprehensive workload for a specific employee
   */
  async calculateEmployeeWorkload(employeeId: string): Promise<WorkloadCalculationResult> {
    const warnings: string[] = [];

    try {
      // Get employee data
      const { data: employee, error: employeeError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;
      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      // Get all active project assignments
      const { data: projectAssignments, error: assignmentsError } = await this.supabase
        .from('projectAssignments')
        .select(`
          *,
          project:projects!projectAssignments_projectId_fkey(
            id,
            title,
            status
          )
        `)
        .eq('employeeId', employeeId)
        .eq('project.status', 'ACTIVE');

      if (assignmentsError) throw assignmentsError;

      // Calculate project workload
      const projectWorkload = (projectAssignments || []).reduce((total, assignment) => {
        return total + (assignment.involvementPercentage || 0);
      }, 0);

      // Get all active initiatives assigned to employee
      const { data: initiatives, error: initiativesError } = await this.supabase
        .from('initiatives')
        .select('*')
        .eq('assignedTo', employeeId)
        .eq('status', 'ACTIVE');

      if (initiativesError) throw initiativesError;

      // Calculate initiative workload
      const initiativeWorkload = (initiatives || []).reduce((total, initiative) => {
        return total + (initiative.workloadPercentage || 0);
      }, 0);

      const totalWorkload = projectWorkload + initiativeWorkload;

      // Get employee capacity limits
      const workloadCap = employee.workloadCap || 100;
      const overBeyondCap = employee.overBeyondCap || 20;

      // Calculate available capacity
      const availableCapacity = Math.max(0, workloadCap - projectWorkload);
      const overBeyondAvailable = Math.max(0, overBeyondCap - initiativeWorkload);

      // Check for overload warnings
      if (totalWorkload > workloadCap) {
        warnings.push(`Total workload (${totalWorkload.toFixed(1)}%) exceeds capacity (${workloadCap}%)`);
      }

      if (initiativeWorkload > overBeyondCap) {
        warnings.push(`Over & Beyond workload (${initiativeWorkload.toFixed(1)}%) exceeds capacity (${overBeyondCap}%)`);
      }

      // Check for high individual project involvement
      (projectAssignments || []).forEach(assignment => {
        if (assignment.involvementPercentage > 50) {
          warnings.push(`High involvement (${assignment.involvementPercentage}%) in project: ${assignment.project?.title || 'Unknown'}`);
        }
      });

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
      };

    } catch (error) {
      console.error(`Error calculating workload for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate workload for multiple employees
   */
  async calculateMultipleEmployeeWorkloads(employeeIds: string[]): Promise<WorkloadCalculationResult[]> {
    const results: WorkloadCalculationResult[] = [];

    for (const employeeId of employeeIds) {
      try {
        const workload = await this.calculateEmployeeWorkload(employeeId);
        results.push(workload);
      } catch (error) {
        console.error(`Failed to calculate workload for employee ${employeeId}:`, error);
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
        });
      }
    }

    return results;
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
    const warnings: string[] = [];

    try {
      // Get current workload excluding the project being modified
      let query = this.supabase
        .from('projectAssignments')
        .select('*')
        .eq('employeeId', employeeId);

      if (excludeProjectId) {
        query = query.neq('projectId', excludeProjectId);
      }

      const { data: projectAssignments, error: assignmentsError } = await query;

      if (assignmentsError) throw assignmentsError;

      const currentProjectWorkload = (projectAssignments || []).reduce((total, assignment) => {
        return total + (assignment.involvementPercentage || 0);
      }, 0);

      const newTotalProjectWorkload = currentProjectWorkload + newInvolvementPercentage;

      // Get employee capacity
      const { data: employee, error: employeeError } = await this.supabase
        .from('users')
        .select('workloadCap')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      const workloadCap = employee?.workloadCap || 100;
      const availableCapacity = workloadCap - currentProjectWorkload;

      // Check if assignment is possible
      const canAssign = newTotalProjectWorkload <= workloadCap;

      if (!canAssign) {
        warnings.push(`Assignment would exceed capacity: ${newTotalProjectWorkload.toFixed(1)}% > ${workloadCap}%`);
      }

      if (newInvolvementPercentage > 50) {
        warnings.push(`High involvement percentage: ${newInvolvementPercentage}%`);
      }

      return {
        canAssign,
        currentWorkload: currentProjectWorkload,
        newTotalWorkload: newTotalProjectWorkload,
        availableCapacity,
        warnings
      };

    } catch (error) {
      console.error(`Error validating assignment capacity for employee ${employeeId}:`, error);
      return {
        canAssign: false,
        currentWorkload: 0,
        newTotalWorkload: newInvolvementPercentage,
        availableCapacity: 0,
        warnings: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
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
      const { data: employees, error: employeesError } = await this.supabase
        .from('users')
        .select('id')
        .in('role', ['EMPLOYEE', 'MANAGER', 'RD_MANAGER']);

      if (employeesError) throw employeesError;

      const employeeIds = (employees || []).map(emp => emp.id);
      const workloads = await this.calculateMultipleEmployeeWorkloads(employeeIds);

      const totalEmployees = workloads.length;
      const overloadedEmployees = workloads.filter(w => w.isOverloaded).length;
      const averageWorkload = totalEmployees > 0 ? workloads.reduce((sum, w) => sum + w.totalWorkload, 0) / totalEmployees : 0;
      const totalProjectWorkload = workloads.reduce((sum, w) => sum + w.projectWorkload, 0);
      const totalInitiativeWorkload = workloads.reduce((sum, w) => sum + w.initiativeWorkload, 0);
      const totalCapacity = workloads.reduce((sum, w) => sum + w.workloadCap, 0);
      const capacityUtilization = totalCapacity > 0 ? (totalProjectWorkload / totalCapacity) * 100 : 0;

      return {
        totalEmployees,
        overloadedEmployees,
        averageWorkload,
        totalProjectWorkload,
        totalInitiativeWorkload,
        capacityUtilization
      };

    } catch (error) {
      console.error('Error getting workload summary:', error);
      throw error;
    }
  }
}

// Export singleton instance - will be initialized by the database service
export const workloadCalculationService = new WorkloadCalculationService(null as any);