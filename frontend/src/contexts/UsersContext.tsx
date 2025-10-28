import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { useAPICache } from '../hooks/useAPICache'

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
  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('bpl-token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
      headers: getDefaultHeaders(token)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.success || !data.data) {
      throw new Error('Failed to load users data')
    }

    return data.data
  }, []) // Empty dependency array since fetchUsers doesn't depend on any props/state

  const { data: users, loading, error, refresh: refreshUsers } = useAPICache(
    'users',
    fetchUsers,
    { ttl: 10 * 60 * 1000 } // 10 minutes cache
  )

  const getUserById = (id: string): User | undefined => {
    return users?.find(user => user.id === id)
  }

  const value: UsersContextType = {
    users: users || [],
    loading,
    error: error?.message || null,
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
