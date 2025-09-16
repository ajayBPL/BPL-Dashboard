import { db } from './database';
import { emailService } from './emailService';
import { User, Notification, Project, Initiative, Milestone } from '@prisma/client';
import { prisma } from '../index';

interface NotificationTrigger {
  type: 'deadline' | 'workload' | 'assignment' | 'milestone' | 'project_update';
  title: string;
  message: string;
  entityType?: 'project' | 'initiative' | 'milestone' | 'user';
  entityId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  userIds?: string[];
}

class NotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.startPeriodicChecks();
  }

  private startPeriodicChecks() {
    const interval = parseInt(process.env.NOTIFICATION_CHECK_INTERVAL || '300000'); // 5 minutes default
    
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) {
        this.isRunning = true;
        try {
          await this.checkOverdueMilestones();
          await this.checkWorkloadWarnings();
          await this.checkProjectUpdates();
        } catch (error) {
          console.error('Error in notification checks:', error);
        } finally {
          this.isRunning = false;
        }
      }
    }, interval);

    console.log(`🔔 Notification service started (checking every ${interval / 1000}s)`);
  }

  private async checkOverdueMilestones() {
    try {
      const now = new Date();
      // Use database service instead of direct Prisma calls
      const allProjects = await db.getAllProjects();
      const overdueMilestones: any[] = [];
      
      // Filter milestones from projects
      allProjects.forEach(project => {
        if (project.milestones) {
          project.milestones.forEach((milestone: any) => {
            if (!milestone.completed && new Date(milestone.dueDate) < now) {
              overdueMilestones.push({
                ...milestone,
                project: {
                  ...project,
                  manager: project.manager,
                  assignments: project.assignments || []
                }
              });
            }
          });
        }
      });

      for (const milestone of overdueMilestones) {
        const project = milestone.project;
        
        // Notify project manager
        if (project.manager) {
          await this.createAndSendNotification({
            type: 'deadline',
            title: 'Overdue Milestone',
            message: `Milestone "${milestone.title}" in project "${project.title}" is overdue. Due date was ${new Date(milestone.dueDate).toLocaleDateString()}.`,
            entityType: 'milestone',
            entityId: milestone.id,
            priority: 'high',
            actionUrl: `/projects/${project.id}`,
            userIds: [project.manager.id]
          });
        }

        // Notify assigned employees
        for (const assignment of project.assignments) {
          await this.createAndSendNotification({
            type: 'deadline',
            title: 'Overdue Milestone',
            message: `Milestone "${milestone.title}" in project "${project.title}" is overdue. Please update the status.`,
            entityType: 'milestone',
            entityId: milestone.id,
            priority: 'high',
            actionUrl: `/projects/${project.id}`,
            userIds: [assignment.employee.id]
          });
        }
      }
    } catch (error) {
      console.error('Error checking overdue milestones:', error);
    }
  }

  private async checkWorkloadWarnings() {
    try {
      // Use database service instead of direct Prisma calls
      const users = await db.getAllUsers();
      const allProjects = await db.getAllProjects();
      
      // Filter active users and enrich with project data
      const activeUsers = users.filter(user => user.isActive).map(user => ({
        ...user,
        assignments: allProjects
          .filter(project => project.assignments?.some((assignment: any) => assignment.employeeId === user.id))
          .map(project => ({
            project: {
              status: project.status,
              title: project.title
            },
            involvementPercentage: project.assignments?.find((assignment: any) => assignment.employeeId === user.id)?.involvementPercentage || 0
          })),
        assignedInitiatives: [] // Initiatives not implemented in mock database yet
      }));

      for (const user of activeUsers) {
        const activeProjectWorkload = user.assignments
          .filter(a => a.project.status === 'ACTIVE')
          .reduce((sum, a) => sum + a.involvementPercentage, 0);

        const overBeyondWorkload = 0; // Initiatives not implemented in mock database yet

        const totalWorkload = activeProjectWorkload + overBeyondWorkload;

        // Check for overload warnings
        if (totalWorkload > user.workloadCap) {
          await this.createAndSendNotification({
            type: 'workload',
            title: 'Workload Overload Warning',
            message: `Your current workload (${totalWorkload.toFixed(1)}%) exceeds your capacity (${user.workloadCap}%). Please review your assignments.`,
            entityType: 'user',
            entityId: user.id,
            priority: 'high',
            actionUrl: `/profile`,
            userIds: [user.id]
          });
        }

        // Check for over & beyond limit
        if (overBeyondWorkload > user.overBeyondCap) {
          await this.createAndSendNotification({
            type: 'workload',
            title: 'Over & Beyond Limit Exceeded',
            message: `Your Over & Beyond workload (${overBeyondWorkload.toFixed(1)}%) exceeds the limit (${user.overBeyondCap}%).`,
            entityType: 'user',
            entityId: user.id,
            priority: 'medium',
            actionUrl: `/profile`,
            userIds: [user.id]
          });
        }
      }
    } catch (error) {
      console.error('Error checking workload warnings:', error);
    }
  }

  private async checkProjectUpdates() {
    try {
      // Use database service instead of direct Prisma calls
      const allProjects = await db.getAllProjects();
      
      // Check for projects without team members
      const projectsWithoutTeam = allProjects.filter(project => 
        project.status === 'ACTIVE' && 
        (!project.assignments || project.assignments.length === 0)
      );

      for (const project of projectsWithoutTeam) {
        if (project.manager) {
          await this.createAndSendNotification({
            type: 'project_update',
            title: 'Project Needs Team Members',
            message: `Project "${project.title}" is active but has no team members assigned. Please assign team members.`,
            entityType: 'project',
            entityId: project.id,
            priority: 'medium',
            actionUrl: `/projects/${project.id}`,
            userIds: [project.manager.id]
          });
        }
      }
    } catch (error) {
      console.error('Error checking project updates:', error);
    }
  }

  async createAndSendNotification(trigger: NotificationTrigger) {
    try {
      // Create notification in database
      const notificationData = {
        userId: trigger.userIds?.[0] || '',
        type: trigger.type.toUpperCase() as any,
        title: trigger.title,
        message: trigger.message,
        entityType: trigger.entityType?.toUpperCase() as any,
        entityId: trigger.entityId,
        priority: trigger.priority.toUpperCase() as any,
        actionUrl: trigger.actionUrl
      };

      const notification = await db.createNotification(notificationData);

      // Send email notifications
      if (trigger.userIds && trigger.userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: trigger.userIds } }
        });

        for (const user of users) {
          await emailService.sendNotification(user, {
            type: trigger.type,
            title: trigger.title,
            message: trigger.message,
            entityType: trigger.entityType,
            entityId: trigger.entityId,
            priority: trigger.priority,
            actionUrl: trigger.actionUrl
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating and sending notification:', error);
      throw error;
    }
  }

  async sendProjectAssignmentNotification(projectId: string, employeeId: string, managerId: string) {
    try {
      const [project, employee, manager] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.user.findUnique({ where: { id: employeeId } }),
        prisma.user.findUnique({ where: { id: managerId } })
      ]);

      if (project && employee && manager) {
        await this.createAndSendNotification({
          type: 'assignment',
          title: 'New Project Assignment',
          message: `You have been assigned to project "${project.title}" by ${manager.name}.`,
          entityType: 'project',
          entityId: projectId,
          priority: 'medium',
          actionUrl: `/projects/${projectId}`,
          userIds: [employeeId]
        });
      }
    } catch (error) {
      console.error('Error sending project assignment notification:', error);
    }
  }

  async sendInitiativeAssignmentNotification(initiativeId: string, employeeId: string, creatorId: string) {
    try {
      const [initiative, employee, creator] = await Promise.all([
        prisma.initiative.findUnique({ where: { id: initiativeId } }),
        prisma.user.findUnique({ where: { id: employeeId } }),
        prisma.user.findUnique({ where: { id: creatorId } })
      ]);

      if (initiative && employee && creator) {
        await this.createAndSendNotification({
          type: 'assignment',
          title: 'New Over & Beyond Initiative',
          message: `You have been assigned to Over & Beyond initiative "${initiative.title}" by ${creator.name}.`,
          entityType: 'initiative',
          entityId: initiativeId,
          priority: 'medium',
          actionUrl: `/initiatives/${initiativeId}`,
          userIds: [employeeId]
        });
      }
    } catch (error) {
      console.error('Error sending initiative assignment notification:', error);
    }
  }

  // Manual notification sending
  async sendManualNotification(userIds: string[], title: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    return await this.createAndSendNotification({
      type: 'project_update',
      title,
      message,
      priority,
      userIds
    });
  }

  // Test email functionality
  async sendTestEmail(userId: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        return await emailService.sendTestEmail(user);
      }
      return false;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔔 Notification service stopped');
    }
  }
}

export const notificationService = new NotificationService();
