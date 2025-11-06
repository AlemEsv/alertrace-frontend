import { agricultorTheme } from './agricultor-theme'
import { empresaTheme } from './empresa-theme'
import { adminTheme } from './admin-theme'

// Re-exportar los temas
export { agricultorTheme, empresaTheme, adminTheme }

export type DashboardTheme = typeof agricultorTheme | typeof empresaTheme | typeof adminTheme

export const themes = {
  agricultor: agricultorTheme,
  empresa: empresaTheme,
  admin: adminTheme,
} as const

export type ThemeName = keyof typeof themes

/**
 * Obtiene el tema basado en el tipo de usuario
 */
export function getThemeByUserType(userType: 'trabajador' | 'empresa' | 'admin'): DashboardTheme {
  switch (userType) {
    case 'trabajador':
      return agricultorTheme
    case 'empresa':
      return empresaTheme
    case 'admin':
      return adminTheme
    default:
      return agricultorTheme
  }
}

/**
 * Obtiene el tema por nombre
 */
export function getThemeByName(themeName: ThemeName): DashboardTheme {
  return themes[themeName] || agricultorTheme
}

