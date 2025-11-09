// Weather API integration service
// Using OpenWeatherMap API as example (can be configured for other providers)

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'demo'
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5'

export interface CurrentWeather {
  temperature: number
  feels_like: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_direction: number
  clouds: number
  visibility: number
  uv_index?: number
  description: string
  icon: string
  timestamp: Date
}

export interface ForecastDay {
  date: Date
  temp_min: number
  temp_max: number
  temp_day: number
  humidity: number
  precipitation_probability: number
  precipitation_mm?: number
  wind_speed: number
  description: string
  icon: string
}

export interface WeatherAlert {
  event: string
  start: Date
  end: Date
  description: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
}

export interface AgriculturalRecommendation {
  type: 'irrigation' | 'fertilization' | 'pest_control' | 'harvest' | 'planting'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  reason: string
}

class WeatherService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = WEATHER_API_KEY
    this.baseUrl = WEATHER_API_BASE_URL
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=es`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        wind_speed: data.wind.speed,
        wind_direction: data.wind.deg,
        clouds: data.clouds.all,
        visibility: data.visibility / 1000, // Convert to km
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: new Date(data.dt * 1000),
      }
    } catch (error) {
      console.error('Error fetching current weather:', error)
      // Return mock data for development
      return this.getMockCurrentWeather()
    }
  }

  /**
   * Get weather forecast for next 7 days
   */
  async getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&appid=${this.apiKey}&units=metric&lang=es`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()

      return data.list.map((day: any) => ({
        date: new Date(day.dt * 1000),
        temp_min: day.temp.min,
        temp_max: day.temp.max,
        temp_day: day.temp.day,
        humidity: day.humidity,
        precipitation_probability: day.pop * 100,
        precipitation_mm: day.rain || 0,
        wind_speed: day.speed,
        description: day.weather[0].description,
        icon: day.weather[0].icon,
      }))
    } catch (error) {
      console.error('Error fetching forecast:', error)
      // Return mock data for development
      return this.getMockForecast()
    }
  }

  /**
   * Get weather alerts for location
   */
  async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      // Note: Alerts require OneCall API which needs subscription
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${this.apiKey}&units=metric&lang=es`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.alerts) {
        return []
      }

      return data.alerts.map((alert: any) => ({
        event: alert.event,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
        description: alert.description,
        severity: this.mapSeverity(alert.tags),
      }))
    } catch (error) {
      console.error('Error fetching weather alerts:', error)
      return []
    }
  }

  /**
   * Generate agricultural recommendations based on weather data
   */
  generateRecommendations(
    current: CurrentWeather,
    forecast: ForecastDay[]
  ): AgriculturalRecommendation[] {
    const recommendations: AgriculturalRecommendation[] = []

    // Check for irrigation needs
    const avgHumidity = forecast.slice(0, 3).reduce((sum, day) => sum + day.humidity, 0) / 3
    const precipitationNext3Days = forecast.slice(0, 3).reduce((sum, day) => sum + (day.precipitation_mm || 0), 0)

    if (avgHumidity < 50 && precipitationNext3Days < 5) {
      recommendations.push({
        type: 'irrigation',
        priority: 'high',
        title: 'Riego Recomendado',
        description: 'Los niveles de humedad están bajos y no se espera lluvia significativa',
        reason: `Humedad promedio: ${avgHumidity.toFixed(0)}%, Precipitación esperada: ${precipitationNext3Days.toFixed(1)}mm`,
      })
    }

    // Check for frost risk
    const minTempNext3Days = Math.min(...forecast.slice(0, 3).map(day => day.temp_min))
    if (minTempNext3Days < 5) {
      recommendations.push({
        type: 'pest_control',
        priority: 'high',
        title: 'Alerta de Helada',
        description: 'Se esperan temperaturas bajas que podrían afectar los cultivos',
        reason: `Temperatura mínima esperada: ${minTempNext3Days.toFixed(1)}°C`,
      })
    }

    // Check for optimal planting conditions
    if (current.temperature > 15 && current.temperature < 25 && current.humidity > 40) {
      const rainNextWeek = forecast.reduce((sum, day) => sum + (day.precipitation_mm || 0), 0)
      if (rainNextWeek > 10 && rainNextWeek < 50) {
        recommendations.push({
          type: 'planting',
          priority: 'medium',
          title: 'Condiciones Óptimas para Siembra',
          description: 'El clima es favorable para iniciar siembras',
          reason: `Temperatura adecuada (${current.temperature.toFixed(1)}°C), lluvia moderada esperada (${rainNextWeek.toFixed(1)}mm)`,
        })
      }
    }

    // Check for harvest timing
    const clearDaysAhead = forecast.slice(0, 5).filter(day => day.precipitation_probability < 30).length
    if (clearDaysAhead >= 3) {
      recommendations.push({
        type: 'harvest',
        priority: 'medium',
        title: 'Ventana de Cosecha Favorable',
        description: 'Se esperan varios días sin lluvia, ideal para cosechar',
        reason: `${clearDaysAhead} días con baja probabilidad de lluvia`,
      })
    }

    // Check for high wind warning
    const maxWindNext3Days = Math.max(...forecast.slice(0, 3).map(day => day.wind_speed))
    if (maxWindNext3Days > 15) {
      recommendations.push({
        type: 'pest_control',
        priority: 'medium',
        title: 'Precaución por Vientos Fuertes',
        description: 'Se esperan vientos que podrían afectar aplicaciones de productos',
        reason: `Velocidad máxima del viento: ${maxWindNext3Days.toFixed(1)} m/s`,
      })
    }

    return recommendations
  }

  /**
   * Get UV index (requires OneCall API)
   */
  async getUVIndex(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()
      return data.value
    } catch (error) {
      console.error('Error fetching UV index:', error)
      return 5 // Default moderate UV
    }
  }

  // Helper methods

  private mapSeverity(tags: string[]): 'minor' | 'moderate' | 'severe' | 'extreme' {
    if (tags.includes('Extreme')) return 'extreme'
    if (tags.includes('Severe')) return 'severe'
    if (tags.includes('Moderate')) return 'moderate'
    return 'minor'
  }

  private getMockCurrentWeather(): CurrentWeather {
    return {
      temperature: 24,
      feels_like: 25,
      humidity: 65,
      pressure: 1013,
      wind_speed: 3.5,
      wind_direction: 180,
      clouds: 40,
      visibility: 10,
      uv_index: 6,
      description: 'parcialmente nublado',
      icon: '02d',
      timestamp: new Date(),
    }
  }

  private getMockForecast(): ForecastDay[] {
    const forecast: ForecastDay[] = []
    const now = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i + 1)

      forecast.push({
        date,
        temp_min: 18 + Math.random() * 3,
        temp_max: 28 + Math.random() * 4,
        temp_day: 24 + Math.random() * 3,
        humidity: 60 + Math.random() * 20,
        precipitation_probability: Math.random() * 60,
        precipitation_mm: Math.random() * 10,
        wind_speed: 2 + Math.random() * 5,
        description: i % 3 === 0 ? 'soleado' : i % 3 === 1 ? 'nublado' : 'lluvia ligera',
        icon: i % 3 === 0 ? '01d' : i % 3 === 1 ? '03d' : '10d',
      })
    }

    return forecast
  }
}

// Export singleton instance
export const weatherService = new WeatherService()
