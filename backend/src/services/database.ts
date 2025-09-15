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
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$connect();
      await this.prisma.$disconnect();
      return true;
    } catch (error) {
      console.log('Database connection failed, falling back to mock data');
      this.useMock = true;
      return false;
    }
  }

  // User operations
  async findUserByEmail(email: string) {
    if (this.useMock) {
      return await fileBasedMockDb.findUserByEmail(email);
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
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
    
    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      };
    }
    return user;
  }

  async findUserById(id: string) {
    if (this.useMock) {
      return await fileBasedMockDb.findUserById(id);
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
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
    
    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      };
    }
    return user;
  }

  async createUser(userData: any) {
    if (this.useMock) {
      return await fileBasedMockDb.createUser(userData);
    }
    const user = await this.prisma.user.create({
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

  // Notification operations
  async createNotification(data: any) {
    if (this.useMock) {
      return await fileBasedMockDb.createNotification(data);
    }
    return await this.prisma.notification.create({ data });
  }
}

export const db = new DatabaseService();
