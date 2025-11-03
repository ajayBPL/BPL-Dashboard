import { PrismaClient } from '@prisma/client';

// Database service using Prisma ORM with Supabase PostgreSQL
class DatabaseService {
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  // Test database connection with retries and detailed error handling
  async testConnection(retries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Set connection timeout (increased to 10 seconds for VM environments)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
        });
        
        // First, disconnect if already connected (clean state)
        try {
          await this.prisma.$disconnect();
        } catch {}
        
        await Promise.race([
          this.prisma.$connect(),
          timeoutPromise
        ]);
        
        await Promise.race([
          this.prisma.$queryRaw`SELECT 1 as test`,
          timeoutPromise
        ]);
        
        console.log('✅ Connected to Supabase PostgreSQL database');
        this.isConnected = true;
        return true;
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        
        // Provide detailed error diagnostics
        if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED')) {
          console.warn(`⏱️  Connection attempt ${attempt}/${retries} failed: Server unreachable or timeout`);
          if (attempt < retries) {
            console.warn(`   Retrying in ${attempt * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          } else {
            console.error('❌ Database connection failed: Network timeout or unreachable');
            console.error('💡 Possible causes:');
            console.error('   - Firewall blocking ports 5432 or 6543');
            console.error('   - VM network connectivity issues');
            console.error('   - Supabase project might be paused (check dashboard)');
          }
        } else if (errorMsg.includes('Tenant or user not found') || errorMsg.includes('password')) {
          console.error(`❌ Database connection failed (attempt ${attempt}/${retries}): Authentication error`);
          console.error(`   Error: ${errorMsg}`);
          console.error('💡 Possible causes:');
          console.error('   - Incorrect password in DATABASE_URL');
          console.error('   - Wrong project reference in connection string');
          console.error('   - Password needs URL encoding (special characters)');
          console.error('   - Check connection string format from Supabase dashboard');
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else if (errorMsg.includes('P1001') || errorMsg.includes("Can't reach database server")) {
          console.error(`❌ Database connection failed (attempt ${attempt}/${retries}): Cannot reach server`);
          console.error(`   Error: ${errorMsg}`);
          console.error('💡 Possible causes:');
          console.error('   - Supabase project is paused (resume in dashboard)');
          console.error('   - Network/firewall blocking connection');
          console.error('   - IP address might be banned (check Supabase dashboard → Database → Unban IP)');
          console.error('   - VM might not support IPv6 (Supabase uses IPv6)');
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
        } else {
          console.error(`❌ Database connection failed (attempt ${attempt}/${retries}): ${errorMsg}`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Ensure we disconnect on error
        try {
          await this.prisma.$disconnect();
        } catch {}
        
        this.isConnected = false;
      }
    }
    
    return false;
  }

  // User operations
  async findUserByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error('Database error finding user by email:', error);
      throw new Error('Failed to find user by email');
    }
  }

  async findUserById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      console.error('Database error finding user by ID:', error);
      throw new Error('Failed to find user by ID');
    }
  }

  async findUserByEmployeeId(employeeId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { employeeId },
      });
      return user;
    } catch (error) {
      console.error('Database error finding user by employee ID:', error);
      throw new Error('Failed to find user by employee ID');
    }
  }

  async getCustomRoles() {
    try {
      // For now, return empty array since custom roles are handled by the enum in Prisma schema
      // This method exists for compatibility with the auth routes
      return [];
    } catch (error) {
      console.error('Database error getting custom roles:', error);
      return [];
    }
  }

  async createUser(data: any) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          name: data.name,
          employeeId: data.employeeId,
          role: data.role,
          designation: data.designation,
          managerId: data.managerId || null,
          department: data.department,
          skills: data.skills || [],
          phoneNumber: data.phoneNumber,
          isActive: data.isActive !== undefined ? data.isActive : true,
          workloadCap: data.workloadCap || 100,
          overBeyondCap: data.overBeyondCap || 120,
          preferredCurrency: data.preferredCurrency || 'USD',
          timezone: data.timezone || 'UTC',
          notificationSettings: data.notificationSettings || {},
        },
      });
      return user;
    } catch (error: any) {
      console.error('Database error creating user:', error);
      
      // Provide more specific error messages
      if (error.code === 'P2002') {
        // Unique constraint violation
        if (error.meta?.target?.includes('email')) {
          throw new Error('User with this email already exists');
        }
        if (error.meta?.target?.includes('employee_id')) {
          throw new Error('User with this employee ID already exists');
        }
        throw new Error('A user with this information already exists');
      }
      
      if (error.code === 'P2003') {
        throw new Error('Invalid reference: ' + (error.meta?.field_name || 'foreign key constraint failed'));
      }
      
      // Check for enum validation error (invalid role)
      if (error.message?.includes('Invalid enum value') || error.message?.includes('Unknown arg `role`')) {
        throw new Error(
          `Invalid role "${data.role}". Valid roles are: ADMIN, PROGRAM_MANAGER, RD_MANAGER, MANAGER, EMPLOYEE. ` +
          `Please ensure the role is one of these valid enum values.`
        );
      }
      
      // Generic error with more details
      throw new Error(`Failed to create user: ${error.message || 'Unknown database error'}`);
    }
  }

  async updateUser(id: string, data: any) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });
      return user;
    } catch (error) {
      console.error('Database error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Database error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers(filters: any = {}) {
    try {
      const where: any = {};
      
      if (filters.role) {
        where.role = filters.role;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { employeeId: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          employeeId: true,
          role: true,
          designation: true,
          managerId: true,
          isActive: true,
          workloadCap: true,
          overBeyondCap: true,
          preferredCurrency: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      console.error('Database error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  // Project operations
  async createProject(data: any) {
    try {
      const project = await this.prisma.project.create({
        data: {
          title: data.title || data.name, // Support both 'title' and 'name' fields
          description: data.description,
          managerId: data.managerId,
          status: (data.status || 'PENDING').toUpperCase(), // Convert to uppercase for enum
          priority: (data.priority || 'MEDIUM').toUpperCase(), // Convert to uppercase for enum
          estimatedHours: data.estimatedHours || 0,
          actualHours: data.actualHours || 0,
          budgetAmount: data.budgetAmount || null,
          budgetCurrency: data.budgetCurrency || 'USD',
          timeline: data.timeline || null,
          tags: data.tags || [],
        },
      });
      return project;
    } catch (error) {
      console.error('Database error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  async getProjectById(id: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            },
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  employeeId: true,
                  role: true,
                },
              },
            },
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return project;
    } catch (error) {
      console.error('Database error getting project:', error);
      throw new Error('Failed to get project');
    }
  }

  async getAllProjects(filters: any = {}) {
    try {
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.priority) {
        where.priority = filters.priority;
      }
      
      if (filters.managerId) {
        where.managerId = filters.managerId;
      }
      
      if (filters.department) {
        where.department = filters.department;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const projects = await this.prisma.project.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              milestones: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return projects;
    } catch (error) {
      console.error('Database error getting projects:', error);
      throw new Error('Failed to get projects');
    }
  }

  async updateProject(id: string, data: any) {
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data,
      });
      return project;
    } catch (error) {
      console.error('Database error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  async deleteProject(id: string) {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Database error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  // Project Assignment operations
  async assignEmployeeToProject(projectId: string, assignmentData: any, managerId: string) {
    try {
      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if employee exists
      const employee = await this.prisma.user.findUnique({
        where: { id: assignmentData.employeeId },
      });
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if already assigned
      const existingAssignment = await this.prisma.projectAssignment.findUnique({
        where: {
          projectId_employeeId: {
            projectId: projectId,
            employeeId: assignmentData.employeeId,
          },
        },
      });
      if (existingAssignment) {
        throw new Error('Employee is already assigned to this project');
      }

      // Check workload capacity
      const currentAssignments = await this.prisma.projectAssignment.findMany({
        where: { employeeId: assignmentData.employeeId },
        include: {
          project: {
            select: { status: true },
          },
        },
      });

      const currentWorkload = currentAssignments
        .filter((a: any) => a.project.status === 'ACTIVE')
        .reduce((sum: number, a: any) => sum + a.involvementPercentage, 0);

      if (currentWorkload + assignmentData.involvementPercentage > employee.workloadCap) {
        throw new Error('Assignment would exceed employee workload capacity');
      }

      // Create assignment
      const assignment = await this.prisma.projectAssignment.create({
        data: {
          projectId: projectId,
          employeeId: assignmentData.employeeId,
          involvementPercentage: assignmentData.involvementPercentage || 100,
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            },
          },
        },
      });

      return assignment;
    } catch (error) {
      console.error('Database error assigning employee to project:', error);
      throw error;
    }
  }

  // Unassign employee from project
  async unassignEmployeeFromProject(projectId: string, employeeId: string) {
    try {
      await this.prisma.projectAssignment.delete({
        where: {
          projectId_employeeId: {
            projectId,
            employeeId,
          },
        },
      });
      return { projectId, employeeId };
    } catch (error) {
      console.error('Database error unassigning employee:', error);
      throw new Error('Failed to unassign employee from project');
    }
  }

  // Create milestone
  async createMilestone(data: any) {
    try {
      const milestone = await this.prisma.milestone.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          description: data.description || '',
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        },
      });
      return milestone;
    } catch (error) {
      console.error('Database error creating milestone:', error);
      throw new Error('Failed to create milestone');
    }
  }

  // Create comment
  async createComment(data: any) {
    try {
      const comment = await this.prisma.comment.create({
        data: {
          content: data.content,
          userId: data.userId,
          projectId: data.projectId || null,
          initiativeId: data.initiativeId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return comment;
    } catch (error) {
      console.error('Database error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  // Initiative operations
  async createInitiative(data: any) {
    try {
      const initiative = await this.prisma.initiative.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category || null,
          assignedTo: data.assignedTo,
          createdBy: data.createdBy,
          status: (data.status || 'PENDING').toUpperCase(), // Convert to uppercase for enum
          priority: (data.priority || 'MEDIUM').toUpperCase(), // Convert to uppercase for enum
          estimatedHours: data.estimatedHours || 0,
          actualHours: data.actualHours || 0,
          workloadPercentage: data.workloadPercentage || 0,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      });
      return initiative;
    } catch (error) {
      console.error('Database error creating initiative:', error);
      throw new Error('Failed to create initiative');
    }
  }

  async getInitiativeById(id: string) {
    try {
      const initiative = await this.prisma.initiative.findUnique({
        where: { id },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return initiative;
    } catch (error) {
      console.error('Database error getting initiative:', error);
      throw new Error('Failed to get initiative');
    }
  }

  async getAllInitiatives(filters: any = {}) {
    try {
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }

      const initiatives = await this.prisma.initiative.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return initiatives;
    } catch (error) {
      console.error('Database error getting initiatives:', error);
      throw new Error('Failed to get initiatives');
    }
  }

  async updateInitiative(id: string, data: any) {
    try {
      const initiative = await this.prisma.initiative.update({
        where: { id },
        data,
      });
      return initiative;
    } catch (error) {
      console.error('Database error updating initiative:', error);
      throw new Error('Failed to update initiative');
    }
  }

  async deleteInitiative(id: string) {
    try {
      await this.prisma.initiative.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Database error deleting initiative:', error);
      throw new Error('Failed to delete initiative');
    }
  }

  // Notification operations
  async createNotification(data: any) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
          read: false,
        },
      });
      return notification;
    } catch (error) {
      console.error('Database error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getNotificationsByUserId(userId: string, filters: any = {}) {
    try {
      const where: any = { userId };
      
      if (filters.read !== undefined) {
        where.read = filters.read;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
      });

      return notifications;
    } catch (error) {
      console.error('Database error getting notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  async markNotificationAsRead(id: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return notification;
    } catch (error) {
      console.error('Database error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
        await this.prisma.notification.updateMany({
          where: { userId, read: false },
          data: { read: true },
        });
      return true;
    } catch (error) {
      console.error('Database error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Activity Log operations
  async createActivityLog(data: any) {
    try {
      const log = await this.prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          details: data.details || null,
        },
      });
      return log;
    } catch (error) {
      console.error('Database error creating activity log:', error);
      throw new Error('Failed to create activity log');
    }
  }

  async getActivityLogs(filters: any = {}) {
    try {
      const where: any = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.entityType) {
        where.entityType = filters.entityType;
      }
      
      if (filters.entityId) {
        where.entityId = filters.entityId;
      }

      const logs = await this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
      });

      return logs;
    } catch (error) {
      console.error('Database error getting activity logs:', error);
      throw new Error('Failed to get activity logs');
    }
  }

  // Analytics placeholder methods
  async getProjectAnalytics(options: any) {
      return {
      message: 'Project analytics placeholder',
    };
  }

  async getUserAnalytics(options: any) {
    return {
      message: 'User analytics placeholder',
    };
  }

  async getInitiativeAnalytics(options: any) {
      return {
      message: 'Initiative analytics placeholder',
    };
  }

  async getActivityAnalytics(options: any) {
    return {
      message: 'Activity analytics placeholder',
    };
  }

  // Disconnect
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const db = new DatabaseService();
export { DatabaseService };
