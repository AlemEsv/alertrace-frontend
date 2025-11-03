'use client'

import { BaseBottomNav } from '../base/BaseBottomNav'
import { useDashboardTheme } from '@/lib/design-system/useTheme'

export function AgricultorBottomNav() {
  const theme = useDashboardTheme()
  return <BaseBottomNav theme={theme} />
}

