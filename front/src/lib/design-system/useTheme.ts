'use client'

import { useMemo } from 'react'
import { themes, type ThemeName, type DashboardTheme } from './themes'

/**
 * Hook para obtener el tema actual basado en el tipo de usuario
 */
export function useDashboardTheme(): DashboardTheme {
  return useMemo(() => {
    // Obtener tipo de usuario del localStorage
    if (typeof window === 'undefined') {
      return themes.agricultor
    }
    
    const userType = localStorage.getItem('userType') // 'industria' | 'agricultor'
    const userRole = localStorage.getItem('userRole') // 'trabajador' | 'empresa' | 'admin'
    
    // Mapear del formato del frontend al formato del backend
    if (userType === 'industria' || userRole === 'empresa') {
      return themes.empresa
    }
    if (userRole === 'admin') {
      return themes.admin
    }
    
    // Por defecto agricultor
    return themes.agricultor
  }, [])
}

/**
 * Hook para obtener el nombre del tema actual
 */
export function useThemeName(): ThemeName {
  const theme = useDashboardTheme()
  return theme.name as ThemeName
}

