// Supabase Service for BPL Commander
// Handles authentication and API calls to Supabase Edge Functions

import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'

// Initialize Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`
const supabase = createClient(supabaseUrl, publicAnonKey)

export interface SupabaseUser {
  id: string
  email: string
  name: string
  role: string
  designation: string
  managerId?: string
  createdAt: string
  isActive: boolean
}

export interface SupabaseProject {
  id: string
  title: string
  description: string
  assigneeId: string
  managerId: string
  timeline: string
  involvementPercentage: number
  status: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface SupabaseInitiative {
  id: string
  title: string
  description: string
  category: string
  createdBy: string
  createdAt: string
  status: string
}

class SupabaseService {
  private baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-de95975d`

  // Initialize the system with default users
  async initializeSystem(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to initialize system' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Initialization failed: ${(error as Error).message}` }
    }
  }

  // Sign up a new user
  async signUp(email: string, password: string, name: string, role: string, designation: string, managerId?: string): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          designation,
          managerId
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create user' }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: `Sign up failed: ${(error as Error).message}` }
    }
  }

  // Sign in using Supabase Auth
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: SupabaseUser; session?: any; error?: string }> {
    try {
      // For now, use demo mode with the new password
      console.log('🔄 Using demo mode with Supabase backend')
      
      // Check if it's a demo user with the new password
      const demoUsers = [
        { email: 'admin@bplcommander.com', password: 'Admin123!', role: 'admin', name: 'System Admin' },
        { email: 'manager@bplcommander.com', password: 'Admin123!', role: 'manager', name: 'Project Manager' },
        { email: 'employee@bplcommander.com', password: 'Admin123!', role: 'employee', name: 'Test Employee' }
      ]
      
      const demoUser = demoUsers.find(u => u.email === email && u.password === password)
      
      if (!demoUser) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create demo user data
      const userData: SupabaseUser = {
        id: `demo-${demoUser.role}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        designation: `${demoUser.role.charAt(0).toUpperCase() + demoUser.role.slice(1)}`,
        managerId: undefined,
        createdAt: new Date().toISOString(),
        isActive: true
      }

      return { 
        success: true, 
        user: userData,
        session: { access_token: 'demo-token' }
      }
    } catch (error) {
      return { success: false, error: `Sign in failed: ${(error as Error).message}` }
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      // For demo mode, just return success
      console.log('🔄 Demo mode sign out')
      return { success: true }
    } catch (error) {
      return { success: false, error: `Sign out failed: ${(error as Error).message}` }
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch user profile' }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: `Failed to fetch user profile: ${(error as Error).message}` }
    }
  }

  // Get all users (Admin only)
  async getAllUsers(): Promise<{ success: boolean; users?: SupabaseUser[]; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.baseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch users' }
      }

      return { success: true, users: data.users }
    } catch (error) {
      return { success: false, error: `Failed to fetch users: ${(error as Error).message}` }
    }
  }

  // Create project
  async createProject(projectData: {
    title: string
    description: string
    assigneeId: string
    timeline: string
    involvementPercentage: number
  }): Promise<{ success: boolean; project?: SupabaseProject; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(projectData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create project' }
      }

      return { success: true, project: data.project }
    } catch (error) {
      return { success: false, error: `Failed to create project: ${(error as Error).message}` }
    }
  }

  // Get projects for user
  async getUserProjects(userId: string): Promise<{ success: boolean; projects?: SupabaseProject[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/user/${userId}`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch projects' }
      }

      return { success: true, projects: data.projects }
    } catch (error) {
      return { success: false, error: `Failed to fetch projects: ${(error as Error).message}` }
    }
  }

  // Update project
  async updateProject(projectId: string, updates: Partial<SupabaseProject>): Promise<{ success: boolean; project?: SupabaseProject; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update project' }
      }

      return { success: true, project: data.project }
    } catch (error) {
      return { success: false, error: `Failed to update project: ${(error as Error).message}` }
    }
  }

  // Create initiative
  async createInitiative(initiativeData: {
    title: string
    description: string
    category: string
  }): Promise<{ success: boolean; initiative?: SupabaseInitiative; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.baseUrl}/initiatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(initiativeData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create initiative' }
      }

      return { success: true, initiative: data.initiative }
    } catch (error) {
      return { success: false, error: `Failed to create initiative: ${(error as Error).message}` }
    }
  }

  // Get all initiatives
  async getAllInitiatives(): Promise<{ success: boolean; initiatives?: SupabaseInitiative[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/initiatives`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch initiatives' }
      }

      return { success: true, initiatives: data.initiatives }
    } catch (error) {
      return { success: false, error: `Failed to fetch initiatives: ${(error as Error).message}` }
    }
  }

  // Add project comment
  async addProjectComment(projectId: string, comment: string): Promise<{ success: boolean; comment?: any; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.baseUrl}/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ comment }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to add comment' }
      }

      return { success: true, comment: data.comment }
    } catch (error) {
      return { success: false, error: `Failed to add comment: ${(error as Error).message}` }
    }
  }

  // Get project comments
  async getProjectComments(projectId: string): Promise<{ success: boolean; comments?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/comments`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch comments' }
      }

      return { success: true, comments: data.comments }
    } catch (error) {
      return { success: false, error: `Failed to fetch comments: ${(error as Error).message}` }
    }
  }

  // Get Supabase configuration
  async getConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/config`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get configuration' }
      }

      return { success: true, config: data }
    } catch (error) {
      return { success: false, error: `Failed to get configuration: ${(error as Error).message}` }
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      // For demo mode, return a mock session
      console.log('🔄 Demo mode get current session')
      return { access_token: 'demo-token' }
    } catch (error) {
      console.error('Demo mode session error:', error)
      return null
    }
  }

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    try {
      // For demo mode, return a mock subscription
      console.log('🔄 Demo mode auth state change listener')
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              console.log('🔄 Demo mode auth listener unsubscribed')
            } 
          } 
        } 
      }
    } catch (error) {
      console.error('Supabase auth state change error:', error)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  }
}

export const supabaseService = new SupabaseService()
export { supabase }
