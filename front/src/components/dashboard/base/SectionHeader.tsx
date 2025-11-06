'use client'

import { ComponentType, ReactNode } from 'react'

interface SectionHeaderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  leftActions?: ReactNode
}

export function SectionHeader({ icon: Icon, title, description, leftActions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Icon className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3" />
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {leftActions && (
        <div className="flex items-center gap-3 order-first md:order-none">
          {leftActions}
        </div>
      )}
    </div>
  )
}


