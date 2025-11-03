export { agricultorTheme } from './agricultor-theme'
export { empresaTheme } from './empresa-theme'
export { adminTheme } from './admin-theme'

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

