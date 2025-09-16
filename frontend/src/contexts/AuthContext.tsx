import React, { createContext, useContext, useState, useEffect } from 'react'
import { centralizedDb } from '../utils/centralizedDb'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'

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
    projectId: 'bplcommander-demo',
    publicAnonKey: 'demo-anon-key',
    supabaseUrl: 'https://bplcommander-demo.supabase.co'
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
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('bpl-user')
        localStorage.removeItem('bpl-token')
      }
    }
    
    setLoading(false)
  }, [])


  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call the real API
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid email or password' };
      }

      // Extract user data and token from API response
      const userData: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        role: data.data.user.role,
        designation: data.data.user.designation,
        managerId: data.data.user.managerId
      };

      const token = data.data.token;

      // Add or update user in centralizedDb
      const existingUser = centralizedDb.getUserById(userData.id);
      console.log('AuthContext Debug - User data:', userData);
      console.log('AuthContext Debug - Existing user:', existingUser);
      
      if (!existingUser) {
        console.log('AuthContext Debug - Adding new user to centralizedDb');
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
        console.log('AuthContext Debug - Added user:', addedUser);
      } else {
        console.log('AuthContext Debug - Updating existing user');
        // Update existing user with latest data
        centralizedDb.updateUser(userData.id, {
          name: userData.name,
          role: userData.role,
          designation: userData.designation,
          managerId: userData.managerId,
          lastLoginAt: new Date().toISOString()
        });
      }

      // Store in state and localStorage
      setUser(userData);
      setAccessToken(token);
      localStorage.setItem('bpl-user', JSON.stringify(userData));
      localStorage.setItem('bpl-token', token);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  const signOut = async () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('bpl-user')
    localStorage.removeItem('bpl-token')
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