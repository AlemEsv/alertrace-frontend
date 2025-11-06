'use client'

import { ReactNode, ComponentType } from 'react'
import { NotificationsDropdown } from '@/components/shared/notifications-dropdown'
import { AlertRaceLogo } from '@/components/AlertRaceLogo'
import type { DashboardTheme } from '@/lib/design-system/themes'

interface BaseLayoutProps {
  children: ReactNode
  theme: DashboardTheme
  SidebarComponent: ComponentType
  BottomNavComponent: ComponentType
  userType: 'empresa' | 'agricultor' | 'admin'
}

export function BaseLayout({
  children,
  theme,
  SidebarComponent,
  BottomNavComponent,
  userType,
}: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar - oculto en móvil */}
        <div className="hidden md:block">
          <SidebarComponent />
        </div>
        
        {/* Área principal con navbar integrada */}
        <div className="flex-1 md:ml-64">
          <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
              <span className="hidden sm:inline text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {theme.header.title}
              </span>
              <div className="flex items-center gap-4">
                {userType !== 'admin' && (
                  <NotificationsDropdown userType={userType as 'empresa' | 'agricultor'} />
                )}
                <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                  {theme.displayName}
                </span>
              </div>
            </div>
          </nav>
          
          {/* Contenido principal */}
          <main className="p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation - solo visible en móvil */}
      <BottomNavComponent />
    </div>
  )
}

