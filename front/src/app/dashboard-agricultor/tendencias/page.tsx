'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { DataPoint } from '@/lib/analytics'
import { api } from '@/lib/api'
import { TrendingUp, Calendar, RefreshCw } from 'lucide-react'

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'
type ChartType = 'line' | 'area'

export default function TendenciasPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [isLoading, setIsLoading] = useState(true)
  const [sensorsData, setSensorsData] = useState<Record<string, DataPoint[]>>({})
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])

  useEffect(() => {
    // Verify authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
    }

    loadTrendData()
  }, [router, timeRange])

  const loadTrendData = async () => {
    try {
      setIsLoading(true)
      
      // Get all sensors
      const sensors = await api.sensors.getSensors() as any[]
      
      // Generate mock historical data for each sensor
      // In production, this would fetch real historical data from the API
      const now = new Date()
      const hoursBack = getHoursForTimeRange(timeRange)
      
      const newSensorsData: Record<string, DataPoint[]> = {}
      
      for (const sensor of sensors) {
        const sensorId = `sensor_${sensor.id_sensor}`
        const dataPoints: DataPoint[] = []
        
        // Generate historical data points
        const pointsCount = Math.min(hoursBack, 100) // Limit to 100 points
        const intervalMs = (hoursBack * 60 * 60 * 1000) / pointsCount
        
        for (let i = 0; i < pointsCount; i++) {
          const timestamp = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000) + (i * intervalMs))
          
          // Simulate sensor readings with some variation
          let baseValue = 25
          if (sensor.tipo === 'temperatura') baseValue = 25
          else if (sensor.tipo === 'humedad' || sensor.tipo === 'humedad_suelo') baseValue = 60
          else if (sensor.tipo === 'ph' || sensor.tipo === 'ph_suelo') baseValue = 6.5
          else if (sensor.tipo === 'radiacion' || sensor.tipo === 'radiacion_solar') baseValue = 800
          
          const variation = (Math.sin(i / 10) + Math.random() - 0.5) * 3
          const value = baseValue + variation
          
          dataPoints.push({
            timestamp,
            value: Math.max(0, value)
          })
        }
        
        newSensorsData[sensorId] = dataPoints
        
        // Auto-select first 3 sensors
        if (Object.keys(newSensorsData).length <= 3) {
          setSelectedSensors(prev => [...prev, sensorId])
        }
      }
      
      setSensorsData(newSensorsData)
      
    } catch (error) {
      console.error('Error loading trend data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHoursForTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '1h': return 1
      case '6h': return 6
      case '24h': return 24
      case '7d': return 24 * 7
      case '30d': return 24 * 30
      default: return 24
    }
  }

  const getSensorInfo = (sensorId: string) => {
    // Extract sensor name and unit from the data
    // In production, this would come from the sensors API
    const parts = sensorId.split('_')
    const id = parts[1]
    
    // Mock sensor info - in production get from API
    const mockSensors: Record<string, { name: string; unit: string; color: string; type: string }> = {
      'sensor_1': { name: 'Temperatura - Lote A', unit: '°C', color: '#ef4444', type: 'temperatura' },
      'sensor_2': { name: 'Humedad - Lote B', unit: '%', color: '#3b82f6', type: 'humedad_suelo' },
      'sensor_3': { name: 'pH - Lote C', unit: 'pH', color: '#8b5cf6', type: 'ph_suelo' },
      'sensor_4': { name: 'Radiación - Lote A', unit: 'W/m²', color: '#f59e0b', type: 'radiacion_solar' },
    }
    
    return mockSensors[sensorId] || { name: 'Sensor desconocido', unit: '', color: '#6b7280', type: 'unknown' }
  }

  const getThresholds = (sensorType: string) => {
    switch (sensorType) {
      case 'temperatura':
        return { min: 15, max: 35 }
      case 'humedad':
      case 'humedad_suelo':
        return { min: 40, max: 80 }
      case 'ph':
      case 'ph_suelo':
        return { min: 5.5, max: 7.5 }
      case 'radiacion':
      case 'radiacion_solar':
        return { min: 200, max: 1200 }
      default:
        return undefined
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-96"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-7 w-7 text-green-600 mr-3" />
            Análisis de Tendencias
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Visualiza la evolución histórica de tus sensores
          </p>
        </div>
        <button
          onClick={() => loadTrendData()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Rango de Tiempo
            </label>
            <div className="flex flex-wrap gap-2">
              {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range === '1h' && 'Última hora'}
                  {range === '6h' && 'Últimas 6h'}
                  {range === '24h' && 'Últimas 24h'}
                  {range === '7d' && 'Últimos 7 días'}
                  {range === '30d' && 'Últimos 30 días'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Gráfico
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Línea
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'area'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Área
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {selectedSensors.map((sensorId) => {
          const data = sensorsData[sensorId] || []
          const sensorInfo = getSensorInfo(sensorId)
          const thresholds = getThresholds(sensorInfo.type)
          
          return (
            <TrendChart
              key={sensorId}
              data={data}
              title={sensorInfo.name}
              unit={sensorInfo.unit}
              color={sensorInfo.color}
              showForecast={timeRange === '24h' || timeRange === '6h'}
              thresholds={thresholds}
              chartType={chartType}
            />
          )
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Interpretación de Tendencias
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• <strong>Tendencia al alza:</strong> Los valores están aumentando con el tiempo</li>
          <li>• <strong>Tendencia a la baja:</strong> Los valores están disminuyendo con el tiempo</li>
          <li>• <strong>Estable:</strong> Los valores se mantienen relativamente constantes</li>
          <li>• Las líneas punteadas representan pronósticos basados en tendencias históricas</li>
          <li>• Las líneas rojas horizontales indican los umbrales mínimos y máximos configurados</li>
        </ul>
      </div>
    </div>
  )
}
