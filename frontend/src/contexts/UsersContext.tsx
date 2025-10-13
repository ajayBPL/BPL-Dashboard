import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar?: string
}

interface UsersContextType {
  users: User[]
  loading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  getUserById: (id: string) => User | undefined
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

interface UsersProviderProps {
  children: ReactNode
}

export function UsersProvider({ children }: UsersProviderProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
        headers: getDefaultHeaders(token)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUsers(data.data)
        } else {
          setError('Failed to load users data')
        }
      } else {
        setError(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    await fetchUsers()
  }

  const getUserById = (id: string): User | undefined => {
    return users.find(user => user.id === id)
  }

  useEffect(() => {
    fetchUsers()
    
    // Cleanup function to prevent memory leaks
    return () => {
      setUsers([])
      setError(null)
    }
  }, [])

  const value: UsersContextType = {
    users,
    loading,
    error,
    refreshUsers,
    getUserById
  }

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider')
  }
  return context
}
