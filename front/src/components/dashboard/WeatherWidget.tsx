'use client'

import { useState, useEffect } from 'react'
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Gauge,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ThermometerSun,
} from 'lucide-react'
import { 
  weatherService, 
  CurrentWeather, 
  ForecastDay, 
  AgriculturalRecommendation 
} from '@/lib/weatherApi'
import { formatDate } from '@/lib/utils'

interface WeatherWidgetProps {
  latitude?: number
  longitude?: number
  showForecast?: boolean
  showRecommendations?: boolean
}

export function WeatherWidget({
  latitude = -12.0464,
  longitude = -77.0428,
  showForecast = true,
  showRecommendations = true,
}: WeatherWidgetProps) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [recommendations, setRecommendations] = useState<AgriculturalRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWeatherData()
    
    // Refresh every 30 minutes
    const interval = setInterval(() => {
      loadWeatherData()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [latitude, longitude])

  const loadWeatherData = async () => {
    try {
      setIsLoading(true)
      
      const [currentData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(latitude, longitude),
        weatherService.getForecast(latitude, longitude),
      ])

      setCurrent(currentData)
      setForecast(forecastData)

      if (showRecommendations) {
        const recs = weatherService.generateRecommendations(currentData, forecastData)
        setRecommendations(recs)
      }
    } catch (error) {
      console.error('Error loading weather data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeatherIcon = (iconCode: string) => {
    // Map OpenWeather icons to Lucide icons
    if (iconCode.startsWith('01')) return Sun
    if (iconCode.startsWith('02') || iconCode.startsWith('03')) return Cloud
    if (iconCode.startsWith('04')) return Cloud
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return CloudRain
    return Cloud
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-800'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return Droplets
      case 'planting':
        return TrendingUp
      case 'harvest':
        return TrendingDown
      case 'pest_control':
        return AlertTriangle
      default:
        return AlertTriangle
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No se pudo cargar la información del clima</p>
      </div>
    )
  }

  const WeatherIcon = getWeatherIcon(current.icon)

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Clima Actual</h3>
            <p className="text-blue-100 text-sm capitalize">{current.description}</p>
          </div>
          <WeatherIcon className="h-12 w-12 text-white/90" />
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-5xl font-bold">{current.temperature.toFixed(1)}</span>
          <span className="text-2xl mb-2">°C</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-4 w-4 text-blue-100" />
            <div>
              <p className="text-xs text-blue-100">Sensación</p>
              <p className="text-sm font-semibold">{current.feels_like.toFixed(1)}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-100" />
            <div>
              <p className="text-xs text-blue-100">Humedad</p>
              <p className="text-sm font-semibold">{current.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-100" />
            <div>
              <p className="text-xs text-blue-100">Viento</p>
              <p className="text-sm font-semibold">{current.wind_speed.toFixed(1)} m/s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-100" />
            <div>
              <p className="text-xs text-blue-100">Presión</p>
              <p className="text-sm font-semibold">{current.pressure} hPa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {showForecast && forecast.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pronóstico de 7 Días
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {forecast.map((day, index) => {
              const DayIcon = getWeatherIcon(day.icon)
              return (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {formatDate(day.date).split(' ')[0]}
                  </p>
                  <DayIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {day.temp_max.toFixed(0)}°
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {day.temp_min.toFixed(0)}°
                    </span>
                  </div>
                  {day.precipitation_probability > 30 && (
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      {day.precipitation_probability.toFixed(0)}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recomendaciones Agrícolas
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const RecIcon = getRecommendationIcon(rec.type)
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      rec.priority === 'high' ? 'bg-red-200 dark:bg-red-900/40' :
                      rec.priority === 'medium' ? 'bg-yellow-200 dark:bg-yellow-900/40' :
                      'bg-blue-200 dark:bg-blue-900/40'
                    }`}>
                      <RecIcon className={`h-5 w-5 ${
                        rec.priority === 'high' ? 'text-red-700 dark:text-red-400' :
                        rec.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                        'text-blue-700 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${
                        rec.priority === 'high' ? 'text-red-900 dark:text-red-300' :
                        rec.priority === 'medium' ? 'text-yellow-900 dark:text-yellow-300' :
                        'text-blue-900 dark:text-blue-300'
                      }`}>
                        {rec.title}
                      </h4>
                      <p className={`text-sm mb-1 ${
                        rec.priority === 'high' ? 'text-red-800 dark:text-red-400' :
                        rec.priority === 'medium' ? 'text-yellow-800 dark:text-yellow-400' :
                        'text-blue-800 dark:text-blue-400'
                      }`}>
                        {rec.description}
                      </p>
                      <p className={`text-xs ${
                        rec.priority === 'high' ? 'text-red-700 dark:text-red-500' :
                        rec.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-500' :
                        'text-blue-700 dark:text-blue-500'
                      }`}>
                        {rec.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
