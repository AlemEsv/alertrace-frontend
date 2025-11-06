export const empresaTheme = {
  name: 'empresa',
  displayName: 'Empresa Industrial',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Color principal
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Clases de Tailwind predefinidas
    classes: {
      primary: 'text-blue-600 dark:text-blue-400',
      primaryBg: 'bg-blue-50 dark:bg-blue-900/20',
      primaryBgHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      primaryBorder: 'border-blue-200 dark:border-blue-800',
      primaryBorderActive: 'border-blue-700 dark:border-blue-400',
      primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      primaryActive: 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      primaryGradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
    },
  },
  navigation: {
    items: [
      { name: 'General', href: '/dashboard-empresa', icon: 'LayoutDashboard' },
      { name: 'Sensores', href: '/dashboard-empresa/sensores', icon: 'Activity' },
      { name: 'Personal', href: '/dashboard-empresa/personal', icon: 'Users' },
      { name: 'Alertas', href: '/dashboard-empresa/alertas-empresa', icon: 'AlertTriangle' },
      { name: 'Configuración', href: '/dashboard-empresa/configuracion-empresa', icon: 'Settings' },
    ],
  },
  header: {
    title: 'Sistema Industrial',
    subtitle: 'Industria',
  },
} as const

