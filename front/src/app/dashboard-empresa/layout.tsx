'use client'

import React from 'react'
import { BaseLayout } from '@/components/dashboard/base/BaseLayout'
import { EmpresaSidebar } from '@/components/dashboard/empresa/EmpresaSidebar'
import { EmpresaBottomNav } from '@/components/dashboard/empresa/EmpresaBottomNav'
import RouteGuard from '@/components/shared/route-guard'
import { useDashboardTheme } from '@/lib/design-system/useTheme'

export default function DashboardEmpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useDashboardTheme()
  
  return (
    <RouteGuard requiredUserType="empresa" fallbackRoute="/dashboard-agricultor">
      <BaseLayout
        theme={theme}
        SidebarComponent={EmpresaSidebar}
        BottomNavComponent={EmpresaBottomNav}
        userType="empresa"
      >
        {children}
      </BaseLayout>
    </RouteGuard>
  )
}
