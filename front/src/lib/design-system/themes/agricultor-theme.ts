export const agricultorTheme = {
  name: 'agricultor',
  displayName: 'Agricultor',
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a', // Color principal
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Clases de Tailwind predefinidas
    classes: {
      primary: 'text-green-600 dark:text-green-400',
      primaryBg: 'bg-green-50 dark:bg-green-900/20',
      primaryBgHover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      primaryBorder: 'border-green-200 dark:border-green-800',
      primaryBorderActive: 'border-green-700 dark:border-green-400',
      primaryButton: 'bg-green-600 hover:bg-green-700 text-white',
      primaryActive: 'bg-green-50 text-green-700 border-r-2 border-green-700 dark:bg-green-900/20 dark:text-green-400',
      primaryGradient: 'bg-gradient-to-r from-green-600 to-green-700',
    },
  },
  navigation: {
    items: [
      { name: 'General', href: '/dashboard-agricultor', icon: 'LayoutDashboard' },
      { name: 'Alertas', href: '/dashboard-agricultor/alertas-agricultor', icon: 'AlertTriangle' },
      { name: 'Clima', href: '/dashboard-agricultor/clima', icon: 'Activity' },
      { name: 'Configuración', href: '/dashboard-agricultor/configuracion-agricultor', icon: 'Settings' },
    ],
  },
  header: {
    title: 'Mi Campo',
    subtitle: 'Campo Agrícola',
  },
} as const

