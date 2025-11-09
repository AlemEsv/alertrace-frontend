import { useState, useEffect, useCallback } from 'react'
import { wsService } from '@/lib/websocket'

export interface Notification {
  id: string
  type: 'alerta' | 'sensor' | 'sistema' | 'info'
  severity: 'baja' | 'media' | 'alta' | 'critica'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications')
      if (saved) {
        try {
          setNotifications(JSON.parse(saved))
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  // Setup WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    if (!token) return

    // Connect to WebSocket
    wsService.connect(token)

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsService.isConnected())
    }, 1000)

    // Subscribe to notifications
    const unsubscribe = wsService.subscribe((data: any) => {
      const notification: Notification = {
        id: data.id || `notif-${Date.now()}`,
        type: data.type || 'info',
        severity: data.severity || 'baja',
        title: data.title || 'Notificación',
        message: data.message || '',
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        data: data.data
      }

      setNotifications(prev => [notification, ...prev])

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          tag: notification.id,
        })
      }
    })

    // Cleanup on unmount
    return () => {
      clearInterval(checkConnection)
      unsubscribe()
      wsService.disconnect()
    }
  }, [])

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }, [])

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notifications')
    }
  }, [])

  // Add notification manually (for testing or local notifications)
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
    requestNotificationPermission,
  }
}
