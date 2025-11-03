'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { AlertRaceLogo } from '@/components/AlertRaceLogo'
import type { DashboardTheme } from '@/lib/design-system/themes'
import * as Icons from 'lucide-react'

interface BaseSidebarProps {
  theme: DashboardTheme
  className?: string
}

export function BaseSidebar({ theme, className }: BaseSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  // Obtener iconos dinámicamente
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName]
    return Icon || Icons.LayoutDashboard
  }

  return (
    <div className={`w-64 bg-white dark:bg-gray-800 shadow-lg h-screen fixed left-0 top-0 z-40 ${className || ''}`}>
      {/* Logo y título */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link href={theme.navigation.items[0]?.href || '/'} className="flex items-center">
          <AlertRaceLogo 
            width={120} 
            height={30} 
            className="h-6 w-auto"
          />
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
          {theme.header.subtitle}
        </p>
      </div>
      
      {/* Navegación */}
      <nav className="mt-6 px-3">
        {theme.navigation.items.map((item) => {
          const isActive = pathname === item.href
          const Icon = getIcon(item.icon)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? `${theme.colors.classes.primaryActive}`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Información del usuario */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${theme.colors.classes.primaryBg} p-2 rounded-full`}>
            <User className={`h-5 w-5 ${theme.colors.classes.primary}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {typeof window !== 'undefined' ? localStorage.getItem('userName') || theme.displayName : theme.displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : ''}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

