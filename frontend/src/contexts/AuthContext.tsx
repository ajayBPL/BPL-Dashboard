import React, { createContext, useContext, useState, useEffect } from 'react'
import { centralizedDb } from '../utils/centralizedDb'
import { apiService } from '../services/api'
import { supabaseService } from '../services/supabaseService'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'program_manager' | 'rd_manager' | 'manager' | 'employee' | 'PROGRAM_MANAGER' | 'RD_MANAGER' | 'MANAGER' | 'EMPLOYEE'
  designation: string
  managerId?: string
  password?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
  accessToken: string | null
  supabaseConfig: { projectId: string; publicAnonKey: string; supabaseUrl: string } | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [supabaseConfig] = useState<{ projectId: string; publicAnonKey: string; supabaseUrl: string }>({
    projectId: 'mwrdlemotjhrnjzncbxk',
    publicAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmRsZW1vdGpocm5qem5jYnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDQxNDMsImV4cCI6MjA2OTM4MDE0M30.b-0QzJwCbxlEqb6koGIUiEU6bC0J1zkLN0eMV5E3_Dg',
    supabaseUrl: 'https://mwrdlemotjhrnjzncbxk.supabase.co'
  })

  useEffect(() => { 
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('bpl-user')
    const storedToken = localStorage.getItem('bpl-token')
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser)
        
        // Ensure user exists in centralizedDb
        const existingUser = centralizedDb.getUserById(userData.id);
        if (!existingUser) {
          centralizedDb.addUser({
            email: userData.email,
            name: userData.name,
            role: userData.role as 'admin' | 'program_manager' | 'rd_manager' | 'manager' | 'employee' | 'PROGRAM_MANAGER' | 'RD_MANAGER' | 'MANAGER' | 'EMPLOYEE',
            designation: userData.designation,
            managerId: userData.managerId,
            lastLoginAt: new Date().toISOString(),
            isActive: true,
            password: 'defaultpass123',
            skills: [],
            department: 'General',
            workloadCap: 100,
            overBeyondCap: 20,
            preferredCurrency: 'USD',
            notificationSettings: {
              email: true,
              inApp: true,
              projectUpdates: true,
              deadlineReminders: true,
              weeklyReports: false
            }
          }, userData.id);
        }
        
        setUser(userData)
        setAccessToken(storedToken)
        
        // Update apiService with the stored token
        apiService.setToken(storedToken)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('bpl-user')
        localStorage.removeItem('bpl-token')
      }
    }
    
    setLoading(false)
  }, [])

  // Listen to Supabase auth changes
  useEffect(() => {
    try {
      const { data: { subscription } } = supabaseService.onAuthStateChange((event, session) => {
        console.log('Supabase auth state changed:', event, session)
        
        if (event === 'SIGNED_IN' && session) {
          setAccessToken(session.access_token)
          apiService.setToken(session.access_token)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAccessToken(null)
          apiService.clearToken()
          localStorage.removeItem('bpl-user')
          localStorage.removeItem('bpl-token')
        }
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error setting up Supabase auth listener:', error)
    }
  }, [])


  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Attempting Supabase login with:', { email, password: '***' });
      
      // Try Supabase authentication first
      const result = await supabaseService.signIn(email, password)
      
      if (!result.success) {
        console.log('❌ Supabase login failed:', result.error)
        return { success: false, error: result.error }
      }

      if (!result.user) {
        return { success: false, error: 'No user data returned' }
      }

      // Convert Supabase user to our User format
      const userData: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role as any,
        designation: result.user.designation,
        managerId: result.user.managerId
      }

      // Add or update user in centralizedDb
      const existingUser = centralizedDb.getUserById(userData.id);
      console.log('AuthContext Debug - Supabase user data:', userData);
      console.log('AuthContext Debug - Existing user:', existingUser);
      
      if (!existingUser) {
        console.log('AuthContext Debug - Adding new Supabase user to centralizedDb');
        const addedUser = centralizedDb.addUser({
          email: userData.email,
          name: userData.name,
          role: userData.role as 'admin' | 'program_manager' | 'rd_manager' | 'manager' | 'employee' | 'PROGRAM_MANAGER' | 'RD_MANAGER' | 'MANAGER' | 'EMPLOYEE',
          designation: userData.designation,
          managerId: userData.managerId,
          lastLoginAt: new Date().toISOString(),
          isActive: true,
          password: 'defaultpass123',
          skills: [],
          department: 'General',
          workloadCap: 100,
          overBeyondCap: 20,
          preferredCurrency: 'USD',
          notificationSettings: {
            email: true,
            inApp: true,
            projectUpdates: true,
            deadlineReminders: true,
            weeklyReports: false
          }
        }, userData.id);
        console.log('AuthContext Debug - Added Supabase user:', addedUser);
      } else {
        console.log('AuthContext Debug - Updating existing Supabase user');
        centralizedDb.updateUser(userData.id, {
          ...userData,
          lastLoginAt: new Date().toISOString(),
        });
      }

      localStorage.setItem('bpl-user', JSON.stringify(userData));
      localStorage.setItem('bpl-token', result.session?.access_token || '');
      setUser(userData);
      setAccessToken(result.session?.access_token || '');
      
      // Update apiService with the new token
      apiService.setToken(result.session?.access_token || '');

      console.log('✅ Supabase login successful');
      return { success: true };
    } catch (error) {
      console.error('🚨 Supabase login error:', error)
      console.error('🚨 Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      // Fallback to demo mode if Supabase fails
      console.log('🔄 Falling back to demo mode...')
      
      // Check if it's a demo user
      const demoUsers = [
        { email: 'admin@bplcommander.com', password: 'admin123', role: 'admin', name: 'System Admin' },
        { email: 'manager@bplcommander.com', password: 'manager123', role: 'manager', name: 'Project Manager' },
        { email: 'employee@bplcommander.com', password: 'employee123', role: 'employee', name: 'Test Employee' }
      ]
      
      const demoUser = demoUsers.find(u => u.email === email && u.password === password)
      
      if (demoUser) {
        const userData: User = {
          id: `demo-${demoUser.role}`,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role as any,
          designation: `${demoUser.role.charAt(0).toUpperCase() + demoUser.role.slice(1)}`,
          managerId: undefined
        }
        
        // Add to centralizedDb
        centralizedDb.addUser({
          email: userData.email,
          name: userData.name,
          role: userData.role as any,
          designation: userData.designation,
          managerId: userData.managerId,
          lastLoginAt: new Date().toISOString(),
          isActive: true,
          password: 'defaultpass123',
          skills: [],
          department: 'General',
          workloadCap: 100,
          overBeyondCap: 20,
          preferredCurrency: 'USD',
          notificationSettings: {
            email: true,
            inApp: true,
            projectUpdates: true,
            deadlineReminders: true,
            weeklyReports: false
          }
        }, userData.id);
        
        localStorage.setItem('bpl-user', JSON.stringify(userData));
        localStorage.setItem('bpl-token', 'demo-token');
        setUser(userData);
        setAccessToken('demo-token');
        apiService.setToken('demo-token');
        
        console.log('✅ Demo login successful');
        return { success: true };
      }
      
      return { success: false, error: `Login failed: ${(error as Error).message}` }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await supabaseService.signOut()
    } catch (error) {
      console.error('Supabase sign out error:', error)
    }
    
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('bpl-user')
    localStorage.removeItem('bpl-token')
    
    // Clear token from apiService
    apiService.clearToken()
  }

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' }
    }

    try {
      // Update user in centralized database if it exists there
      const dbUser = centralizedDb.getUserById(user.id)
      if (dbUser) {
        // Update in centralized database
        centralizedDb.updateUser(user.id, updates)
      }

      // Update current user state
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('bpl-user', JSON.stringify(updatedUser))

      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      updateProfile,
      accessToken, 
      supabaseConfig 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}