'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outlined' | 'elevated'
}

export function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const variants = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  }
  
  return (
    <div
      className={cn(
        'rounded-lg',
        variants[variant],
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-gray-600 dark:text-gray-300', className)}>
      {children}
    </div>
  )
}

