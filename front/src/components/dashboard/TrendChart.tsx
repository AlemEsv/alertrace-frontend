'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react'
import { DataPoint, analyzeTrend, calculateStatistics } from '@/lib/analytics'
import { formatTime } from '@/lib/utils'

interface TrendChartProps {
  data: DataPoint[]
  title: string
  unit: string
  color?: string
  showForecast?: boolean
  showAnomalies?: boolean
  thresholds?: {
    min?: number
    max?: number
  }
  chartType?: 'line' | 'area'
}

export function TrendChart({
  data,
  title,
  unit,
  color = '#22c55e',
  showForecast = false,
  showAnomalies = false,
  thresholds,
  chartType = 'line',
}: TrendChartProps) {
  // Analyze trend and calculate statistics
  const analysis = useMemo(() => analyzeTrend(data), [data])
  const statistics = useMemo(() => calculateStatistics(data), [data])

  // Format data for charts
  const chartData = useMemo(() => {
    const formattedData = data.map(point => ({
      timestamp: point.timestamp.getTime(),
      value: point.value,
      displayTime: formatTime(point.timestamp),
    }))

    if (showForecast && analysis.forecast.length > 0) {
      const forecastData = analysis.forecast.map(point => ({
        timestamp: point.timestamp.getTime(),
        forecast: point.value,
        displayTime: formatTime(point.timestamp),
      }))
      return [...formattedData, ...forecastData]
    }

    return formattedData
  }, [data, showForecast, analysis.forecast])

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (analysis.direction === 'up') {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        text: 'Tendencia al alza'
      }
    } else if (analysis.direction === 'down') {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        text: 'Tendencia a la baja'
      }
    } else {
      return {
        icon: Activity,
        color: 'text-blue-600',
        text: 'Estable'
      }
    }
  }

  const trendDisplay = getTrendDisplay()
  const TrendIcon = trendDisplay.icon

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {data.displayTime}
          </p>
          {data.value !== undefined && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Valor: {data.value.toFixed(2)} {unit}
            </p>
          )}
          {data.forecast !== undefined && (
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Pronóstico: {data.forecast.toFixed(2)} {unit}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${trendDisplay.color}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{trendDisplay.text}</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {statistics.current.toFixed(2)} {unit}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Promedio</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {statistics.avg.toFixed(2)} {unit}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mínimo</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {statistics.min.toFixed(2)} {unit}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Máximo</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {statistics.max.toFixed(2)} {unit}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="displayTime"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
                label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Threshold lines */}
              {thresholds?.min !== undefined && (
                <ReferenceLine
                  y={thresholds.min}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Mín', fill: '#ef4444', fontSize: 10 }}
                />
              )}
              {thresholds?.max !== undefined && (
                <ReferenceLine
                  y={thresholds.max}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Máx', fill: '#ef4444', fontSize: 10 }}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                name="Valor actual"
              />
              {showForecast && (
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                  name="Pronóstico"
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="displayTime"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
                label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Threshold lines */}
              {thresholds?.min !== undefined && (
                <ReferenceLine
                  y={thresholds.min}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Mín', fill: '#ef4444', fontSize: 10 }}
                />
              )}
              {thresholds?.max !== undefined && (
                <ReferenceLine
                  y={thresholds.max}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Máx', fill: '#ef4444', fontSize: 10 }}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3 }}
                name="Valor actual"
              />
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="Pronóstico"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Analysis Info */}
      {Math.abs(analysis.correlation) > 0.7 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Se detectó una tendencia {analysis.direction === 'up' ? 'ascendente' : 'descendente'} fuerte
              (correlación: {Math.abs(analysis.correlation).toFixed(2)}). 
              {statistics.change_percent !== 0 && (
                <> Cambio del {Math.abs(statistics.change_percent).toFixed(1)}% respecto a la lectura anterior.</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
