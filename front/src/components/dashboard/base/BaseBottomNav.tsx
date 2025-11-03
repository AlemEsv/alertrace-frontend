'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { DashboardTheme } from '@/lib/design-system/themes'
import * as Icons from 'lucide-react'

interface BaseBottomNavProps {
  theme: DashboardTheme
}

export function BaseBottomNav({ theme }: BaseBottomNavProps) {
  const pathname = usePathname()

  // Obtener iconos dinámicamente
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName]
    return Icon || Icons.LayoutDashboard
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {theme.navigation.items.map((item) => {
          const isActive = pathname === item.href
          const Icon = getIcon(item.icon)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive
                  ? `${theme.colors.classes.primary}`
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

