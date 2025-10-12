import { PrismaClient } from '@prisma/client';
import { mockDb } from './mockDb';
import { fileBasedMockDb } from './fileBasedMockDb';
import { WorkloadCalculationService } from './workloadCalculationService';

// Database service that can fallback to mock data
class DatabaseService {
  private prisma: PrismaClient;
  private useMock: boolean = false;
  private workloadService!: WorkloadCalculationService;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    this.workloadService = new WorkloadCalculationService(this.prisma);
    // Try real database connection first
    this.useMock = false;
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$connect();
      // Test with a simple query
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed, falling back to mock data');
      this.useMock = true;
      return false;
    }
  }

  // Check if we should use mock data
  private async checkConnection(): Promise<void> {
    if (!this.useMock) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        console.error('❌ Database connection failed, falling back to mock data');
        console.error('Database error details:', error);
        this.useMock = true;
        
        // Log warning about data persistence
        console.warn('⚠️  WARNING: Using mock database - data will not persist across restarts');
        console.warn('⚠️  WARNING: Multiple instances will have isolated data');
        console.warn('⚠️  Please configure PostgreSQL database for production use');
        
        // Store notification for frontend to display
        this.storeDatabaseFallbackNotification();
      }
    }
  }

  // Store database fallback notification for frontend
  private storeDatabaseFallbackNotification(): void {
    try {
      const notification = {
        id: `db-fallback-${Date.now()}`,
        type: 'system',
        title: 'Database Unavailable',
        message: '⚠️ Using temporary storage - data will not persist across restarts. Please configure PostgreSQL database.',
        priority: 'critical',
        read: false,
        createdAt: new Date().toISOString(),
        persistent: true // This notification should persist until database is restored
      };

      // Store in a file that frontend can read
      const fs = require('fs');
      const path = require('path');
      const notificationFile = path.join(__dirname, '../../data/database-notifications.json');
      
      let notifications = [];
      try {
        const existing = fs.readFileSync(notificationFile, 'utf8');
        notifications = JSON.parse(existing);
      } catch {
        // File doesn't exist, start fresh
      }

      // Remove any existing database fallback notifications
      notifications = notifications.filter((n: any) => !n.id.startsWith('db-fallback-'));
      
      // Add new notification
      notifications.unshift(notification);
      
      // Keep only the latest 10 notifications
      notifications = notifications.slice(0, 10);
      
      fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));
    } catch (error) {
      console.error('Failed to store database fallback notification:', error);
    }
  }

  // User operations
  async findUserByEmail(email: string) {
    await this.checkConnection();
    
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: {
          manager: true,
          subordinates: true,
        },
      });
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.findUserByEmail(email);
    }
  }

  async findUserById(id: string) {
    await this.checkConnection();
    
    if (this.useMock) {
      return await fileBasedMockDb.findUserById(id);
    }
    
    try {
      return await this.prisma.user.findUnique({ where: { id } });
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.findUserById(id);
    }
  }

  async findUserByEmployeeId(employeeId: string) {
    await this.checkConnection();
    
    if (this.useMock) {
      return await fileBasedMockDb.findUserByEmployeeId(employeeId);
    }
    
    try {
      return await this.prisma.user.findUnique({ where: { employeeId } });
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.findUserByEmployeeId(employeeId);
    }
  }

  async createUser(userData: any) {
    await this.checkConnection();
    
    if (this.useMock) {
      return await fileBasedMockDb.createUser(userData);
    }
    
    try {
      return await this.prisma.user.create({ data: userData });
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.createUser(userData);
    }
  }

  async updateUser(id: string, userData: any) {
    await this.checkConnection();
    
    if (this.useMock) {
      return await fileBasedMockDb.updateUser(id, userData);
    }
    
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
      });
      
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      };
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.updateUser(id, userData);
    }
  }

  async getAllUsers() {
    await this.checkConnection();
    
    if (this.useMock) {
      return await fileBasedMockDb.getAllUsers();
    }
    
    try {
      const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
      });
      
      return users.map((user: any) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      }));
    } catch (error) {
      console.log('Database error, falling back to mock data:', error);
      this.useMock = true;
      return await fileBasedMockDb.getAllUsers();
    }
  }

  // Initialize database connection
  async initialize() {
    await this.testConnection();
  }

  // Get Prisma client for direct access when needed
  getPrisma() {
    return this.prisma;
  }

  // Check if using mock data
  isUsingMock() {
    return this.useMock;
  }

  // Activity log operations
  async createActivityLog(data: any) {
    if (this.useMock) {
      return await fileBasedMockDb.createActivityLog(data);
    }
    return await this.prisma.activityLog.create({ data });
  }

  // Project operations
  async createProject(projectData: any) {
    if (this.useMock) {
      return await fileBasedMockDb.createProject(projectData);
    }
    const project = await this.prisma.project.create({
      data: projectData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async updateProject(projectId: string, updateData: any) {
    console.log('DatabaseService.updateProject called with:', { projectId, updateData, useMock: this.useMock });
    
    if (this.useMock) {
      console.log('Using mock database for updateProject');
      const result = await fileBasedMockDb.updateProject(projectId, updateData);
      console.log('Mock database updateProject result:', result);
      return result;
    }
    
    console.log('Using Prisma for updateProject');
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async getAllProjects() {
    if (this.useMock) {
      return await fileBasedMockDb.getAllProjects();
    }
    const projects = await this.prisma.project.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                designation: true
              }
            }
          }
        },
        milestones: {
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    return projects.map((project: any) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      assignments: project.assignments?.map((assignment: any) => ({
        ...assignment,
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        employee: assignment.employee
      })),
      milestones: project.milestones?.map((milestone: any) => ({
        ...milestone,
        dueDate: milestone.dueDate.toISOString(),
        completedAt: milestone.completedAt?.toISOString(),
        createdAt: milestone.createdAt.toISOString(),
        updatedAt: milestone.updatedAt.toISOString()
      }))
    }));
  }

  async getProjectById(id: string) {
    if (this.useMock) {
      const projects = await fileBasedMockDb.getAllProjects();
      return projects.find(project => project.id === id) || null;
    }
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true
          }
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                designation: true,
                avatar: true
              }
            }
          }
        },
        milestones: {
          orderBy: { dueDate: 'asc' }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!project) return null;
    
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      assignments: project.assignments?.map((assignment: any) => ({
        ...assignment,
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        employee: assignment.employee
      })),
      milestones: project.milestones?.map((milestone: any) => ({
        ...milestone,
        dueDate: milestone.dueDate.toISOString(),
        completedAt: milestone.completedAt?.toISOString(),
        createdAt: milestone.createdAt.toISOString(),
        updatedAt: milestone.updatedAt.toISOString()
      })),
      comments: project.comments?.map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      })),
      versions: project.versions?.map((version: any) => ({
        ...version,
        createdAt: version.createdAt.toISOString()
      }))
    };
  }

  async assignEmployeeToProject(projectId: string, assignmentData: any, managerId: string) {
    await this.checkConnection();
    if (this.useMock) {
      return await fileBasedMockDb.assignEmployeeToProject(projectId, assignmentData, managerId);
    }

    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if employee exists
    const employee = await this.prisma.user.findUnique({
      where: { id: assignmentData.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if already assigned
    const existingAssignment = await this.prisma.projectAssignment.findUnique({
      where: {
        projectId_employeeId: {
          projectId: projectId,
          employeeId: assignmentData.employeeId
        }
      }
    });

    if (existingAssignment) {
      throw new Error('Employee is already assigned to this project');
    }

    // ✅ CRITICAL FIX: Use unified workload validation
    const validation = await this.validateAssignmentCapacity(
      assignmentData.employeeId, 
      assignmentData.involvementPercentage
    );

    if (!validation.canAssign) {
      throw new Error(`Assignment would exceed employee's workload capacity. ${validation.warnings.join(', ')}`);
    }

    // Create assignment
    const assignment = await this.prisma.projectAssignment.create({
      data: {
        projectId: projectId,
        employeeId: assignmentData.employeeId,
        involvementPercentage: assignmentData.involvementPercentage,
        role: assignmentData.role
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            designation: true
          }
        }
      }
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: managerId,
        action: 'USER_ASSIGNED',
        entityType: 'PROJECT',
        entityId: projectId,
        projectId: projectId,
        details: `Assigned ${employee.name} to project with ${assignmentData.involvementPercentage}% involvement`
      }
    });

    return {
      ...assignment,
      assignedAt: assignment.assignedAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    };
  }

  async unassignEmployeeFromProject(projectId: string, employeeId: string, managerId: string) {
    if (this.useMock) {
      return await fileBasedMockDb.unassignEmployeeFromProject(projectId, employeeId, managerId);
    }

    // Check if assignment exists
    const assignment = await this.prisma.projectAssignment.findUnique({
      where: {
        projectId_employeeId: {
          projectId: projectId,
          employeeId: employeeId
        }
      },
      include: {
        employee: {
          select: { name: true }
        }
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Delete assignment
    await this.prisma.projectAssignment.delete({
      where: {
        projectId_employeeId: {
          projectId: projectId,
          employeeId: employeeId
        }
      }
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: managerId,
        action: 'USER_UNASSIGNED',
        entityType: 'PROJECT',
        entityId: projectId,
        projectId: projectId,
        details: `Unassigned ${assignment.employee.name} from project`
      }
    });

    return { success: true };
  }

  // Notification operations
  async createNotification(data: any) {
    if (this.useMock) {
      return await fileBasedMockDb.createNotification(data);
    }
    return await this.prisma.notification.create({ data });
  }

  // Custom roles operations
  async getCustomRoles() {
    if (this.useMock) {
      return await fileBasedMockDb.getCustomRoles();
    }
    // For real database, you would implement this
    return [];
  }

  // Initiative methods
  async getInitiatives(options: any) {
    if (this.useMock) {
      return { data: [], total: 0 };
    }
    return { data: [], total: 0 };
  }

  async createInitiative(data: any) {
    if (this.useMock) {
      return { id: `initiative-${Date.now()}`, ...data };
    }
    return { id: `initiative-${Date.now()}`, ...data };
  }

  async getInitiativeById(id: string) {
    if (this.useMock) {
      return null;
    }
    return null;
  }

  async updateInitiative(id: string, data: any) {
    if (this.useMock) {
      return { id, ...data };
    }
    return { id, ...data };
  }

  async deleteInitiative(id: string) {
    if (this.useMock) {
      return true;
    }
    return true;
  }

  async assignUsersToInitiative(initiativeId: string, userIds: string[]) {
    if (this.useMock) {
      return true;
    }
    return true;
  }

  async getInitiativeAssignments(initiativeId: string) {
    if (this.useMock) {
      return [];
    }
    return [];
  }

  async getInitiativeProjects(initiativeId: string) {
    if (this.useMock) {
      return [];
    }
    return [];
  }

  async getInitiativeActivityLogs(initiativeId: string) {
    if (this.useMock) {
      return [];
    }
    return [];
  }

  // Analytics methods
  async getProjectAnalytics(options: any) {
    if (this.useMock) {
      return { total: 0, completed: 0, active: 0, onHold: 0 };
    }
    return { total: 0, completed: 0, active: 0, onHold: 0 };
  }

  async getUserAnalytics(options: any) {
    if (this.useMock) {
      return { total: 0, active: 0, workload: [] };
    }
    return { total: 0, active: 0, workload: [] };
  }

  async getInitiativeAnalytics(options: any) {
    if (this.useMock) {
      return { total: 0, completed: 0, active: 0 };
    }
    return { total: 0, completed: 0, active: 0 };
  }

  async getActivityAnalytics(options: any) {
    if (this.useMock) {
      return { total: 0, recent: [] };
    }
    return { total: 0, recent: [] };
  }

  async getWorkloadAnalytics(options: any) {
    if (this.useMock) {
      return { total: 0, overloaded: 0, available: 0 };
    }
    return { total: 0, overloaded: 0, available: 0 };
  }

  async generateReport(options: any) {
    if (this.useMock) {
      return { type: options.type, data: [], generatedAt: new Date().toISOString() };
    }
    return { type: options.type, data: [], generatedAt: new Date().toISOString() };
  }

  // Notification methods
  async getUserNotifications(userId: string, options: any) {
    // Always include system notifications (like database fallback warnings)
    const systemNotifications = await this.getSystemNotifications();
    
    if (this.useMock) {
      // Mock notifications
      const mockNotifications = [
        {
          id: 'mock-1',
          type: 'project',
          title: 'Project Update',
          message: 'Your project "Website Redesign" has been updated',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'mock-2',
          type: 'deadline',
          title: 'Deadline Reminder',
          message: 'Task "User Research" is due tomorrow',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      const allNotifications = [...systemNotifications, ...mockNotifications];
      
      return {
        data: allNotifications,
        total: allNotifications.length,
        unreadCount: allNotifications.filter(n => !n.read).length
      };
    }
    
    try {
      // Try to get notifications from database
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
  
      const formattedNotifications = notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        persistent: notification.persistent || false
      }));
  
      const allNotifications = [...systemNotifications, ...formattedNotifications];
  
      return {
        data: allNotifications,
        total: allNotifications.length,
        unreadCount: allNotifications.filter(n => !n.read).length
      };
    } catch (error) {
      console.error('Database error, falling back to mock notifications:', error);
      this.useMock = true;
      
      // Return mock notifications with system notifications
      const mockNotifications = [
        {
          id: 'mock-1',
          type: 'project',
          title: 'Project Update',
          message: 'Your project "Website Redesign" has been updated',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'mock-2',
          type: 'deadline',
          title: 'Deadline Reminder',
          message: 'Task "User Research" is due tomorrow',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      const allNotifications = [...systemNotifications, ...mockNotifications];
      
      return {
        data: allNotifications,
        total: allNotifications.length,
        unreadCount: allNotifications.filter(n => !n.read).length
      };
    }
  }

  // ✅ NEW METHOD: Get employee workload using unified calculation service
  async getEmployeeWorkload(employeeId: string) {
    await this.checkConnection();
    
    if (this.useMock) {
      // Fallback to mock calculation for mock data
      return fileBasedMockDb.calculateEmployeeWorkload(employeeId);
    }
    
    try {
      return await this.workloadService.calculateEmployeeWorkload(employeeId);
    } catch (error) {
      console.error('Error calculating employee workload:', error);
      // Fallback to mock calculation
      return fileBasedMockDb.calculateEmployeeWorkload(employeeId);
    }
  }

  // ✅ NEW METHOD: Validate assignment capacity
  async validateAssignmentCapacity(employeeId: string, newInvolvementPercentage: number, excludeProjectId?: string) {
    await this.checkConnection();
    
    if (this.useMock) {
      // Simple validation for mock data
      return {
        canAssign: newInvolvementPercentage <= 100,
        currentWorkload: 0,
        newTotalWorkload: newInvolvementPercentage,
        availableCapacity: 100,
        warnings: []
      };
    }
    
    try {
      return await this.workloadService.validateAssignmentCapacity(employeeId, newInvolvementPercentage, excludeProjectId);
    } catch (error) {
      console.error('Error validating assignment capacity:', error);
      return {
        canAssign: false,
        currentWorkload: 0,
        newTotalWorkload: newInvolvementPercentage,
        availableCapacity: 0,
        warnings: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async getNotificationById(id: string) {
    if (this.useMock) {
      return null;
    }
    return null;
  }

  // Get system notifications (like database fallback warnings)
  private async getSystemNotifications(): Promise<any[]> {
    try {
      const fs = require('fs');
      const path = require('path');
      const notificationFile = path.join(__dirname, '../../data/database-notifications.json');
      
      if (fs.existsSync(notificationFile)) {
        const data = fs.readFileSync(notificationFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading system notifications:', error);
    }
    
    return [];
  }

  async markNotificationAsRead(id: string, userId: string) {
    if (this.useMock) {
      return true;
    }
    return true;
  }

  async markNotificationAsUnread(id: string, userId: string) {
    if (this.useMock) {
      return true;
    }
    return true;
  }

  async markAllNotificationsAsRead(userId: string) {
    if (this.useMock) {
      return 0;
    }
    return 0;
  }

  async deleteNotification(id: string) {
    if (this.useMock) {
      return true;
    }
    return true;
  }

  async getUserNotificationPreferences(userId: string) {
    if (this.useMock) {
      return { email: true, inApp: true, projectUpdates: true };
    }
    return { email: true, inApp: true, projectUpdates: true };
  }

  async updateUserNotificationPreferences(userId: string, preferences: any) {
    if (this.useMock) {
      return { ...preferences, updatedAt: new Date().toISOString() };
    }
    return { ...preferences, updatedAt: new Date().toISOString() };
  }
}

export const db = new DatabaseService();
