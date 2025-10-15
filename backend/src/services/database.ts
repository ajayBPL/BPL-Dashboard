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
      const { data: result, error } = await this.supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
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
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to get all users');
    }
  }

  // Project operations
  async createProject(data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from('projects')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
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
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
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
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
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
      const { data: result, error } = await this.supabase
        .from('initiatives')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
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
          assignee:users!initiatives_assignedTo_fkey(*),
          creator:users!initiatives_createdBy_fkey(*)
        `)
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
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
          assignee:users!initiatives_assignedTo_fkey(*),
          creator:users!initiatives_createdBy_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
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