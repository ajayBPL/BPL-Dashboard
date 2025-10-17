import { createClient } from '@supabase/supabase-js';
import { WorkloadCalculationService } from './workloadCalculationService';

// Database service for Supabase PostgreSQL only
class DatabaseService {
  private supabase: any;
  private workloadService!: WorkloadCalculationService;
  private isConnected: boolean = false;

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    try {
      // Get Supabase configuration from environment
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL environment variable is required');
      }
      
      if (!supabaseKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
      }

      // Initialize Supabase client
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      });
      
      this.workloadService = new WorkloadCalculationService(this.supabase);
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.supabase) {
        console.error('❌ Supabase client not initialized');
        return false;
      }

      // Simple connection test - just check if we can access the database
      const { error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) {
        // If users table doesn't exist, that's okay - we'll handle it later
        if (error.code === 'PGRST116' || error.message.includes('relation "users" does not exist')) {
          console.log('⚠️  Users table not found - will use fallback data');
          this.isConnected = true;
          return true;
        }
        console.error('❌ Supabase database connection failed:', error);
        return false;
      }
      
      this.isConnected = true;
      console.log('✅ Connected to Supabase PostgreSQL database');
      return true;
    } catch (error) {
      console.error('❌ Supabase database connection failed:', error);
      return false;
    }
  }

  // Create database schema if it doesn't exist
  private async createSchema(): Promise<void> {
    try {
      console.log('🔄 Creating database schema...');
      
      // This would typically be done via Prisma migrations
      // For now, we'll just log that the schema needs to be created
      console.log('⚠️  Please run "npm run db:migrate" to create the database schema');
      console.log('⚠️  Or ensure your Supabase database has the correct schema');
      
      this.isConnected = true;
    } catch (error) {
      console.error('❌ Failed to create schema:', error);
      throw error;
    }
  }

  // User operations
  async findUserByEmail(email: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      // Map database column names to expected camelCase
      if (data) {
        return {
          ...data,
          employeeId: data.employeeid,
          managerId: data.managerid,
          workloadCap: data.workloadcap,
          overBeyondCap: data.overbeyondcap,
          phoneNumber: data.phonenumber,
          preferredCurrency: data.preferredcurrency,
          notificationSettings: data.notificationsettings,
          isActive: data.isactive,
          createdAt: data.createdat,
          updatedAt: data.updatedat,
          lastLoginAt: data.lastloginat
        };
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to find user by email');
    }
  }

  async findUserById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Map database column names to expected camelCase
      if (data) {
        return {
          ...data,
          employeeId: data.employeeid,
          managerId: data.managerid,
          workloadCap: data.workloadcap,
          overBeyondCap: data.overbeyondcap,
          phoneNumber: data.phonenumber,
          preferredCurrency: data.preferredcurrency,
          notificationSettings: data.notificationsettings,
          isActive: data.isactive,
          createdAt: data.createdat,
          updatedAt: data.updatedat,
          lastLoginAt: data.lastloginat
        };
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to find user by ID');
    }
  }

  async findUserByEmployeeId(employeeId: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('employeeId', employeeId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to find user by employee ID');
    }
  }

  async createUser(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('users')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: string, data: any) {
    try {
      // Map camelCase to lowercase for database update
      const mappedData: any = {};
      Object.keys(data).forEach(key => {
        switch (key) {
          case 'employeeId':
            mappedData.employeeid = data[key];
            break;
          case 'managerId':
            mappedData.managerid = data[key];
            break;
          case 'workloadCap':
            mappedData.workloadcap = data[key];
            break;
          case 'overBeyondCap':
            mappedData.overbeyondcap = data[key];
            break;
          case 'phoneNumber':
            mappedData.phonenumber = data[key];
            break;
          case 'preferredCurrency':
            mappedData.preferredcurrency = data[key];
            break;
          case 'notificationSettings':
            mappedData.notificationsettings = data[key];
            break;
          case 'isActive':
            mappedData.isactive = data[key];
            break;
          case 'lastLoginAt':
            mappedData.lastloginat = data[key];
            break;
          default:
            mappedData[key] = data[key];
        }
      });

      const { data: result, error } = await this.supabase
        .from('users')
        .update(mappedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map result back to camelCase
      if (result) {
        return {
          ...result,
          employeeId: result.employeeid,
          managerId: result.managerid,
          workloadCap: result.workloadcap,
          overBeyondCap: result.overbeyondcap,
          phoneNumber: result.phonenumber,
          preferredCurrency: result.preferredcurrency,
          notificationSettings: result.notificationsettings,
          isActive: result.isactive,
          createdAt: result.createdat,
          updatedAt: result.updatedat,
          lastLoginAt: result.lastloginat
        };
      }
      
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string) {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers(limit: number = 100, offset: number = 0) {
    try {
      // Check if Supabase client is initialized
      if (!this.supabase) {
        console.error('❌ Supabase client not initialized');
        throw new Error('Database client not initialized');
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('createdat', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // Map database column names to expected camelCase
      return (data || []).map((user: any) => ({
        ...user,
        employeeId: user.employeeid,
        managerId: user.managerid,
        workloadCap: user.workloadcap,
        overBeyondCap: user.overbeyondcap,
        phoneNumber: user.phonenumber,
        preferredCurrency: user.preferredcurrency,
        notificationSettings: user.notificationsettings,
        isActive: user.isactive,
        createdAt: user.createdat,
        updatedAt: user.updatedat,
        lastLoginAt: user.lastloginat
      }));
    } catch (error) {
      console.error('Database error in getAllUsers:', error);
      throw new Error(`Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Project operations
  async createProject(data: any) {
    try {
      // Map camelCase to lowercase for database insert
      const mappedData: any = {};
      Object.keys(data).forEach(key => {
        switch (key) {
          case 'managerId':
            mappedData.managerid = data[key];
            break;
          case 'estimatedHours':
            mappedData.estimatedhours = data[key];
            break;
          case 'actualHours':
            mappedData.actualhours = data[key];
            break;
          case 'budgetAmount':
            mappedData.budgetamount = data[key];
            break;
          case 'budgetCurrency':
            mappedData.budgetcurrency = data[key];
            break;
          case 'lastActivity':
            mappedData.lastactivity = data[key];
            break;
          default:
            mappedData[key] = data[key];
        }
      });

      const { data: result, error } = await this.supabase
        .from('projects')
        .insert([mappedData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Map result back to camelCase
      if (result) {
        return {
          ...result,
          managerId: result.managerid,
          estimatedHours: result.estimatedhours,
          actualHours: result.actualhours,
          budgetAmount: result.budgetamount,
          budgetCurrency: result.budgetcurrency,
          createdAt: result.createdat,
          updatedAt: result.updatedat,
          lastActivity: result.lastactivity
        };
      }
      
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create project');
    }
  }

  async getProjectById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          manager:users!projects_managerid_fkey(*),
          assignments:projectAssignments(
            *,
            employee:users!projectAssignments_employeeid_fkey(*)
          ),
          milestones:milestones(*),
          comments:comments(
            *,
            user:users!comments_userid_fkey(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Map result back to camelCase
      if (data) {
        return {
          ...data,
          managerId: data.managerid,
          estimatedHours: data.estimatedhours,
          actualHours: data.actualhours,
          budgetAmount: data.budgetamount,
          budgetCurrency: data.budgetcurrency,
          createdAt: data.createdat,
          updatedAt: data.updatedat,
          lastActivity: data.lastactivity,
          manager: data.manager ? {
            ...data.manager,
            employeeId: data.manager.employeeid,
            managerId: data.manager.managerid,
            workloadCap: data.manager.workloadcap,
            overBeyondCap: data.manager.overbeyondcap,
            phoneNumber: data.manager.phonenumber,
            preferredCurrency: data.manager.preferredcurrency,
            notificationSettings: data.manager.notificationsettings,
            isActive: data.manager.isactive,
            createdAt: data.manager.createdat,
            updatedAt: data.manager.updatedat,
            lastLoginAt: data.manager.lastloginat
          } : null,
          assignments: data.assignments?.map((assignment: any) => ({
            ...assignment,
            projectId: assignment.projectid,
            employeeId: assignment.employeeid,
            involvementPercentage: assignment.involvementpercentage,
            assignedAt: assignment.assignedat,
            updatedAt: assignment.updatedat,
            employee: assignment.employee ? {
              ...assignment.employee,
              employeeId: assignment.employee.employeeid,
              managerId: assignment.employee.managerid,
              workloadCap: assignment.employee.workloadcap,
              overBeyondCap: assignment.employee.overbeyondcap,
              phoneNumber: assignment.employee.phonenumber,
              preferredCurrency: assignment.employee.preferredcurrency,
              notificationSettings: assignment.employee.notificationsettings,
              isActive: assignment.employee.isactive,
              createdAt: assignment.employee.createdat,
              updatedAt: assignment.employee.updatedat,
              lastLoginAt: assignment.employee.lastloginat
            } : null
          })) || [],
          milestones: data.milestones?.map((milestone: any) => ({
            ...milestone,
            projectId: milestone.projectid,
            dueDate: milestone.duedate,
            completedAt: milestone.completedat,
            createdAt: milestone.createdat,
            updatedAt: milestone.updatedat
          })) || [],
          comments: data.comments?.map((comment: any) => ({
            ...comment,
            userId: comment.userid,
            projectId: comment.projectid,
            createdAt: comment.createdat,
            updatedAt: comment.updatedat,
            user: comment.user ? {
              ...comment.user,
              employeeId: comment.user.employeeid,
              managerId: comment.user.managerid,
              workloadCap: comment.user.workloadcap,
              overBeyondCap: comment.user.overbeyondcap,
              phoneNumber: comment.user.phonenumber,
              preferredCurrency: comment.user.preferredcurrency,
              notificationSettings: comment.user.notificationsettings,
              isActive: comment.user.isactive,
              createdAt: comment.user.createdat,
              updatedAt: comment.user.updatedat,
              lastLoginAt: comment.user.lastloginat
            } : null
          })) || []
        };
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get project by ID');
    }
  }

  async updateProject(id: string, data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update project');
    }
  }

  async deleteProject(id: string) {
    try {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete project');
    }
  }

  async getAllProjects(limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .order('createdat', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      // Map results back to camelCase
      return (data || []).map((project: any) => ({
        ...project,
        managerId: project.managerid,
        estimatedHours: project.estimatedhours,
        actualHours: project.actualhours,
        budgetAmount: project.budgetamount,
        budgetCurrency: project.budgetcurrency,
        createdAt: project.createdat,
        updatedAt: project.updatedat,
        lastActivity: project.lastactivity,
        assignments: [], // Empty for now to avoid complex joins
        milestones: [], // Empty for now to avoid complex joins
        comments: [] // Empty for now to avoid complex joins
      }));
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get all projects');
    }
  }

  async getProjectsByManager(managerId: string, limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          manager:users!projects_managerId_fkey(*),
          assignments:projectAssignments(
            *,
            employee:users!projectAssignments_employeeId_fkey(*)
          ),
          milestones:milestones(*),
          comments:comments(
            *,
            user:users!comments_userId_fkey(*)
          )
        `)
        .eq('managerId', managerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get projects by manager');
    }
  }

  // Initiative operations
  async createInitiative(data: any) {
    try {
      // Map camelCase to lowercase for database insert
      const mappedData: any = {};
      Object.keys(data).forEach(key => {
        switch (key) {
          case 'assignedTo':
            mappedData.assignedto = data[key];
            break;
          case 'createdBy':
            mappedData.createdby = data[key];
            break;
          case 'estimatedHours':
            mappedData.estimatedhours = data[key];
            break;
          case 'actualHours':
            mappedData.actualhours = data[key];
            break;
          case 'workloadPercentage':
            mappedData.workloadpercentage = data[key];
            break;
          case 'dueDate':
            mappedData.duedate = data[key];
            break;
          case 'completedAt':
            mappedData.completedat = data[key];
            break;
          default:
            mappedData[key] = data[key];
        }
      });

      const { data: result, error } = await this.supabase
        .from('initiatives')
        .insert([mappedData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Map result back to camelCase
      if (result) {
        return {
          ...result,
          assignedTo: result.assignedto,
          createdBy: result.createdby,
          estimatedHours: result.estimatedhours,
          actualHours: result.actualhours,
          workloadPercentage: result.workloadpercentage,
          dueDate: result.duedate,
          completedAt: result.completedat,
          createdAt: result.createdat,
          updatedAt: result.updatedat
        };
      }
      
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create initiative');
    }
  }

  async getInitiativeById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('initiatives')
        .select(`
          *,
          assignee:users!initiatives_assignedto_fkey(*),
          creator:users!initiatives_createdby_fkey(*)
        `)
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Map result back to camelCase
      if (data) {
        return {
          ...data,
          assignedTo: data.assignedto,
          createdBy: data.createdby,
          estimatedHours: data.estimatedhours,
          actualHours: data.actualhours,
          workloadPercentage: data.workloadpercentage,
          dueDate: data.duedate,
          completedAt: data.completedat,
          createdAt: data.createdat,
          updatedAt: data.updatedat,
          assignee: data.assignee ? {
            ...data.assignee,
            employeeId: data.assignee.employeeid,
            managerId: data.assignee.managerid,
            workloadCap: data.assignee.workloadcap,
            overBeyondCap: data.assignee.overbeyondcap,
            phoneNumber: data.assignee.phonenumber,
            preferredCurrency: data.assignee.preferredcurrency,
            notificationSettings: data.assignee.notificationsettings,
            isActive: data.assignee.isactive,
            createdAt: data.assignee.createdat,
            updatedAt: data.assignee.updatedat,
            lastLoginAt: data.assignee.lastloginat
          } : null,
          creator: data.creator ? {
            ...data.creator,
            employeeId: data.creator.employeeid,
            managerId: data.creator.managerid,
            workloadCap: data.creator.workloadcap,
            overBeyondCap: data.creator.overbeyondcap,
            phoneNumber: data.creator.phonenumber,
            preferredCurrency: data.creator.preferredcurrency,
            notificationSettings: data.creator.notificationsettings,
            isActive: data.creator.isactive,
            createdAt: data.creator.createdat,
            updatedAt: data.creator.updatedat,
            lastLoginAt: data.creator.lastloginat
          } : null
        };
      }
      
      return data;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get initiative by ID');
    }
  }

  async updateInitiative(id: string, data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('initiatives')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update initiative');
    }
  }

  async deleteInitiative(id: string) {
    try {
      const { error } = await this.supabase
        .from('initiatives')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete initiative');
    }
  }

  async getAllInitiatives(limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('initiatives')
        .select(`
          *,
          assignee:users!initiatives_assignedto_fkey(*),
          creator:users!initiatives_createdby_fkey(*)
        `)
        .order('createdat', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      // Map results back to camelCase
      return (data || []).map((initiative: any) => ({
        ...initiative,
        assignedTo: initiative.assignedto,
        createdBy: initiative.createdby,
        estimatedHours: initiative.estimatedhours,
        actualHours: initiative.actualhours,
        workloadPercentage: initiative.workloadpercentage,
        dueDate: initiative.duedate,
        completedAt: initiative.completedat,
        createdAt: initiative.createdat,
        updatedAt: initiative.updatedat,
        assignee: initiative.assignee ? {
          ...initiative.assignee,
          employeeId: initiative.assignee.employeeid,
          managerId: initiative.assignee.managerid,
          workloadCap: initiative.assignee.workloadcap,
          overBeyondCap: initiative.assignee.overbeyondcap,
          phoneNumber: initiative.assignee.phonenumber,
          preferredCurrency: initiative.assignee.preferredcurrency,
          notificationSettings: initiative.assignee.notificationsettings,
          isActive: initiative.assignee.isactive,
          createdAt: initiative.assignee.createdat,
          updatedAt: initiative.assignee.updatedat,
          lastLoginAt: initiative.assignee.lastloginat
        } : null,
        creator: initiative.creator ? {
          ...initiative.creator,
          employeeId: initiative.creator.employeeid,
          managerId: initiative.creator.managerid,
          workloadCap: initiative.creator.workloadcap,
          overBeyondCap: initiative.creator.overbeyondcap,
          phoneNumber: initiative.creator.phonenumber,
          preferredCurrency: initiative.creator.preferredcurrency,
          notificationSettings: initiative.creator.notificationsettings,
          isActive: initiative.creator.isactive,
          createdAt: initiative.creator.createdat,
          updatedAt: initiative.creator.updatedat,
          lastLoginAt: initiative.creator.lastloginat
        } : null
      }));
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get all initiatives');
    }
  }

  // Comment operations
  async createComment(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('comments')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create comment');
    }
  }

  async getCommentsByProjectId(projectId: string, limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_userId_fkey(*)
        `)
        .eq('projectId', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get comments by project ID');
    }
  }

  async getCommentsByInitiativeId(initiativeId: string, limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_userId_fkey(*)
        `)
        .eq('initiativeId', initiativeId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get comments by initiative ID');
    }
  }

  // Activity log operations
  async createActivityLog(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('activityLogs')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create activity log');
    }
  }

  async getActivityLogs(limit: number = 100) {
    try {
      const { data, error } = await this.supabase
        .from('activityLogs')
        .select(`
          *,
          user:users!activityLogs_userId_fkey(*)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get activity logs');
    }
  }

  // Notification operations
  async createNotification(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('notifications')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getNotificationsByUserId(userId: string, limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get notifications');
    }
  }

  async markNotificationAsRead(id: string) {
    try {
      const { data: result, error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Workload operations
  async getUserWorkload(userId: string) {
    try {
      return await this.workloadService.calculateEmployeeWorkload(userId);
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get user workload');
    }
  }

  async getAllUserWorkloads() {
    try {
      // Get all users first, then calculate their workloads
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id');
      
      if (error) throw error;
      
      const userIds = users?.map((user: any) => user.id) || [];
      return await this.workloadService.calculateMultipleEmployeeWorkloads(userIds);
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get all user workloads');
    }
  }

  // Custom roles operations
  async getCustomRoles() {
    try {
      // For now, return empty array since custom roles are not in the Supabase schema
      // This can be extended later if custom roles are added to the database
    return [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get custom roles');
    }
  }

  async createCustomRole(roleData: any) {
    try {
      // For now, return the role data since custom roles are not in the Supabase schema
      // This can be extended later if custom roles are added to the database
      return {
        id: `custom-${Date.now()}`,
        ...roleData,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create custom role');
    }
  }

  // Custom departments operations
  async getCustomDepartments() {
    try {
      // For now, return empty array since custom departments are not in the Supabase schema
      // This can be extended later if custom departments are added to the database
      return [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get custom departments');
    }
  }

  async createCustomDepartment(departmentData: any) {
    try {
      // For now, return the department data since custom departments are not in the Supabase schema
      // This can be extended later if custom departments are added to the database
      return {
        id: `dept-${Date.now()}`,
        ...departmentData,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create custom department');
    }
  }

  // Project assignment operations
  async assignEmployeeToProject(projectId: string, employeeId: string, involvementPercentage: number, assignedBy: string) {
    try {
      const { data: result, error } = await this.supabase
        .from('projectAssignments')
        .insert([{
          projectid: projectId,
          employeeid: employeeId,
          involvementpercentage: involvementPercentage,
          assignedby: assignedBy
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...result,
        projectId: result.projectid,
        employeeId: result.employeeid,
        involvementPercentage: result.involvementpercentage,
        assignedAt: result.assignedat,
        updatedAt: result.updatedat
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to assign employee to project');
    }
  }

  async unassignEmployeeFromProject(projectId: string, employeeId: string) {
    try {
      const { error } = await this.supabase
        .from('projectAssignments')
        .delete()
        .eq('projectid', projectId)
        .eq('employeeid', employeeId);
      
      if (error) throw error;
      return { projectId, employeeId };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to unassign employee from project');
    }
  }

  // Milestone operations
  async createMilestone(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('milestones')
        .insert([{
          projectid: data.projectId,
          title: data.title,
          description: data.description,
          duedate: data.dueDate,
          status: data.status || 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...result,
        projectId: result.projectid,
        dueDate: result.duedate,
        completedAt: result.completedat,
        createdAt: result.createdat,
        updatedAt: result.updatedat
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create milestone');
    }
  }

  async updateMilestone(id: string, data: any) {
    try {
      const mappedData: any = {};
      Object.keys(data).forEach(key => {
        switch (key) {
          case 'projectId':
            mappedData.projectid = data[key];
            break;
          case 'dueDate':
            mappedData.duedate = data[key];
            break;
          case 'completedAt':
            mappedData.completedat = data[key];
            break;
          default:
            mappedData[key] = data[key];
        }
      });

      const { data: result, error } = await this.supabase
        .from('milestones')
        .update(mappedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...result,
        projectId: result.projectid,
        dueDate: result.duedate,
        completedAt: result.completedat,
        createdAt: result.createdat,
        updatedAt: result.updatedat
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update milestone');
    }
  }

  async deleteMilestone(id: string) {
    try {
      const { error } = await this.supabase
        .from('milestones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete milestone');
    }
  }

  // Cleanup
  async disconnect() {
    try {
      // Supabase client doesn't need explicit disconnection
      console.log('✅ Disconnected from Supabase database');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}

// Create singleton instance
const db = new DatabaseService();

export { db, DatabaseService };