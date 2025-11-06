// Servicio de autenticación para conectar con el backend
// URL del backend: Railway (producción) o local
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alertrace-backend-production-fd22.up.railway.app'

// Log para verificar la URL en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 Backend URL:', API_BASE_URL)
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user_id: string
  user_type?: 'trabajador' | 'empresa'
}

export interface RegisterResponse {
  message: string
  user_id: string
  user_type?: 'trabajador' | 'empresa'
}

export interface UserData {
  id: string
  email: string
  user_type: 'trabajador' | 'empresa'
  nombre?: string
  apellidos?: string
  nombre_empresa?: string
  ruc?: string
  dni?: string
  telefono?: string
}

class AuthService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  // Login con email y contraseña
  async login(email: string, password: string, tipoUsuario: 'industria' | 'agricultor'): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email, // El backend puede esperar 'username' o 'email'
        password,
        user_type: tipoUsuario === 'industria' ? 'empresa' : 'trabajador',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de autenticación' }))
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  // Registro de nuevo usuario
  async register(data: {
    email: string
    password: string
    tipoUsuario: 'industria' | 'agricultor'
    // Campos para industria
    nombreEmpresa?: string
    ruc?: string
    // Campos para agricultor
    nombres?: string
    apellidos?: string
    dni?: string
    // Campos compartidos
    telefono?: string
  }): Promise<RegisterResponse> {
    const payload: any = {
      email: data.email,
      password: data.password,
      user_type: data.tipoUsuario === 'industria' ? 'empresa' : 'trabajador',
    }

    if (data.tipoUsuario === 'industria') {
      payload.nombre_empresa = data.nombreEmpresa
      payload.ruc = data.ruc
      payload.telefono = data.telefono
    } else {
      payload.nombres = data.nombres
      payload.apellidos = data.apellidos
      payload.dni = data.dni
      payload.telefono = data.telefono
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error en el registro' }))
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  // Obtener información del usuario actual
  async getCurrentUser(token: string): Promise<UserData> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  // Verificar token
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }

  // Recuperar contraseña
  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al enviar email' }))
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    }

    await response.json()
  }

  // Resetear contraseña
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al resetear contraseña' }))
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    }

    await response.json()
  }
}

export const authService = new AuthService()

