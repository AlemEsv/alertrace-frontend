'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Package } from 'lucide-react'
import { BaseKPICard } from './base/BaseKPICard'
import { useDashboardTheme } from '@/lib/design-system/useTheme'
import { Card } from '@/components/ui'

interface KpiDataEmpresa {
  rendimientoExtraccion: number
  tiempoEnRango: number
  mermas: number
  lotesProcesados: number
  alertasAbiertas: number
}

export function KpiCardsEmpresa() {
  const theme = useDashboardTheme()
  const [kpiData, setKpiData] = useState<KpiDataEmpresa>({
    rendimientoExtraccion: 87.5,
    tiempoEnRango: 94.2,
    mermas: 12.5,
    lotesProcesados: 24,
    alertasAbiertas: 3
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true)
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000))
        setKpiData({
          rendimientoExtraccion: 87.5,
          tiempoEnRango: 94.2,
          mermas: 12.5,
          lotesProcesados: 24,
          alertasAbiertas: 3
        })
      } catch (error) {
        console.error('Error al cargar KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKpis()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchKpis, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatPercentage = (value: number) => {
    return `${value}%`
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <BaseKPICard
        title="Rendimiento Extracción"
        value={formatPercentage(kpiData.rendimientoExtraccion)}
        icon={TrendingUp}
        variant="primary"
        theme={theme}
        trend={{
          value: '+2.3% vs mes anterior',
          isPositive: true
        }}
      />
      <BaseKPICard
        title="Tiempo en Rango"
        value={formatPercentage(kpiData.tiempoEnRango)}
        icon={TrendingUp}
        variant="success"
        trend={{
          value: '+1.8% vs mes anterior',
          isPositive: true
        }}
      />
      <BaseKPICard
        title="Mermas"
        value={formatPercentage(kpiData.mermas)}
        icon={TrendingDown}
        variant="error"
        trend={{
          value: '-0.5% vs mes anterior',
          isPositive: false
        }}
      />
      <BaseKPICard
        title="Lotes Procesados"
        value={formatNumber(kpiData.lotesProcesados)}
        icon={Package}
        variant="default"
      />
    </div>
  )
}
