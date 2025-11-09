'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { Cloud } from 'lucide-react'

export default function ClimaPage() {
  const router = useRouter()

  useEffect(() => {
    // Verify authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
    }
  }, [router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Cloud className="h-7 w-7 text-blue-600 mr-3" />
          Clima y Pronóstico
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Información meteorológica y recomendaciones agrícolas
        </p>
      </div>

      {/* Weather Widget with all features */}
      <WeatherWidget
        latitude={-12.0464}
        longitude={-77.0428}
        showForecast={true}
        showRecommendations={true}
      />

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📡 Fuente de Datos
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Los datos climáticos son proporcionados por servicios meteorológicos confiables. 
          Las recomendaciones agrícolas se generan automáticamente basándose en las condiciones 
          actuales y el pronóstico para ayudarte a tomar mejores decisiones en tu campo.
        </p>
      </div>
    </div>
  )
}