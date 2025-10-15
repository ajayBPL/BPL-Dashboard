// WebSocket Client for Real-Time Communication
// Enables live progress updates, real-time notifications, and collaborative editing

interface WebSocketMessage {
  type: 'PROGRESS_UPDATE' | 'NOTIFICATION' | 'COLLABORATION' | 'PING' | 'PONG'
  data: any
  userId?: string
  projectId?: string
  timestamp: string
}

interface WebSocketCallbacks {
  onProgressUpdate?: (data: any) => void
  onNotification?: (data: any) => void
  onCollaboration?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private callbacks: WebSocketCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor() {
    this.url = this.getWebSocketUrl()
    this.token = this.getAuthToken()
  }

  /**
   * Connect to WebSocket server
   */
  connect(callbacks: WebSocketCallbacks = {}): Promise<void> {
    this.callbacks = callbacks

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true

      try {
        const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.callbacks.onConnect?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.stopHeartbeat()
          this.callbacks.onDisconnect?.()
          
          // Attempt to reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.isConnecting = false
          this.callbacks.onError?.(error)
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
  }

  /**
   * Send message to server
   */
  send(type: WebSocketMessage['type'], data: any, projectId?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send message')
      return
    }

    const message: WebSocketMessage = {
      type,
      data,
      projectId,
      timestamp: new Date().toISOString()
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Join project room for collaborative editing
   */
  joinProject(projectId: string): void {
    this.send('COLLABORATION', { action: 'JOIN', projectId }, projectId)
  }

  /**
   * Leave project room
   */
  leaveProject(projectId: string): void {
    this.send('COLLABORATION', { action: 'LEAVE', projectId }, projectId)
  }

  /**
   * Send collaborative edit
   */
  sendCollaborativeEdit(projectId: string, editData: any): void {
    this.send('COLLABORATION', { 
      action: 'EDIT', 
      data: editData 
    }, projectId)
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      url: this.url
    }
  }

  /**
   * Private methods
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname === 'localhost'
      ? 'localhost:3000'
      : window.location.hostname + ':3000'

    return `${protocol}//${host}/ws`
  }

  private getAuthToken(): string {
    const token = localStorage.getItem('bpl-token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    return token
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'PROGRESS_UPDATE':
        console.log('📊 Progress update received:', message.data)
        this.callbacks.onProgressUpdate?.(message.data)
        break

      case 'NOTIFICATION':
        console.log('🔔 Notification received:', message.data)
        this.callbacks.onNotification?.(message.data)
        break

      case 'COLLABORATION':
        console.log('👥 Collaboration update received:', message.data)
        this.callbacks.onCollaboration?.(message.data)
        break

      case 'PONG':
        // Heartbeat response
        break

      default:
        console.log('📨 Unknown message type:', message.type)
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send('PING', { timestamp: new Date().toISOString() })
      }
    }, 30000) // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.callbacks).catch(error => {
          console.error('❌ Reconnect failed:', error)
        })
      }
    }, delay)
  }
}

// Create singleton instance
const wsClient = new WebSocketClient()

export default wsClient
export { WebSocketMessage, WebSocketCallbacks }
