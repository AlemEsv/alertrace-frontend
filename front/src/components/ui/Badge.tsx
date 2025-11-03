'use client'

import { cn } from '@/lib/utils'
import { getSeverityColor } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  severity?: 'baja' | 'media' | 'alta' | 'critica'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant,
  severity,
  size = 'md',
  className,
}: BadgeProps) {
  // Si hay severity, usar esos colores
  if (severity) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
          getSeverityColor(severity),
          className
        )}
      >
        {children}
      </span>
    )
  }
  
  // Si no, usar variant
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variants[variant || 'default'],
        className
      )}
    >
      {children}
    </span>
  )
}

