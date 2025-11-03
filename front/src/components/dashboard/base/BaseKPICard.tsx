'use client'

import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DashboardTheme } from '@/lib/design-system/themes'

interface BaseKPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  theme?: DashboardTheme
}

export function BaseKPICard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  theme,
}: BaseKPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        if (theme) {
          return {
            iconBg: theme.colors.classes.primaryBg,
            iconColor: theme.colors.classes.primary,
          }
        }
        return {
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400',
        }
      case 'success':
        return {
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400',
        }
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        }
      case 'error':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
        }
      default:
        return {
          iconBg: 'bg-gray-100 dark:bg-gray-700',
          iconColor: 'text-gray-600 dark:text-gray-400',
        }
    }
  }
  
  const styles = getVariantStyles()
  
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`${styles.iconBg} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${styles.iconColor}`} />
        </div>
      </div>
    </Card>
  )
}

