'use client'

import { BaseSidebar } from '../base/BaseSidebar'
import { useDashboardTheme } from '@/lib/design-system/useTheme'

export function AgricultorSidebar() {
  const theme = useDashboardTheme()
  return <BaseSidebar theme={theme} />
}

