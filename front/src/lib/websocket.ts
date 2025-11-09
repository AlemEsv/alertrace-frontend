// WebSocket service for real-time notifications
type NotificationCallback = (notification: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private callbacks: Set<NotificationCallback> = new Set()
  private isIntentionallyClosed = false

  constructor() {
    // Use WS protocol based on HTTP/HTTPS
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'
    // Extract host from base URL
    const host = baseUrl.replace(/^https?:\/\//, '')
    this.url = `${protocol}//${host}/ws`
  }

  connect(token: string) {
    if (typeof window === 'undefined') return

    this.isIntentionallyClosed = false
    
    try {
      this.ws = new WebSocket(`${this.url}?token=${token}`)

      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          this.notifyCallbacks(notification)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        this.ws = null
        
        // Only attempt reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect(token)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`⏳ Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect(token)
      }, delay)
    } else {
      console.error('❌ Max reconnection attempts reached')
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribe(callback: NotificationCallback) {
    this.callbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  private notifyCallbacks(notification: any) {
    this.callbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Error in notification callback:', error)
      }
    })
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const wsService = new WebSocketService()
