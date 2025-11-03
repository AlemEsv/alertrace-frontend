'use client'

import { BaseSidebar } from '../base/BaseSidebar'
import { useDashboardTheme } from '@/lib/design-system/useTheme'

export function EmpresaSidebar() {
  const theme = useDashboardTheme()
  return <BaseSidebar theme={theme} />
}

