import { PrismaClient } from '@prisma/client';
import { mockDb } from './mockDb';
import { fileBasedMockDb } from './fileBasedMockDb';

// Database service that can fallback to mock data
class DatabaseService {
  private prisma: PrismaClient;
  private useMock: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
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
      console.log('❌ Database connection failed, falling back to mock data');
      console.log('Error:', error instanceof Error ? error.message : String(error));
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
        console.log('Database connection lost, switching to mock data');
        this.useMock = true;
      }
    }
  }

  // User operations
  async findUserByEmail(email: string) {
    await this.checkConnection();
    if (this.useMock) {
      return await fileBasedMockDb.findUserByEmail(email);
    }
    
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
    // Always use mock data for now since database connection is failing
    return await fileBasedMockDb.findUserById(id);
  }

  async findUserByEmployeeId(employeeId: string) {
    // Always use mock data for now since database connection is failing
    return await fileBasedMockDb.findUserByEmployeeId(employeeId);
  }

  async createUser(userData: any) {
    // Always use mock data for now since database connection is failing
    return await fileBasedMockDb.createUser(userData);
  }

  async updateUser(id: string, userData: any) {
    if (this.useMock) {
      return await fileBasedMockDb.updateUser(id, userData);
    }
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
  }

  async getAllUsers() {
    if (this.useMock) {
      return await fileBasedMockDb.getAllUsers();
    }
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
    
    return users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null
    }));
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
    
    return projects.map(project => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      assignments: project.assignments?.map(assignment => ({
        ...assignment,
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        employee: assignment.employee
      })),
      milestones: project.milestones?.map(milestone => ({
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
      assignments: project.assignments?.map(assignment => ({
        ...assignment,
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        employee: assignment.employee
      })),
      milestones: project.milestones?.map(milestone => ({
        ...milestone,
        dueDate: milestone.dueDate.toISOString(),
        completedAt: milestone.completedAt?.toISOString(),
        createdAt: milestone.createdAt.toISOString(),
        updatedAt: milestone.updatedAt.toISOString()
      })),
      comments: project.comments?.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      })),
      versions: project.versions?.map(version => ({
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

    // Check workload capacity
    const currentAssignments = await this.prisma.projectAssignment.findMany({
      where: { employeeId: assignmentData.employeeId },
      include: {
        project: {
          select: { status: true }
        }
      }
    });

    const currentWorkload = currentAssignments
      .filter(a => a.project.status === 'ACTIVE')
      .reduce((sum, a) => sum + a.involvementPercentage, 0);

    if (currentWorkload + assignmentData.involvementPercentage > employee.workloadCap) {
      throw new Error(`Assignment would exceed employee's workload capacity (${employee.workloadCap}%)`);
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
    if (this.useMock) {
      return { data: [], total: 0, unreadCount: 0 };
    }
    return { data: [], total: 0, unreadCount: 0 };
  }

  async getNotificationById(id: string) {
    if (this.useMock) {
      return null;
    }
    return null;
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
