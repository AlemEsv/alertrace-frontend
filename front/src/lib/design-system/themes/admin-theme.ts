// Tema para futuro dashboard de administrador
export const adminTheme = {
  name: 'admin',
  displayName: 'Administrador',
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea', // Color principal
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Clases de Tailwind predefinidas
    classes: {
      primary: 'text-purple-600 dark:text-purple-400',
      primaryBg: 'bg-purple-50 dark:bg-purple-900/20',
      primaryBgHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      primaryBorder: 'border-purple-200 dark:border-purple-800',
      primaryBorderActive: 'border-purple-700 dark:border-purple-400',
      primaryButton: 'bg-purple-600 hover:bg-purple-700 text-white',
      primaryActive: 'bg-purple-50 text-purple-700 border-r-2 border-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      primaryGradient: 'bg-gradient-to-r from-purple-600 to-purple-700',
    },
  },
  navigation: {
    items: [
      { name: 'General', href: '/dashboard-admin', icon: 'LayoutDashboard' },
      { name: 'Usuarios', href: '/dashboard-admin/usuarios', icon: 'Users' },
      { name: 'Configuración', href: '/dashboard-admin/configuracion', icon: 'Settings' },
    ],
  },
  header: {
    title: 'Panel de Administración',
    subtitle: 'Admin',
  },
} as const

