'use client'

import React from 'react'
import { BaseLayout } from '@/components/dashboard/base/BaseLayout'
import { AgricultorSidebar } from '@/components/dashboard/agricultor/AgricultorSidebar'
import { AgricultorBottomNav } from '@/components/dashboard/agricultor/AgricultorBottomNav'
import RouteGuard from '@/components/shared/route-guard'
import { useDashboardTheme } from '@/lib/design-system/useTheme'

export default function DashboardAgricultorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useDashboardTheme()
  
  return (
    <RouteGuard requiredUserType="trabajador" fallbackRoute="/dashboard-empresa">
      <BaseLayout
        theme={theme}
        SidebarComponent={AgricultorSidebar}
        BottomNavComponent={AgricultorBottomNav}
        userType="agricultor"
      >
        {children}
      </BaseLayout>
    </RouteGuard>
  )
}
