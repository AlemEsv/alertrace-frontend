'use client'

import React from 'react'
import { SidebarAgricultor } from '@/components/dashboard/sidebar-agricultor'
import { NotificationsDropdown } from '@/components/shared/notifications-dropdown'
import { BottomNavAgricultor } from '@/components/mobile/bottom-nav-agricultor'
import { AlertRaceLogo } from '@/components/AlertRaceLogo'
import RouteGuard from '@/components/shared/route-guard'

export default function DashboardAgricultorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredUserType="trabajador" fallbackRoute="/dashboard-empresa">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar - oculto en móvil */}
        <div className="hidden md:block">
          <SidebarAgricultor />
        </div>
        
        {/* Área principal con navbar integrada */}
        <div className="flex-1 md:ml-64">
          {/* Navbar responsiva que respeta el sidebar */}
          <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <AlertRaceLogo 
                        width={100} 
                        height={25} 
                        className="h-5 w-auto"
                      />
                      <span className="hidden sm:inline text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        Mi Campo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <NotificationsDropdown userType="agricultor" />
                  <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                    Agricultor
                  </div>
                </div>
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
      <BottomNavAgricultor />
    </div>
    </RouteGuard>
  )
}
