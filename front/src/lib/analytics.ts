// Analytics and data processing utilities for trend analysis

export interface DataPoint {
  timestamp: Date
  value: number
}

export interface TrendData {
  sensor_id: number
  sensor_name: string
  variable: string
  data_points: DataPoint[]
  statistics: {
    min: number
    max: number
    avg: number
    current: number
    change_percent: number
  }
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  slope: number
  correlation: number
  forecast: DataPoint[]
}

/**
 * Calculate basic statistics from an array of data points
 */
export function calculateStatistics(dataPoints: DataPoint[]) {
  if (dataPoints.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      current: 0,
      change_percent: 0
    }
  }

  const values = dataPoints.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const current = values[values.length - 1]
  const previous = values[Math.max(0, values.length - 2)]
  const change_percent = previous !== 0 ? ((current - previous) / previous) * 100 : 0

  return {
    min,
    max,
    avg,
    current,
    change_percent
  }
}

/**
 * Detect trend direction using linear regression
 */
export function analyzeTrend(dataPoints: DataPoint[]): TrendAnalysis {
  if (dataPoints.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      correlation: 0,
      forecast: []
    }
  }

  // Convert timestamps to numeric values (hours from first point)
  const firstTime = dataPoints[0].timestamp.getTime()
  const points = dataPoints.map(d => ({
    x: (d.timestamp.getTime() - firstTime) / (1000 * 60 * 60), // hours
    y: d.value
  }))

  // Linear regression
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate correlation coefficient
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  // Determine direction
  let direction: 'up' | 'down' | 'stable'
  if (Math.abs(slope) < 0.1) {
    direction = 'stable'
  } else if (slope > 0) {
    direction = 'up'
  } else {
    direction = 'down'
  }

  // Generate forecast for next 6 hours
  const lastX = points[points.length - 1].x
  const forecast: DataPoint[] = []
  for (let i = 1; i <= 6; i++) {
    const x = lastX + i
    const y = slope * x + intercept
    forecast.push({
      timestamp: new Date(firstTime + x * 1000 * 60 * 60),
      value: y
    })
  }

  return {
    direction,
    slope,
    correlation,
    forecast
  }
}

/**
 * Smooth data using moving average
 */
export function movingAverage(dataPoints: DataPoint[], windowSize: number = 5): DataPoint[] {
  if (dataPoints.length < windowSize) {
    return dataPoints
  }

  const smoothed: DataPoint[] = []
  
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(dataPoints.length, i + Math.ceil(windowSize / 2))
    const window = dataPoints.slice(start, end)
    const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length
    
    smoothed.push({
      timestamp: dataPoints[i].timestamp,
      value: avg
    })
  }

  return smoothed
}

/**
 * Detect anomalies using standard deviation
 */
export function detectAnomalies(dataPoints: DataPoint[], threshold: number = 2): DataPoint[] {
  if (dataPoints.length < 3) {
    return []
  }

  const values = dataPoints.map(d => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  )

  const anomalies = dataPoints.filter(d => {
    const zScore = Math.abs((d.value - mean) / stdDev)
    return zScore > threshold
  })

  return anomalies
}

/**
 * Aggregate data by time interval
 */
export function aggregateByInterval(
  dataPoints: DataPoint[],
  intervalMinutes: number,
  aggregation: 'avg' | 'min' | 'max' | 'sum' = 'avg'
): DataPoint[] {
  if (dataPoints.length === 0) {
    return []
  }

  const intervalMs = intervalMinutes * 60 * 1000
  const grouped = new Map<number, number[]>()

  dataPoints.forEach(point => {
    const bucket = Math.floor(point.timestamp.getTime() / intervalMs) * intervalMs
    if (!grouped.has(bucket)) {
      grouped.set(bucket, [])
    }
    grouped.get(bucket)!.push(point.value)
  })

  const aggregated: DataPoint[] = []
  
  grouped.forEach((values, timestamp) => {
    let value: number
    switch (aggregation) {
      case 'min':
        value = Math.min(...values)
        break
      case 'max':
        value = Math.max(...values)
        break
      case 'sum':
        value = values.reduce((a, b) => a + b, 0)
        break
      case 'avg':
      default:
        value = values.reduce((a, b) => a + b, 0) / values.length
        break
    }
    
    aggregated.push({
      timestamp: new Date(timestamp),
      value
    })
  })

  return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Compare two time series
 */
export function compareTimeSeries(series1: DataPoint[], series2: DataPoint[]): {
  correlation: number
  averageDifference: number
  maxDifference: number
} {
  if (series1.length === 0 || series2.length === 0) {
    return {
      correlation: 0,
      averageDifference: 0,
      maxDifference: 0
    }
  }

  // Find common timestamps
  const timestamps1 = new Set(series1.map(d => d.timestamp.getTime()))
  const timestamps2 = new Set(series2.map(d => d.timestamp.getTime()))
  const commonTimestamps = Array.from(timestamps1).filter(t => timestamps2.has(t))

  if (commonTimestamps.length < 2) {
    return {
      correlation: 0,
      averageDifference: 0,
      maxDifference: 0
    }
  }

  // Get values for common timestamps
  const values1 = commonTimestamps.map(t => 
    series1.find(d => d.timestamp.getTime() === t)!.value
  )
  const values2 = commonTimestamps.map(t => 
    series2.find(d => d.timestamp.getTime() === t)!.value
  )

  // Calculate correlation
  const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
  const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length

  const numerator = values1.reduce((sum, v1, i) => 
    sum + (v1 - mean1) * (values2[i] - mean2), 0
  )
  const denominator = Math.sqrt(
    values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) *
    values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0)
  )

  const correlation = denominator !== 0 ? numerator / denominator : 0

  // Calculate differences
  const differences = values1.map((v1, i) => Math.abs(v1 - values2[i]))
  const averageDifference = differences.reduce((a, b) => a + b, 0) / differences.length
  const maxDifference = Math.max(...differences)

  return {
    correlation,
    averageDifference,
    maxDifference
  }
}
