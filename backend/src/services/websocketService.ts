// WebSocket Server for Real-Time Communication
// Enables live progress updates, real-time notifications, and collaborative editing

import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userRole?: string
  isAlive?: boolean
}

interface WebSocketMessage {
  type: 'PROGRESS_UPDATE' | 'NOTIFICATION' | 'COLLABORATION' | 'PING' | 'PONG'
  data: any
  userId?: string
  projectId?: string
  timestamp: string
}

class WebSocketService {
  private wss: WebSocketServer
  private clients: Map<string, AuthenticatedWebSocket> = new Map()
  private projectRooms: Map<string, Set<string>> = new Map()

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    })
    
    this.setupWebSocketServer()
    this.startHeartbeat()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('🔌 New WebSocket connection attempt')
      
      // Extract token from query parameters
      const url = new URL(request.url!, `http://${request.headers.host}`)
      const token = url.searchParams.get('token')
      
      if (!token) {
        ws.close(1008, 'Authentication token required')
        return
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        ws.userId = decoded.userId
        ws.userRole = decoded.role
        ws.isAlive = true
        
        // Store client connection
        this.clients.set(ws.userId!, ws)
        
        console.log(`✅ WebSocket authenticated: User ${ws.userId} (${ws.userRole})`)
        
        // Send welcome message
        this.sendToClient(ws.userId!, {
          type: 'NOTIFICATION',
          data: {
            message: 'Connected to real-time updates',
            priority: 'info'
          },
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('❌ WebSocket authentication failed:', error)
        ws.close(1008, 'Invalid authentication token')
        return
      }

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          this.handleMessage(ws, message)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      })

      // Handle connection close
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: User ${ws.userId}`)
        this.clients.delete(ws.userId!)
        this.removeFromAllRooms(ws.userId!)
      })

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true
      })
    })

    console.log('🚀 WebSocket server initialized on /ws')
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'PING':
        this.sendToClient(ws.userId!, {
          type: 'PONG',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        })
        break

      case 'COLLABORATION':
        this.handleCollaborationMessage(ws, message)
        break

      default:
        console.log(`📨 Received message type: ${message.type}`)
    }
  }

  private handleCollaborationMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.projectId) return

    // Join project room
    this.joinProjectRoom(ws.userId!, message.projectId)

    // Broadcast to all users in the project room
    this.broadcastToProjectRoom(message.projectId, {
      type: 'COLLABORATION',
      data: message.data,
      userId: ws.userId,
      projectId: message.projectId,
      timestamp: new Date().toISOString()
    }, ws.userId!)
  }

  // Public methods for broadcasting updates
  public broadcastProgressUpdate(projectId: string, progressData: any) {
    this.broadcastToProjectRoom(projectId, {
      type: 'PROGRESS_UPDATE',
      data: progressData,
      projectId,
      timestamp: new Date().toISOString()
    })
  }

  public broadcastNotification(userId: string, notification: any) {
    this.sendToClient(userId, {
      type: 'NOTIFICATION',
      data: notification,
      userId,
      timestamp: new Date().toISOString()
    })
  }

  public broadcastToAllUsers(message: WebSocketMessage) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    })
  }

  public broadcastToRole(role: string, message: WebSocketMessage) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN && ws.userRole === role) {
        ws.send(JSON.stringify(message))
      }
    })
  }

  // Private helper methods
  private sendToClient(userId: string, message: WebSocketMessage) {
    const ws = this.clients.get(userId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private joinProjectRoom(userId: string, projectId: string) {
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set())
    }
    this.projectRooms.get(projectId)!.add(userId)
  }

  private removeFromAllRooms(userId: string) {
    this.projectRooms.forEach((users, projectId) => {
      users.delete(userId)
      if (users.size === 0) {
        this.projectRooms.delete(projectId)
      }
    })
  }

  private broadcastToProjectRoom(projectId: string, message: WebSocketMessage, excludeUserId?: string) {
    const room = this.projectRooms.get(projectId)
    if (!room) return

    room.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToClient(userId, message)
      }
    })
  }

  private startHeartbeat() {
    const interval = setInterval(() => {
      this.clients.forEach((ws, userId) => {
        if (!ws.isAlive) {
          console.log(`💔 Terminating dead connection: User ${userId}`)
          this.clients.delete(userId)
          this.removeFromAllRooms(userId)
          return ws.terminate()
        }

        ws.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval)
    })
  }

  // Get connection statistics
  public getStats() {
    return {
      totalConnections: this.clients.size,
      activeRooms: this.projectRooms.size,
      connectedUsers: Array.from(this.clients.keys())
    }
  }
}

export default WebSocketService
