'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Factory, 
  Sprout,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Building2,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import LottieAnimation from '@/components/LottieAnimation'
import { authService } from '@/lib/auth'

interface FormData {
  // Campos para Industria
  nombreEmpresa?: string
  ruc?: string
  // Campos para Agricultor
  nombres?: string
  apellidos?: string
  dni?: string
  // Campos compartidos
  email: string
  telefono?: string
  password: string
  confirmPassword: string
  tipoUsuario: 'industria' | 'agricultor'
}

export default function RegistroPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    nombreEmpresa: '',
    ruc: '',
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    tipoUsuario: 'industria'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  // Colores dinámicos según el tipo de usuario
  const getThemeColors = () => {
    if (formData.tipoUsuario === 'industria') {
      return {
        primary: 'blue',
        primaryHex: '#2563eb',
        primaryDark: '#1d4ed8',
        primaryLight: '#dbeafe',
        primaryText: 'text-blue-600',
        primaryBg: 'bg-blue-50',
        primaryBorder: 'border-blue-200',
        primaryRing: 'ring-blue-500',
        primaryHover: 'hover:text-blue-800',
        primaryFocus: 'focus:ring-blue-500'
      }
    } else {
      return {
        primary: 'green',
        primaryHex: '#16a34a',
        primaryDark: '#15803d',
        primaryLight: '#dcfce7',
        primaryText: 'text-green-600',
        primaryBg: 'bg-green-50',
        primaryBorder: 'border-green-200',
        primaryRing: 'ring-green-500',
        primaryHover: 'hover:text-green-800',
        primaryFocus: 'focus:ring-green-500'
      }
    }
  }

  const colors = getThemeColors()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {}

    if (step === 1) {
      if (formData.tipoUsuario === 'industria') {
        if (!formData.nombreEmpresa?.trim()) {
          newErrors.nombreEmpresa = 'El nombre de la empresa es requerido'
        }
        if (!formData.ruc?.trim()) {
          newErrors.ruc = 'El RUC es requerido'
        } else if (!/^\d{11}$/.test(formData.ruc.replace(/\D/g, ''))) {
          newErrors.ruc = 'El RUC debe tener 11 dígitos'
        }
      } else {
        // Agricultor - Paso 1: Nombres y Apellidos
        if (!formData.nombres?.trim()) {
          newErrors.nombres = 'Los nombres son requeridos'
        }
        if (!formData.apellidos?.trim()) {
          newErrors.apellidos = 'Los apellidos son requeridos'
        }
      }
    }

    if (step === 2) {
      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido'
      }
      // Teléfono es opcional, no se valida
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida'
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = (): boolean => {
    return validateStep(1) && validateStep(2) && validateStep(3)
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleGoogleSignIn = async () => {
    try {
      // TODO: Implementar autenticación con Google
      // Por ahora redirigir al dashboard agricultor
      localStorage.setItem('token', 'google-token-demo')
      localStorage.setItem('userType', 'agricultor')
      router.push('/dashboard-agricultor')
    } catch (error) {
      console.error('Error en autenticación con Google:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setRegisterError('')
    
    try {
      // Registrar usuario en el backend
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        tipoUsuario: formData.tipoUsuario,
        nombreEmpresa: formData.nombreEmpresa,
        ruc: formData.ruc,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni,
        telefono: formData.telefono,
      })

      // Después del registro, hacer login automático
      const loginResponse = await authService.login(
        formData.email,
        formData.password,
        formData.tipoUsuario
      )
      
      // Guardar token y datos del usuario
      localStorage.setItem('token', loginResponse.access_token)
      localStorage.setItem('userType', formData.tipoUsuario)
      localStorage.setItem('userEmail', formData.email)
      if (loginResponse.user_id) {
        localStorage.setItem('userId', loginResponse.user_id)
      }
      
      const userName = formData.tipoUsuario === 'industria' 
        ? formData.nombreEmpresa || '' 
        : `${formData.nombres || ''} ${formData.apellidos || ''}`.trim()
      localStorage.setItem('userName', userName)
      
      // Redirigir según el tipo de usuario
      if (formData.tipoUsuario === 'industria') {
        router.push('/dashboard-empresa')
      } else {
        router.push('/dashboard-agricultor')
      }
    } catch (error: any) {
      console.error('Error en el registro:', error)
      setRegisterError(error.message || 'Error al registrar usuario. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#81D4FF] dark:from-gray-900 dark:to-gray-800">
        <div className="w-full h-full flex gap-8 items-stretch p-8">
          {/* Columna de animación */}
          <div className="w-full hidden lg:block">
            <LottieAnimation
              className="w-full h-full"
            />
          </div>

        {/* Columna del formulario */}
        <div className="w-full lg:w-fit h-full flex flex-col gap-6 justify-center mx-auto max-w-md lg:max-w-none">
          {/* Botón de regreso */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 dark:text-white dark:hover:text-white/80 transition-colors text-lg font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          {/* Tarjeta de registro */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full lg:w-[448px] flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crear Cuenta
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Únete a la plataforma AlerTrace
            </p>
          </div>

          {/* Mensaje de error */}
          {registerError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{registerError}</p>
            </div>
          )}

          {/* Indicador de pasos */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`flex items-center ${step === 3 ? '' : 'flex-1'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step
                      ? `${colors.primary === 'blue' ? 'bg-blue-600 border-blue-600' : 'bg-green-600 border-green-600'} text-white`
                      : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{step}</span>
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-0.5 ${
                      currentStep > step
                        ? colors.primary === 'blue' ? 'bg-blue-600' : 'bg-green-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Paso {currentStep} de 3
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Usuario - Mostrar siempre al inicio */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Usuario
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoUsuario: 'industria' }))}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.tipoUsuario === 'industria'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Factory className={`h-6 w-6 ${
                      formData.tipoUsuario === 'industria' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Industria
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Planta de producción
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoUsuario: 'agricultor' }))}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.tipoUsuario === 'agricultor'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Sprout className={`h-6 w-6 ${
                      formData.tipoUsuario === 'agricultor' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Agricultor
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Campo agrícola
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Paso 1: Campos según tipo de usuario */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {formData.tipoUsuario === 'industria' ? (
                  <>
                    {/* Campos para Industria */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="nombreEmpresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre de Empresa
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="nombreEmpresa"
                          name="nombreEmpresa"
                          value={formData.nombreEmpresa || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                            errors.nombreEmpresa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Nombre de tu empresa"
                        />
                      </div>
                      {errors.nombreEmpresa && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.nombreEmpresa}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="ruc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        RUC
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="ruc"
                          name="ruc"
                          value={formData.ruc || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 11) {
                              setFormData(prev => ({ ...prev, ruc: value }))
                              if (errors.ruc) {
                                setErrors(prev => ({ ...prev, ruc: undefined }))
                              }
                            }
                          }}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                            errors.ruc ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="12345678901"
                          maxLength={11}
                        />
                      </div>
                      {errors.ruc && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.ruc}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Campos para Agricultor - Paso 1: Nombres y Apellidos */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombres
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="nombres"
                          name="nombres"
                          value={formData.nombres || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                            errors.nombres ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Nombres"
                        />
                      </div>
                      {errors.nombres && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.nombres}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Apellidos
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="apellidos"
                          name="apellidos"
                          value={formData.apellidos || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                            errors.apellidos ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Apellidos"
                        />
                      </div>
                      {errors.apellidos && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.apellidos}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Paso 2: Email y Teléfono */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.tipoUsuario === 'agricultor' ? 'Correo Electrónico' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.tipoUsuario === 'agricultor' ? 'Número de teléfono' : 'Teléfono'} 
                    {formData.tipoUsuario === 'industria' && <span className="text-gray-500 dark:text-gray-400"> (Opcional)</span>}
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="+51 999 999 999"
                  />
                </div>
              </div>
            )}

            {/* Paso 3: Contraseñas */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.tipoUsuario === 'agricultor' ? 'Contraseña' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.tipoUsuario === 'agricultor' ? 'Verificar contraseña' : 'Confirmar Contraseña'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 ${colors.primaryFocus} focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={formData.tipoUsuario === 'agricultor' ? 'Verifica tu contraseña' : 'Repite tu contraseña'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Anterior
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className={`flex-1 px-4 py-3 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                      colors.primary === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    Siguiente
                    <ArrowRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                      colors.primary === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Crear Cuenta
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Botón de Google - Solo para agricultor en paso 1 */}
              {currentStep === 1 && formData.tipoUsuario === 'agricultor' && (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        O
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Continuar con Google
                    </span>
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Enlace a login */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className={`${colors.primaryText} ${colors.primaryHover} font-medium`}>
                Iniciar sesión
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}