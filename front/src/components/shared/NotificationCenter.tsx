'use client'

import { useState } from 'react'
import { 
  Bell, 
  BellRing, 
  Check, 
  Trash2, 
  X, 
  AlertTriangle, 
  Info, 
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatDistanceToNow } from '@/lib/utils'

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestNotificationPermission,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critica':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'alta':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'media':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'baja':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alerta':
        return AlertTriangle
      case 'sensor':
        return Activity
      case 'sistema':
        return Info
      default:
        return Info
    }
  }

  const handleEnableNotifications = async () => {
    const enabled = await requestNotificationPermission()
    if (enabled) {
      // You could show a success message here
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notificaciones"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        )}
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection status dot */}
        <span
          className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Conectado' : 'Desconectado'}
        />
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notificaciones
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {isConnected ? (
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <Wifi className="h-3 w-3 mr-1" />
                      Tiempo real activo
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Desconectado
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-sm">
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todas como leídas
                </button>
                <button
                  onClick={clearAll}
                  className="text-red-600 dark:text-red-400 hover:underline flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No tienes notificaciones
                  </p>
                  {Notification.permission !== 'granted' && (
                    <button
                      onClick={handleEnableNotifications}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Habilitar notificaciones del navegador
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    const Icon = getTypeIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDistanceToNow(new Date(notification.timestamp))}
                              </span>
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Marcar leída
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
