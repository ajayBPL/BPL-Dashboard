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
  // ⚠️  SECURITY: Get Supabase config from environment variables (DO NOT hardcode)
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  const [supabaseConfig] = useState<{ projectId: string; publicAnonKey: string; supabaseUrl: string }>(() => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';
    const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
    
    // Validate in production
    if (isProduction && (projectId === 'your-project-id' || publicAnonKey === 'your_supabase_anon_key_here')) {
      console.error('⚠️  CRITICAL: Supabase environment variables not set in production!');
      console.error('   Required: VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL');
      console.error('   Create frontend/.env.production before building for production.');
    }
    
    return { projectId, publicAnonKey, supabaseUrl };
  })

  useEffect(() => {
    // Listen for invalid token events from API service
    const handleTokenInvalid = (event: CustomEvent) => {
      console.warn('🔒 Token invalid event received:', event.detail);
      // Clear user and token
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('bpl-user');
      localStorage.removeItem('bpl-token');
      apiService.clearToken();
      // Optionally show a notification (if you have a toast system)
      // toast.error(event.detail.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:token-invalid', handleTokenInvalid as EventListener);

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

    // Cleanup: Remove event listener
    return () => {
      window.removeEventListener('auth:token-invalid', handleTokenInvalid as EventListener);
    };
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
      console.log('🔐 Attempting backend API login with:', { email, password: '***' });
      
      // Use apiService which handles environment variables automatically
      const result = await apiService.login(email, password);
      console.log('📡 Backend API response:', result);

      if (!result.success) {
        console.log('❌ Backend login failed:', result.error);
        return { success: false, error: result.error || 'Login failed' };
      }

      // apiService wraps the backend response, so result.data contains the backend response
      // Backend returns: { success: true, data: { user: {...}, token: "..." } }
      const backendData = result.data?.data || result.data;
      
      if (!backendData?.user) {
        return { success: false, error: 'No user data returned' };
      }

      // Store the token
      const token = backendData.token;
      if (token) {
        localStorage.setItem('bpl-token', token);
        setAccessToken(token);
        apiService.setToken(token);
      }

      // Convert backend user to our User format
      const userData: User = {
        id: backendData.user.id,
        email: backendData.user.email,
        name: backendData.user.name,
        role: backendData.user.role as any,
        designation: backendData.user.designation,
        managerId: backendData.user.managerId
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
      setUser(userData);

      console.log('✅ Backend API login successful');
      return { success: true };
    } catch (error) {
      console.error('🚨 Backend API login error:', error)
      console.error('🚨 Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      // Fallback to demo mode if backend fails
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