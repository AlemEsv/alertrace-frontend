import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para autenticación
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    nombre?: string
    apellidos?: string
    nombre_empresa?: string
    tipo_usuario?: 'industria' | 'agricultor'
    ruc?: string
    dni?: string
    telefono?: string
  }
}

export interface AuthResponse {
  user: AuthUser | null
  session: any | null
  error: Error | null
}

// Funciones auxiliares para autenticación
export const authService = {
  // Registro con email y contraseña
  async signUp(email: string, password: string, metadata: {
    tipo_usuario: 'industria' | 'agricultor'
    nombre?: string
    apellidos?: string
    nombre_empresa?: string
    ruc?: string
    dni?: string
    telefono?: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      throw error
    }

    return {
      user: data.user,
      session: data.session,
    }
  },

  // Login con email y contraseña
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return {
      user: data.user,
      session: data.session,
    }
  },

  // Login con Google (OAuth)
  async signInWithGoogle(redirectTo?: string) {
    const redirectUrl = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard-agricultor` : '/dashboard-agricultor')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      throw error
    }

    return data
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }

    return user
  },

  // Obtener sesión actual
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    return session
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },
}

