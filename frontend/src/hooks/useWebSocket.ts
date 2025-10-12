// React Hook for WebSocket Integration
// Provides easy real-time communication in React components

import { useEffect, useRef, useState, useCallback } from 'react'
import wsClient, { WebSocketCallbacks } from './websocketClient'

interface UseWebSocketOptions {
  autoConnect?: boolean
  onProgressUpdate?: (data: any) => void
  onNotification?: (data: any) => void
  onCollaboration?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface UseWebSocketReturn {
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (type: string, data: any, projectId?: string) => void
  joinProject: (projectId: string) => void
  leaveProject: (projectId: string) => void
  sendCollaborativeEdit: (projectId: string, editData: any) => void
  stats: any
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    onProgressUpdate,
    onNotification,
    onCollaboration,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const callbacksRef = useRef<WebSocketCallbacks>({})

  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = {
      onProgressUpdate,
      onNotification,
      onCollaboration,
      onConnect: () => {
        setIsConnected(true)
        onConnect?.()
      },
      onDisconnect: () => {
        setIsConnected(false)
        onDisconnect?.()
      },
      onError
    }
  }, [onProgressUpdate, onNotification, onCollaboration, onConnect, onDisconnect, onError])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect])

  const connect = useCallback(async () => {
    try {
      await wsClient.connect(callbacksRef.current)
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error)
    }
  }, [])

  const disconnect = useCallback(() => {
    wsClient.disconnect()
  }, [])

  const sendMessage = useCallback((type: string, data: any, projectId?: string) => {
    wsClient.send(type as any, data, projectId)
  }, [])

  const joinProject = useCallback((projectId: string) => {
    wsClient.joinProject(projectId)
  }, [])

  const leaveProject = useCallback((projectId: string) => {
    wsClient.leaveProject(projectId)
  }, [])

  const sendCollaborativeEdit = useCallback((projectId: string, editData: any) => {
    wsClient.sendCollaborativeEdit(projectId, editData)
  }, [])

  const stats = wsClient.getStats()

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    joinProject,
    leaveProject,
    sendCollaborativeEdit,
    stats
  }
}

// Hook for project-specific real-time features
export function useProjectRealtime(projectId: string) {
  const [projectUpdates, setProjectUpdates] = useState<any>(null)
  const [collaborators, setCollaborators] = useState<string[]>([])

  const { isConnected, joinProject, leaveProject, sendCollaborativeEdit } = useWebSocket({
    onProgressUpdate: (data) => {
      if (data.projectId === projectId) {
        setProjectUpdates(data)
      }
    },
    onCollaboration: (data) => {
      if (data.projectId === projectId) {
        if (data.action === 'USER_JOINED') {
          setCollaborators(prev => [...prev, data.userId])
        } else if (data.action === 'USER_LEFT') {
          setCollaborators(prev => prev.filter(id => id !== data.userId))
        }
      }
    }
  })

  // Auto-join project room when connected
  useEffect(() => {
    if (isConnected && projectId) {
      joinProject(projectId)
      
      return () => {
        leaveProject(projectId)
      }
    }
  }, [isConnected, projectId, joinProject, leaveProject])

  return {
    isConnected,
    projectUpdates,
    collaborators,
    sendCollaborativeEdit: (editData: any) => sendCollaborativeEdit(projectId, editData)
  }
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])

  const { isConnected } = useWebSocket({
    onNotification: (data) => {
      setNotifications(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 notifications
    }
  })

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    isConnected,
    notifications,
    clearNotifications
  }
}
