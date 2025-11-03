'use client'

import { Activity, AlertTriangle, Leaf, Database } from 'lucide-react'
import { BaseKPICard } from './base/BaseKPICard'
import { useDashboardTheme } from '@/lib/design-system/useTheme'
import type { KpiData } from '@/types'

interface KpiCardsProps {
  data: KpiData
}

export function KpiCards({ data }: KpiCardsProps) {
  const theme = useDashboardTheme()
  
  const kpis = [
    {
      title: 'Total Sensores',
      value: data.totalSensores,
      icon: Activity,
      variant: 'primary' as const,
    },
    {
      title: 'Sensores Activos',
      value: data.sensoresActivos,
      icon: Database,
      variant: 'success' as const,
    },
    {
      title: 'Alertas Pendientes',
      value: data.alertasPendientes,
      icon: AlertTriangle,
      variant: 'error' as const,
    },
    {
      title: 'Cultivos Activos',
      value: data.cultivosActivos,
      icon: Leaf,
      variant: 'primary' as const,
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <BaseKPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          variant={kpi.variant}
          theme={kpi.variant === 'primary' ? theme : undefined}
        />
      ))}
    </div>
  )
}
