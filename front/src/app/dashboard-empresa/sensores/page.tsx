'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Eye,
  Settings,
  Activity,
  Thermometer,
  Droplets,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  X,
  Play,
  Pause,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { SensorResponse as APISensorData } from '@/types'
import { SectionHeader } from '@/components/dashboard/base/SectionHeader'

// NODO PROMPT: AREAS_GESTION - Página de gestión de áreas de producción

interface Area {
  id: string
  nombre: string
  descripcion: string
  color: string
  ubicacion: string
  responsable: string
  fechaCreacion: Date
  estado: 'activa' | 'inactiva' | 'mantenimiento'
  sensores: Sensor[]
  ultimaActividad?: Date
}

interface Sensor {
  id: string
  nombre: string
  tipo: 'temperatura' | 'humedad' | 'ph' | 'presion' | 'flujo' | 'nivel' | 'personalizado' | 'multisensor'
  tipos?: ('temperatura' | 'humedad' | 'ph' | 'personalizado')[] // Todos los tipos seleccionados
  unidad: string
  valorActual?: number
  estado: 'activo' | 'inactivo' | 'mantenimiento' | 'error'
  ultimaLectura?: Date
  limites: {
    min: number
    max: number
  }
  limitesCompletos?: Record<string, { min: number; max: number }> // Límites para todos los tipos
  unidadesPersonalizadas?: Record<string, string> // Unidades personalizadas
}



// Eliminado badge de estado en card; no se requiere mapeo de estados

const tiposSensor = {
  temperatura: { icon: Thermometer, color: 'text-red-500' },
  humedad: { icon: Droplets, color: 'text-blue-500' },
  ph: { icon: Activity, color: 'text-green-500' },
  presion: { icon: BarChart3, color: 'text-purple-500' },
  flujo: { icon: Zap, color: 'text-yellow-500' },
  nivel: { icon: BarChart3, color: 'text-indigo-500' },
  personalizado: { icon: Settings, color: 'text-gray-500' },
  // Tipos que vienen de la API
  multisensor: { icon: Activity, color: 'text-orange-500' },
  radiacion: { icon: Zap, color: 'text-yellow-500' },
  // Fallback para tipos desconocidos
  default: { icon: Settings, color: 'text-gray-500' }
}

export default function AreasEmpresaPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [sensoresSinArea, setSensoresSinArea] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null)
  const [errorFormularioArea, setErrorFormularioArea] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#8B5CF6',
    ubicacion: '',
    responsable: ''
  })
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false)
  const [areaParaEliminar, setAreaParaEliminar] = useState<Area | null>(null)
  const [moverSensoresA, setMoverSensoresA] = useState<string>('')
  const [mostrarConfirmEliminarSensor, setMostrarConfirmEliminarSensor] = useState(false)
  const [sensorParaEliminar, setSensorParaEliminar] = useState<{ sensor: Sensor; areaId: string | null } | null>(null)
  const [mostrarModalSensor, setMostrarModalSensor] = useState(false)
  const [isDraggingOverNoArea, setIsDraggingOverNoArea] = useState(false)
  const [isDraggingFromArea, setIsDraggingFromArea] = useState(false)
  const [draggedSensorId, setDraggedSensorId] = useState<string | null>(null)
  const [draggedFromAreaId, setDraggedFromAreaId] = useState<string | null>(null)
  const dropProcessedRef = useRef(false)
  const [sensorEditando, setSensorEditando] = useState<{ sensor: Sensor; areaId: string | null } | null>(null)
  const [errorFormularioSensor, setErrorFormularioSensor] = useState<string | null>(null)
  const [formDataSensor, setFormDataSensor] = useState<{
    nombre: string
    tipos: ('temperatura' | 'humedad' | 'ph' | 'personalizado')[]
    limites: Record<string, { min: number | ''; max: number | '' }>
    unidadesPersonalizadas: Record<string, string>
    ubicacion: string
    device_id: string
  }>({
    nombre: '',
    tipos: [],
    limites: {},
    unidadesPersonalizadas: {},
    ubicacion: '',
    device_id: ''
  })

  const areasFiltradas = areas.filter(area => {
    const coincideEstado = filtroEstado === 'todos' || area.estado === filtroEstado
    const coincideBusqueda = busqueda === '' || 
      area.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.responsable.toLowerCase().includes(busqueda.toLowerCase())
    
    return coincideEstado && coincideBusqueda
  })

  // Cargar datos reales de sensores y crear áreas basadas en ubicaciones
  const cargarDatos = async () => {
    try {
      // COMENTADO PARA MAQUETAR SIN BACKEND
      // const response = await api.sensors.getSensors() as any
      const response = [] as any[] // Mock vacío para maquetear
      
      if (response && Array.isArray(response)) {
        const sensoresData = response as APISensorData[]
        
        // Procesar datos para el mapa de áreas
        const areasMap = new Map()
        
        const sensoresSinAsignar: Sensor[] = []
        
        sensoresData.forEach((sensor: APISensorData) => {
          const sensorObj: Sensor = {
            id: sensor.id_sensor.toString(),
            nombre: sensor.nombre,
            tipo: sensor.tipo as any,
            unidad: obtenerUnidadSensor(sensor.tipo),
            valorActual: 0, // Los valores de lectura vienen de otro endpoint
            estado: sensor.activo ? 'activo' : 'inactivo',
            ultimaLectura: sensor.ultima_lectura ? new Date(sensor.ultima_lectura) : new Date(),
            limites: { min: 0, max: 100 }
          }
          
          // Si el sensor no tiene ubicación asignada, agregarlo a sensores sin área
          if (!sensor.ubicacion_sensor) {
            sensoresSinAsignar.push(sensorObj)
            return
          }
          
          const ubicacion = sensor.ubicacion_sensor
          
          if (!areasMap.has(ubicacion)) {
            areasMap.set(ubicacion, {
              id: ubicacion,
              nombre: ubicacion,
              descripcion: `Área de ${ubicacion}`,
              color: '#8B5CF6',
              ubicacion: ubicacion,
              responsable: 'Asignado automáticamente',
              fechaCreacion: new Date(),
              estado: 'activa' as const,
              sensores: [],
              ultimaActividad: new Date(),
            })
          }
          
          const area = areasMap.get(ubicacion)
          area.sensores.push({
            ...sensorObj,
            tipos: sensorObj.tipo === 'multisensor' ? [] : [sensorObj.tipo as any], // Si es multisensor, necesitamos los tipos originales
            limitesCompletos: { [sensorObj.tipo]: sensorObj.limites } // Guardar límites del tipo principal
          })
        })
        
        const areasArray = Array.from(areasMap.values())
        setAreas(areasArray)
        setSensoresSinArea(sensoresSinAsignar)
      } else {
        setError('No se pudieron cargar los sensores')
      }
    } catch (error) {
      setError('Error al cargar las áreas')
    } finally {
      setLoading(false)
    }
  }

  const obtenerUnidadSensor = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'temperatura': return '°C'
      case 'humedad_aire':
      case 'humedad_suelo': 
      case 'humedad': return '%'
      case 'ph_suelo':
      case 'ph': return 'pH'
      case 'radiacion_solar':
      case 'radiacion': return 'W/m²'
      case 'nutrientes': return 'ppm'
      case 'presion': return 'Pa'
      case 'flujo': return 'L/min'
      case 'nivel': return 'm'
      case 'multisensor': return ''
      case 'personalizado': return ''
      default: return ''
    }
  }

  const obtenerConfigSensor = (tipo: string) => {
    const tipoNormalizado = tipo.toLowerCase()
    const config = (tiposSensor as any)[tipoNormalizado]
    return config || tiposSensor.default
  }

  const obtenerValorSensor = (sensor: APISensorData, tipo: string): number => {
    // Los valores de lecturas vienen de otro endpoint separado
    return 0
  }

  const hexToRgba = (hex: string, alpha: number) => {
    try {
      let c = hex.replace('#', '')
      if (c.length === 3) {
        c = c.split('').map((ch) => ch + ch).join('')
      }
      const r = parseInt(c.substring(0, 2), 16)
      const g = parseInt(c.substring(2, 4), 16)
      const b = parseInt(c.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } catch {
      return `rgba(59, 130, 246, ${alpha})` // fallback azul
    }
  }

  // Funciones helper


  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resetear la referencia cuando se inicia un drag
  useEffect(() => {
    if (isDraggingFromArea && draggedSensorId) {
      dropProcessedRef.current = false
    }
  }, [isDraggingFromArea, draggedSensorId])

  const createArea = async (areaData: Partial<Area>) => {
    // TODO: Implementar creación de área
    console.log('API: Creating area...', areaData)
  }

  const updateArea = async (id: string, areaData: Partial<Area>) => {
    // TODO: Implementar actualización de área
    console.log('API: Updating area...', id, areaData)
  }

  const deleteArea = async (id: string) => {
    // TODO: Implementar eliminación de área
    console.log('API: Deleting area...', id)
  }

  const estadisticas = {
    total: areas.length,
    activas: areas.filter(a => a.estado === 'activa').length,
    enMantenimiento: areas.filter(a => a.estado === 'mantenimiento').length,
    totalSensores: areas.reduce((acc, area) => acc + area.sensores.length, 0)
  }

  const handleEliminarSensor = (sensorId: string, areaId: string | null) => {
    if (areaId) {
      const area = areas.find(a => a.id === areaId)
      const sensor = area?.sensores.find(s => s.id === sensorId)
      if (!sensor) return
      setSensorParaEliminar({ sensor, areaId })
      setMostrarConfirmEliminarSensor(true)
    } else {
      const sensor = sensoresSinArea.find(s => s.id === sensorId)
      if (!sensor) return
      setSensorParaEliminar({ sensor, areaId: null })
      setMostrarConfirmEliminarSensor(true)
    }
  }

  const confirmarEliminarSensor = () => {
    if (!sensorParaEliminar) return
    
    const { sensor, areaId } = sensorParaEliminar
    
    if (areaId) {
      setAreas(prevAreas => {
        const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
        const area = areasCopy.find(a => a.id === areaId)
        if (!area) return prevAreas
        area.sensores = area.sensores.filter(s => s.id !== sensor.id)
        return areasCopy
      })
    } else {
      setSensoresSinArea(prev => prev.filter(s => s.id !== sensor.id))
    }
    
    setMostrarConfirmEliminarSensor(false)
    setSensorParaEliminar(null)
  }

  const cambiarEstadoSensor = (sensorId: string, nuevoEstado: 'activo' | 'inactivo' | 'mantenimiento' | 'error', areaId: string | null) => {
    if (areaId) {
      setAreas(prevAreas => {
        const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
        const area = areasCopy.find(a => a.id === areaId)
        if (!area) return prevAreas
        const sensor = area.sensores.find(s => s.id === sensorId)
        if (sensor) {
          sensor.estado = nuevoEstado
        }
        return areasCopy
      })
    } else {
      setSensoresSinArea(prev => {
        const sensoresCopy = [...prev]
        const sensor = sensoresCopy.find(s => s.id === sensorId)
        if (sensor) {
          sensor.estado = nuevoEstado
        }
        return sensoresCopy
      })
    }
    
    // COMENTADO PARA MAQUETAR SIN BACKEND
    // try {
    //   await api.sensors.updateSensor(sensorId, { estado: nuevoEstado })
    // } catch (error) {
    //   console.error('Error al actualizar estado del sensor:', error)
    //   // Revertir cambio en caso de error
    //   // ... lógica de reversión
    // }
  }

  const moveSensor = async (sensorId: string, fromAreaId: string | null, toAreaId: string) => {
    if (!sensorId || !toAreaId || fromAreaId === toAreaId) return
    
    const toArea = areas.find(a => a.id === toAreaId)
    if (!toArea) return
    
    let sensorToMove: Sensor | null = null
    
    // Si viene de un área, buscar el sensor en esa área
    if (fromAreaId) {
      const fromArea = areas.find(a => a.id === fromAreaId)
      if (!fromArea) return
      
      const sensorIndex = fromArea.sensores.findIndex(s => s.id === sensorId)
      if (sensorIndex < 0) return
      sensorToMove = fromArea.sensores[sensorIndex]
      
      // Actualizar UI: mover de área a área
      setAreas(prevAreas => {
        const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
        const from = areasCopy.find(a => a.id === fromAreaId)
        const to = areasCopy.find(a => a.id === toAreaId)
        if (!from || !to) return prevAreas
        const index = from.sensores.findIndex(s => s.id === sensorId)
        if (index < 0) return prevAreas
        const [sensor] = from.sensores.splice(index, 1)
        to.sensores.push(sensor)
        return areasCopy
      })
    } else {
      // Si viene de sensores sin área, moverlo a un área
      const sensorIndex = sensoresSinArea.findIndex(s => s.id === sensorId)
      if (sensorIndex < 0) return
      sensorToMove = sensoresSinArea[sensorIndex]
      
      // Actualizar UI: mover de sin área a área
      setSensoresSinArea(prev => prev.filter(s => s.id !== sensorId))
      setAreas(prevAreas => {
        const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
        const to = areasCopy.find(a => a.id === toAreaId)
        if (!to) return prevAreas
        to.sensores.push(sensorToMove!)
        return areasCopy
      })
    }
    
    // COMENTADO PARA MAQUETAR SIN BACKEND
    // Persistir en backend
    // try {
    //   await api.sensors.updateSensor(sensorId, { ubicacion_sensor: toArea.ubicacion })
    // } catch (error) {
    //   console.error('Error al mover sensor:', error)
    //   // Revertir cambio en caso de error
    //   if (fromAreaId) {
    //     setAreas(prevAreas => {
    //       const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
    //       const from = areasCopy.find(a => a.id === fromAreaId)
    //       const to = areasCopy.find(a => a.id === toAreaId)
    //       if (!from || !to) return prevAreas
    //       const index = to.sensores.findIndex(s => s.id === sensorId)
    //       if (index < 0) return prevAreas
    //       const [sensor] = to.sensores.splice(index, 1)
    //       from.sensores.push(sensor)
    //       return areasCopy
    //     })
    //   } else {
    //     setSensoresSinArea(prev => [...prev, sensorToMove!])
    //     setAreas(prevAreas => {
    //       const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
    //       const to = areasCopy.find(a => a.id === toAreaId)
    //       if (!to) return prevAreas
    //       const index = to.sensores.findIndex(s => s.id === sensorId)
    //       if (index >= 0) to.sensores.splice(index, 1)
    //       return areasCopy
    //     })
    //   }
      //   alert('Error al mover el sensor. Por favor, intenta nuevamente.')
      // }
  }

  const moveSensorToNoArea = async (sensorId: string, fromAreaId: string) => {
    if (!sensorId || !fromAreaId) return
    
    const fromArea = areas.find(a => a.id === fromAreaId)
    if (!fromArea) return
    
    const sensorIndex = fromArea.sensores.findIndex(s => s.id === sensorId)
    if (sensorIndex < 0) return
    
    const sensorToMove = fromArea.sensores[sensorIndex]
    
    // Actualizar UI: mover de área a sin área
    setAreas(prevAreas => {
      const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
      const from = areasCopy.find(a => a.id === fromAreaId)
      if (!from) return prevAreas
      const index = from.sensores.findIndex(s => s.id === sensorId)
      if (index < 0) return prevAreas
      from.sensores.splice(index, 1)
      return areasCopy
    })
    
    setSensoresSinArea(prev => [...prev, sensorToMove])
    
    // COMENTADO PARA MAQUETAR SIN BACKEND
    // Persistir en backend
    // try {
    //   await api.sensors.updateSensor(sensorId, { ubicacion_sensor: null })
    // } catch (error) {
    //   console.error('Error al mover sensor a sin área:', error)
    //   // Revertir cambio en caso de error
    //   setSensoresSinArea(prev => prev.filter(s => s.id !== sensorId))
    //   setAreas(prevAreas => {
    //     const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
    //     const from = areasCopy.find(a => a.id === fromAreaId)
    //     if (!from) return prevAreas
    //     from.sensores.push(sensorToMove)
    //     return areasCopy
    //   })
    //   alert('Error al mover el sensor. Por favor, intenta nuevamente.')
    // }
  }

  const handleCrearArea = () => {
    setAreaSeleccionada(null)
    setErrorFormularioArea(null)
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#8B5CF6',
      ubicacion: '',
      responsable: ''
    })
    setMostrarModal(true)
  }

  const handleEditarArea = (area: Area) => {
    setAreaSeleccionada(area)
    setErrorFormularioArea(null)
    setFormData({
      nombre: area.nombre,
      descripcion: area.descripcion,
      color: area.color,
      ubicacion: area.ubicacion,
      responsable: area.responsable
    })
    setMostrarModal(true)
  }

  const handleGuardarArea = async () => {
    // Limpiar errores previos
    setErrorFormularioArea(null)

    // Validar nombre
    if (!formData.nombre.trim()) {
      setErrorFormularioArea('El nombre del área es requerido')
      return
    }

    // Validar ubicación
    if (!formData.ubicacion.trim()) {
      setErrorFormularioArea('La ubicación del área es requerida')
      return
    }

    // Validar que no exista otra área con la misma ubicación (excepto la actual si se está editando)
    const areaExistente = areas.find(a => 
      a.ubicacion.toLowerCase() === formData.ubicacion.trim().toLowerCase() && 
      a.id !== (areaSeleccionada?.id || '')
    )
    if (areaExistente) {
      setErrorFormularioArea(`Ya existe un área con la ubicación "${formData.ubicacion}". Por favor, usa una ubicación diferente.`)
      return
    }

    if (areaSeleccionada) {
      // Actualizar área existente - renombrar ubicación de todos los sensores
      const ubicacionAnterior = areaSeleccionada.ubicacion
      const ubicacionNueva = formData.ubicacion
      
      // COMENTADO PARA MAQUETAR SIN BACKEND
      // Si cambió la ubicación, mover todos los sensores en el backend
      // if (ubicacionAnterior !== ubicacionNueva && areaSeleccionada.sensores.length > 0) {
      //   try {
      //     await api.sensors.moveSensors(ubicacionAnterior, ubicacionNueva)
      //   } catch (error) {
      //     console.error('Error al actualizar área:', error)
      //     alert('Error al actualizar el área. Por favor, intenta nuevamente.')
      //     return
      //   }
      // }
      
      // Actualizar UI
      setAreas(prevAreas => prevAreas.map(area => 
        area.id === areaSeleccionada.id 
          ? {
              ...area,
              id: formData.ubicacion, // El ID es la ubicación
              nombre: formData.nombre,
              descripcion: formData.descripcion,
              color: formData.color,
              ubicacion: formData.ubicacion,
              responsable: formData.responsable
            }
          : area
      ))
    } else {
      // Crear nueva área (solo en frontend, no requiere backend aún)
      // El ID es la ubicación para mantener consistencia
      const nuevaArea: Area = {
        id: formData.ubicacion,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        color: formData.color,
        ubicacion: formData.ubicacion,
        responsable: formData.responsable,
        fechaCreacion: new Date(),
        estado: 'activa',
        sensores: [],
        ultimaActividad: new Date(),
      }
      setAreas(prev => [nuevaArea, ...prev])
    }
    
    setMostrarModal(false)
    setAreaSeleccionada(null)
    setErrorFormularioArea(null)
  }

  const handleEliminarArea = (id: string) => {
    const area = areas.find(a => a.id === id)
    if (!area) return
    setAreaParaEliminar(area)
    setMoverSensoresA('')
    setMostrarConfirmEliminar(true)
  }

  const confirmarEliminarArea = async () => {
    if (!areaParaEliminar) return
    
    // No permitir eliminar si hay sensores
    if (areaParaEliminar.sensores.length > 0) {
      return
    }

    const id = areaParaEliminar.id
    const area = areaParaEliminar

    // Actualizar UI primero (optimistic update)
    setAreas(prevAreas => prevAreas.filter(a => a.id !== id))
    setMostrarConfirmEliminar(false)
    setAreaParaEliminar(null)
    setMoverSensoresA('')

    // COMENTADO PARA MAQUETAR SIN BACKEND
    // try {
    //   await api.sensors.deleteArea(area.ubicacion)
    // } catch (error) {
    //   console.error('Error al eliminar área:', error)
    //   // Revertir cambio en caso de error
    //   setAreas(prevAreas => [...prevAreas, area])
    //   alert('Error al eliminar el área. Por favor, intenta nuevamente.')
    // }
  }

  const handleAbrirModalSensor = () => {
    setSensorEditando(null)
    setErrorFormularioSensor(null)
    setFormDataSensor({
      nombre: '',
      tipos: [],
      limites: {},
      unidadesPersonalizadas: {},
      ubicacion: areas.length > 0 ? areas[0].ubicacion : '',
      device_id: `DEV-${Date.now()}`
    })
    setMostrarModalSensor(true)
  }

  const handleEditarSensor = (sensor: Sensor, areaId: string | null) => {
    const tiposAMostrar = sensor.tipos && sensor.tipos.length > 0 ? sensor.tipos : [sensor.tipo]
    const limites: Record<string, { min: number | ''; max: number | '' }> = {}
    
    tiposAMostrar.forEach(tipo => {
      if (sensor.limitesCompletos?.[tipo]) {
        limites[tipo] = {
          min: sensor.limitesCompletos[tipo].min,
          max: sensor.limitesCompletos[tipo].max
        }
      } else {
        limites[tipo] = {
          min: sensor.limites.min,
          max: sensor.limites.max
        }
      }
    })

    setSensorEditando({ sensor, areaId })
    setErrorFormularioSensor(null)
    setFormDataSensor({
      nombre: sensor.nombre,
      tipos: tiposAMostrar as ('temperatura' | 'humedad' | 'ph' | 'personalizado')[],
      limites: limites,
      unidadesPersonalizadas: sensor.unidadesPersonalizadas || {},
      ubicacion: areaId || '',
      device_id: sensor.id
    })
    setMostrarModalSensor(true)
  }

  const toggleTipoSensor = (tipo: 'temperatura' | 'humedad' | 'ph' | 'personalizado') => {
    setFormDataSensor(prev => {
      const isSelected = prev.tipos.includes(tipo)
      const tipos = isSelected
        ? prev.tipos.filter(t => t !== tipo)
        : [...prev.tipos, tipo]
      
      // Si se deselecciona, eliminar sus límites
      // Si se selecciona, inicializar límites vacíos
      const limites = { ...prev.limites }
      if (isSelected) {
        delete limites[tipo]
      } else {
        limites[tipo] = { min: '', max: '' }
      }
      
      return { ...prev, tipos, limites }
    })
  }

  const updateLimite = (tipo: string, campo: 'min' | 'max', valor: string) => {
    setFormDataSensor(prev => {
      const limites = { ...prev.limites }
      if (!limites[tipo]) {
        limites[tipo] = { min: '', max: '' }
      }
      const numValor = valor === '' ? '' : Number(valor)
      limites[tipo] = {
        ...limites[tipo],
        [campo]: numValor
      }
      return { ...prev, limites }
    })
  }

  const updateUnidadPersonalizada = (tipo: string, unidad: string) => {
    setFormDataSensor(prev => {
      const unidadesPersonalizadas = { ...prev.unidadesPersonalizadas }
      unidadesPersonalizadas[tipo] = unidad
      return { ...prev, unidadesPersonalizadas }
    })
  }

  const handleGuardarSensor = async () => {
    // Limpiar errores previos
    setErrorFormularioSensor(null)

    // Validar nombre
    if (!formDataSensor.nombre.trim()) {
      setErrorFormularioSensor('El nombre del sensor es requerido')
      return
    }

    // Validar que se haya seleccionado al menos un tipo de sensor
    if (formDataSensor.tipos.length === 0) {
      setErrorFormularioSensor('Debes seleccionar al menos un tipo de sensor para continuar')
      return
    }

    // Validar que todos los tipos seleccionados tengan límites definidos
    for (const tipo of formDataSensor.tipos) {
      const limite = formDataSensor.limites[tipo]
      if (!limite || limite.min === '' || limite.max === '') {
        const tipoLabels: Record<string, string> = {
          temperatura: 'Temperatura',
          humedad: 'Humedad',
          ph: 'pH',
          personalizado: 'Personalizado'
        }
        setErrorFormularioSensor(`Debes definir los límites mínimo y máximo para el sensor de ${tipoLabels[tipo]}`)
        return
      }
      if (Number(limite.min) >= Number(limite.max)) {
        const tipoLabels: Record<string, string> = {
          temperatura: 'Temperatura',
          humedad: 'Humedad',
          ph: 'pH',
          personalizado: 'Personalizado'
        }
        setErrorFormularioSensor(`El valor mínimo debe ser menor que el máximo para el sensor de ${tipoLabels[tipo]}`)
        return
      }
      // Validar unidad personalizada si el tipo es personalizado
      if (tipo === 'personalizado' && !formDataSensor.unidadesPersonalizadas[tipo]?.trim()) {
        setErrorFormularioSensor('Debes definir la unidad de medida para el sensor personalizado')
        return
      }
    }

    try {
      // Si hay múltiples tipos, usar 'multisensor' como tipo principal
      // Si hay un solo tipo, usar ese tipo directamente
      const tipoPrincipal = formDataSensor.tipos.length > 1 
        ? 'multisensor' 
        : formDataSensor.tipos[0]

      const isEditing = sensorEditando !== null

      // Generar Device ID automáticamente solo si es nuevo
      const deviceId = isEditing ? sensorEditando.sensor.id : `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // COMENTADO PARA MAQUETAR SIN BACKEND
      // Intentar crear/actualizar sensor en backend (opcional - si falla, continuar de todas formas)
      // try {
      //   // Convertir límites a números para el backend
      //   const limitesNumericos: Record<string, { min: number; max: number }> = {}
      //   Object.keys(formDataSensor.limites).forEach(tipo => {
      //     const limite = formDataSensor.limites[tipo]
      //     limitesNumericos[tipo] = {
      //       min: Number(limite.min),
      //       max: Number(limite.max)
      //     }
      //   })

      //   if (isEditing) {
      //     await api.sensors.updateSensor(sensorEditando.sensor.id, {
      //       nombre: formDataSensor.nombre,
      //       tipo: tipoPrincipal,
      //       ubicacion_sensor: formDataSensor.ubicacion || undefined,
      //       limites: limitesNumericos
      //     })
      //   } else {
      //     await api.sensors.createSensor({
      //       device_id: deviceId,
      //       nombre: formDataSensor.nombre,
      //       tipo: tipoPrincipal,
      //       id_cultivo: 0,
      //       ubicacion_sensor: formDataSensor.ubicacion || undefined,
      //       intervalo_lectura: 60,
      //       limites: limitesNumericos
      //     })
      //   }
      // } catch (apiError) {
      //   // Si el backend no está disponible, continuamos de todas formas
      //   console.warn('Backend no disponible, el sensor se creará/actualizará solo en el frontend:', apiError)
      // }

      // Preparar datos del sensor
      const primerTipo = formDataSensor.tipos[0]
      const limitePrimerTipo = formDataSensor.limites[primerTipo]
      
      // Convertir todos los límites a números
      const limitesCompletos: Record<string, { min: number; max: number }> = {}
      formDataSensor.tipos.forEach(tipo => {
        const limite = formDataSensor.limites[tipo]
        if (limite) {
          limitesCompletos[tipo] = {
            min: Number(limite.min),
            max: Number(limite.max)
          }
        }
      })

      if (isEditing) {
        // Editar sensor existente
        const sensorActualizado: Sensor = {
          ...sensorEditando.sensor,
          nombre: formDataSensor.nombre,
          tipo: tipoPrincipal as any,
          tipos: formDataSensor.tipos,
          unidad: formDataSensor.tipos.includes('personalizado') 
            ? formDataSensor.unidadesPersonalizadas['personalizado'] || ''
            : obtenerUnidadSensor(tipoPrincipal),
          limites: limitePrimerTipo 
            ? { min: Number(limitePrimerTipo.min), max: Number(limitePrimerTipo.max) }
            : sensorEditando.sensor.limites,
          limitesCompletos: limitesCompletos,
          unidadesPersonalizadas: formDataSensor.unidadesPersonalizadas
        }

        const ubicacionAnterior = sensorEditando.areaId
        const ubicacionNueva = formDataSensor.ubicacion

        // Si cambió de área, mover el sensor
        if (ubicacionAnterior !== ubicacionNueva) {
          // Remover de la ubicación anterior
          if (ubicacionAnterior) {
            setAreas(prevAreas => {
              const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
              const areaAnterior = areasCopy.find(a => a.id === ubicacionAnterior)
              if (areaAnterior) {
                areaAnterior.sensores = areaAnterior.sensores.filter(s => s.id !== sensorActualizado.id)
              }
              return areasCopy
            })
          } else {
            setSensoresSinArea(prev => prev.filter(s => s.id !== sensorActualizado.id))
          }

          // Agregar a la nueva ubicación
          if (ubicacionNueva) {
            setAreas(prevAreas => {
              const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
              const areaNueva = areasCopy.find(a => a.ubicacion === ubicacionNueva)
              if (areaNueva) {
                areaNueva.sensores.push(sensorActualizado)
              }
              return areasCopy
            })
          } else {
            setSensoresSinArea(prev => [...prev, sensorActualizado])
          }
        } else {
          // Solo actualizar el sensor en su ubicación actual
          if (ubicacionAnterior) {
            setAreas(prevAreas => {
              const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
              const area = areasCopy.find(a => a.id === ubicacionAnterior)
              if (area) {
                const index = area.sensores.findIndex(s => s.id === sensorActualizado.id)
                if (index >= 0) {
                  area.sensores[index] = sensorActualizado
                }
              }
              return areasCopy
            })
          } else {
            setSensoresSinArea(prev => {
              const sensoresCopy = [...prev]
              const index = sensoresCopy.findIndex(s => s.id === sensorActualizado.id)
              if (index >= 0) {
                sensoresCopy[index] = sensorActualizado
              }
              return sensoresCopy
            })
          }
        }
      } else {
        // Crear nuevo sensor
        const nuevoSensor: Sensor = {
          id: `sensor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: formDataSensor.nombre,
          tipo: tipoPrincipal as any,
          tipos: formDataSensor.tipos,
          unidad: formDataSensor.tipos.includes('personalizado') 
            ? formDataSensor.unidadesPersonalizadas['personalizado'] || ''
            : obtenerUnidadSensor(tipoPrincipal),
          valorActual: 0,
          estado: 'activo',
          ultimaLectura: new Date(),
          limites: limitePrimerTipo 
            ? { min: Number(limitePrimerTipo.min), max: Number(limitePrimerTipo.max) }
            : { min: 0, max: 100 },
          limitesCompletos: limitesCompletos,
          unidadesPersonalizadas: formDataSensor.unidadesPersonalizadas
        }

        // Si no tiene área asignada, agregarlo a sensores sin área
        if (!formDataSensor.ubicacion) {
          setSensoresSinArea(prev => [...prev, nuevoSensor])
        } else {
          // Si tiene área, agregarlo a esa área
          setAreas(prevAreas => {
            const areasCopy = prevAreas.map(area => ({ ...area, sensores: [...area.sensores] }))
            const area = areasCopy.find(a => a.ubicacion === formDataSensor.ubicacion)
            if (area) {
              area.sensores.push(nuevoSensor)
            }
            return areasCopy
          })
        }
      }

      // Cerrar modal y limpiar formulario
      setMostrarModalSensor(false)
      setSensorEditando(null)
      setErrorFormularioSensor(null)
      setFormDataSensor({
        nombre: '',
        tipos: [],
        limites: {},
        unidadesPersonalizadas: {},
        ubicacion: '',
        device_id: ''
      })
    } catch (error) {
      console.error('Error al procesar sensor:', error)
      setErrorFormularioSensor('Error al procesar el sensor. Por favor, intenta nuevamente.')
    }
  }

  return (
    <>
      <style>{`
        .color-picker-scroll::-webkit-scrollbar {
          height: 3px;
        }
        .color-picker-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .color-picker-scroll::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
          border-radius: 2px;
        }
        .dark .color-picker-scroll::-webkit-scrollbar-thumb {
          background-color: #64748b;
        }
      `}</style>
      <div className="flex flex-col gap-6">
      {/* Header */}
      <SectionHeader
        icon={Activity}
        title="Sensores"
        description="Gestión modular de sensores organizados por áreas de producción"
        leftActions={(
          <>
          <button
              onClick={handleAbrirModalSensor}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Sensor
          </button>
          <button
            onClick={handleCrearArea}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Área
          </button>
          </>
        )}
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dashboard-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Áreas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="dashboard-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.activas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="dashboard-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.enMantenimiento}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="dashboard-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sensores</p>
              <p className="text-2xl font-bold text-purple-600">{estadisticas.totalSensores}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar áreas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="activa">Activas</option>
            <option value="inactiva">Inactivas</option>
            <option value="mantenimiento">En mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Estados de carga */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando sensores...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button 
            onClick={cargarDatos}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && areasFiltradas.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No hay sensores configurados aún.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Los sensores se agruparán automáticamente por área cuando se detecten.</p>
        </div>
      )}

      {/* Lista de áreas */}
      {!loading && !error && areasFiltradas.length > 0 && (
        <div 
          className="flex flex-wrap gap-6"
          onDrop={(e) => {
            // Este handler captura drops fuera de las áreas individuales
            // Solo procesar si no fue procesado por un área específica
            if (!dropProcessedRef.current && draggedSensorId && draggedFromAreaId && draggedFromAreaId !== '') {
              const target = e.target as HTMLElement
              // Verificar que no esté sobre un área
              const isOverArea = target.closest('[data-area-drop-zone]')
              if (!isOverArea) {
                e.preventDefault()
                dropProcessedRef.current = true
                moveSensorToNoArea(draggedSensorId, draggedFromAreaId)
                setDraggedSensorId(null)
                setDraggedFromAreaId(null)
                setIsDraggingFromArea(false)
                setIsDraggingOverNoArea(false)
              }
            }
          }}
          onDragOver={(e) => {
            // Permitir drop si estamos arrastrando desde un área
            if (isDraggingFromArea) {
              e.preventDefault()
            }
          }}
        >
          {areasFiltradas.map((area) => {
          
          return (
             <div
               key={area.id}
               className="dashboard-card border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col gap-4 min-w-[400px]"
               style={{
                 backgroundColor: hexToRgba(area.color, 0.06)
               }}
               data-area-drop-zone={area.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                dropProcessedRef.current = true
                setIsDraggingFromArea(false)
                setIsDraggingOverNoArea(false)
                setDraggedSensorId(null)
                setDraggedFromAreaId(null)
                const sensorId = e.dataTransfer.getData('sensorId')
                const fromAreaId = e.dataTransfer.getData('fromAreaId')
                if (sensorId) {
                  moveSensor(sensorId, fromAreaId || null, area.id)
                }
              }}
             >
              {/* Header del área */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Área {area.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {area.ubicacion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditarArea(area)}
                    className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEliminarArea(area.id)}
                    className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Descripción - solo se muestra si tiene contenido */}
              {area.descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                {area.descripcion}
              </p>
              )}

              {/* Sensores */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Sensores ({area.sensores.length})
                </h4>
                <div className="flex flex-col gap-3 w-full">
                  {area.sensores.length === 0 && (
                    <div
                      className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg text-sm"
                      style={{
                        borderColor: area.color,
                        backgroundColor: hexToRgba(area.color, 0.06),
                        color: hexToRgba(area.color, 0.9),
                      }}
                    >
                      Arrastra sensores aquí o asígnalos desde su tarjeta
                </div>
                  )}
                  {area.sensores.map((sensor) => {
                    const tiposAMostrar = sensor.tipos && sensor.tipos.length > 0 
                      ? sensor.tipos 
                      : [sensor.tipo]
                    const valorFormateado = sensor.valorActual !== undefined 
                      ? `${sensor.valorActual.toFixed(1)}${sensor.unidad}`
                      : 'N/A'
                    
                    return (
                      <div
                        key={sensor.id}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 w-full min-w-[336px] flex flex-col gap-3"
                        draggable
                        data-sensor-card={sensor.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('sensorId', sensor.id)
                          e.dataTransfer.setData('fromAreaId', area.id)
                          setIsDraggingFromArea(true)
                          setDraggedSensorId(sensor.id)
                          setDraggedFromAreaId(area.id)
                        }}
                        onDragEnd={(e) => {
                          // Pequeño delay para permitir que el evento drop global se procese primero
                          setTimeout(() => {
                            setIsDraggingFromArea(false)
                            setIsDraggingOverNoArea(false)
                            setDraggedSensorId(null)
                            setDraggedFromAreaId(null)
                          }, 100)
                        }}
                      >
                        {/* Header con nombre y botones */}
                        <div className="flex items-start justify-between gap-4">
                          <h5 className="text-base font-semibold text-gray-900 dark:text-white max-w-[130px] break-words line-clamp-2">
                            Sensor {sensor.nombre}
                          </h5>
                          <div className="flex items-start gap-2">
                            <div className="w-[140px] flex items-start justify-end">
                              {sensor.estado === 'activo' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    cambiarEstadoSensor(sensor.id, 'mantenimiento', area.id)
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  title="Cambiar a mantenimiento"
                                >
                                  <Play className="h-4 w-4 fill-current" />
                                  <span className="text-xs font-medium">Activo</span>
                                </button>
                              ) : sensor.estado === 'mantenimiento' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    cambiarEstadoSensor(sensor.id, 'activo', area.id)
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                  title="Cambiar a activo"
                                >
                                  <Pause className="h-4 w-4 fill-current" />
                                  <span className="text-xs font-medium">Mantenimiento</span>
                                </button>
                              ) : null}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditarSensor(sensor, area.id)
                              }}
                              className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarSensor(sensor.id, area.id)}
                              className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                </div>
              </div>

                        {/* Tipos de sensores con medida y estado */}
                        <div className="flex flex-col gap-2">
                          {tiposAMostrar.map((tipo) => {
                            const tipoConfig = obtenerConfigSensor(tipo)
                            const TipoIcon = tipoConfig.icon
                            const tipoColor = tipoConfig.color
                            const unidad = sensor.unidadesPersonalizadas?.[tipo] || obtenerUnidadSensor(tipo)
                            const limite = sensor.limitesCompletos?.[tipo]
                    
                    return (
                              <div
                                key={tipo}
                                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <TipoIcon className={`h-4 w-4 ${tipoColor}`} />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                                      {tipo}
                                    </span>
                        </div>
                                  {limite && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                                      Rango: {limite.min} - {limite.max}{unidad ? ` ${unidad}` : ''}
                        </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {valorFormateado}
                                  </span>
                                  {sensor.estado !== 'activo' && sensor.estado !== 'mantenimiento' && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      sensor.estado === 'inactivo'
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {sensor.estado === 'inactivo' ? 'Inactivo' : 'Error'}
                        </span>
                                  )}
                                </div>
                      </div>
                    )
                  })}
                    </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Acciones movidas al header */}
            </div>
          )
          })}
                    </div>
                  )}

      {/* Sección de sensores sin área asignada */}
      {!loading && !error && (
        <div 
          data-no-area-section="true"
          className={`mt-8 ${isDraggingOverNoArea ? 'bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4' : ''} transition-colors`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Solo mostrar feedback visual si estamos arrastrando desde un área
            if (isDraggingFromArea) {
              setIsDraggingOverNoArea(true)
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const relatedTarget = e.relatedTarget as HTMLElement
            const currentTarget = e.currentTarget as HTMLElement
            // Solo remover si realmente salimos del contenedor
            if (!currentTarget.contains(relatedTarget)) {
              setIsDraggingOverNoArea(false)
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dropProcessedRef.current = true
            setIsDraggingOverNoArea(false)
            setIsDraggingFromArea(false)
            setDraggedSensorId(null)
            setDraggedFromAreaId(null)
            
            const sensorId = e.dataTransfer.getData('sensorId')
            const fromAreaId = e.dataTransfer.getData('fromAreaId')
            
            // Solo procesar si viene de un área (no de la misma sección)
            if (sensorId && fromAreaId && fromAreaId !== '') {
              moveSensorToNoArea(sensorId, fromAreaId)
            }
          }}
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Sensores sin Área Asignada
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sensoresSinArea.length > 0 
                ? 'Arrastra estos sensores a un área para asignarlos, o arrastra sensores desde áreas aquí para desasignarlos'
                : 'Arrastra sensores desde áreas aquí para desasignarlos'
              }
            </p>
            {sensoresSinArea.length === 0 && (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center min-h-[150px] flex items-center justify-center transition-colors ${
                  isDraggingOverNoArea 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <MapPin className={`h-8 w-8 ${isDraggingOverNoArea ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDraggingOverNoArea ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isDraggingOverNoArea 
                      ? 'Suelta aquí para desasignar el sensor'
                      : 'Arrastra sensores aquí para desasignarlos de su área'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className={`flex flex-wrap gap-4 ${isDraggingOverNoArea && sensoresSinArea.length > 0 ? 'border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 rounded-lg p-4' : ''} transition-colors`}>
            {sensoresSinArea.map((sensor) => {
              const tiposAMostrar = sensor.tipos && sensor.tipos.length > 0 
                ? sensor.tipos 
                : [sensor.tipo]
              const valorFormateado = sensor.valorActual !== undefined 
                ? `${sensor.valorActual.toFixed(1)}${sensor.unidad}`
                : 'N/A'
              
              return (
                <div
                  key={sensor.id}
                  data-sensor-card={sensor.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-w-[336px] max-w-[400px] flex flex-col gap-3"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('sensorId', sensor.id)
                    e.dataTransfer.setData('fromAreaId', '')
                    setIsDraggingFromArea(false)
                    setDraggedSensorId(sensor.id)
                    setDraggedFromAreaId(null)
                  }}
                  onDragEnd={(e) => {
                    setTimeout(() => {
                      setIsDraggingFromArea(false)
                      setIsDraggingOverNoArea(false)
                      setDraggedSensorId(null)
                      setDraggedFromAreaId(null)
                    }, 100)
                  }}
                >
                  {/* Header con nombre y botones */}
                  <div className="flex items-start justify-between gap-4">
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white max-w-[130px] break-words line-clamp-2">
                      Sensor {sensor.nombre}
                    </h5>
                    <div className="flex items-start gap-2">
                      <div className="w-[140px] flex items-start justify-end">
                        {sensor.estado === 'activo' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cambiarEstadoSensor(sensor.id, 'mantenimiento', null)
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Cambiar a mantenimiento"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            <span className="text-xs font-medium">Activo</span>
                          </button>
                        ) : sensor.estado === 'mantenimiento' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cambiarEstadoSensor(sensor.id, 'activo', null)
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Cambiar a activo"
                          >
                            <Pause className="h-4 w-4 fill-current" />
                            <span className="text-xs font-medium">Mantenimiento</span>
                          </button>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditarSensor(sensor, null)
                        }}
                        className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarSensor(sensor.id, null)}
                        className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tipos de sensores con medida y estado */}
                  <div className="flex flex-col gap-2">
                    {tiposAMostrar.map((tipo) => {
                      const tipoConfig = obtenerConfigSensor(tipo)
                      const TipoIcon = tipoConfig.icon
                      const tipoColor = tipoConfig.color
                      const unidad = sensor.unidadesPersonalizadas?.[tipo] || obtenerUnidadSensor(tipo)
                      const limite = sensor.limitesCompletos?.[tipo]
                      
                      return (
                        <div
                          key={tipo}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-0"
                        >
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <TipoIcon className={`h-4 w-4 ${tipoColor} flex-shrink-0`} />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize whitespace-nowrap">
                                {tipo}
                              </span>
                            </div>
                            {limite && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-6 whitespace-nowrap">
                                Rango: {limite.min} - {limite.max}{unidad ? ` ${unidad}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {valorFormateado}
                            </span>
                            {sensor.estado !== 'activo' && sensor.estado !== 'mantenimiento' && (
                              <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                sensor.estado === 'inactivo'
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {sensor.estado === 'inactivo' ? 'Inactivo' : 'Error'}
                              </span>
                            )}
              </div>
            </div>
          )
          })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal para crear/editar área */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {areaSeleccionada ? 'Editar Área' : 'Nueva Área'}
            </h2>
              <button
                onClick={() => {
                  setMostrarModal(false)
                  setAreaSeleccionada(null)
                  setErrorFormularioArea(null)
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    color: '#8B5CF6',
                    ubicacion: '',
                    responsable: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mensaje de error */}
            {errorFormularioArea && (
              <div className="transition-all duration-200 ease-in-out">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Error de validación
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {errorFormularioArea}
                      </p>
                    </div>
                    <button
                      onClick={() => setErrorFormularioArea(null)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                      aria-label="Cerrar mensaje de error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Área
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Zona de Secado"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Descripción del área..."
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </label>
                <div className="px-2 -mx-2">
                  <div 
                    className="color-picker-scroll flex gap-3 overflow-x-auto scroll-smooth py-3"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#94a3b8 transparent',
                      msOverflowStyle: '-ms-autohiding-scrollbar'
                    }}
                  >
                    {[
                      '#8B5CF6', // Púrpura
                      '#06B6D4', // Cyan
                      '#14B8A6', // Teal
                      '#64748B', // Slate gris
                      '#EC4899', // Rosa
                      '#F97316', // Naranja
                      '#D946EF', // Magenta
                      '#0EA5E9'  // Sky
                    ].map((color) => (
                      <div key={color} className="flex-shrink-0 px-1">
                    <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                            formData.color === color 
                              ? 'border-gray-900 dark:border-white scale-110' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          style={{ 
                            backgroundColor: color,
                            boxShadow: formData.color === color 
                              ? '0 0 0 4px rgba(148, 163, 184, 0.2), 0 0 0 8px rgba(148, 163, 184, 0.1)' 
                              : 'none'
                          }}
                          title={color}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Planta Principal - Nivel 1"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Responsable
                </label>
                <input
                  type="text"
                  value={formData.responsable}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModal(false)
                  setAreaSeleccionada(null)
                  setErrorFormularioArea(null)
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    color: '#8B5CF6',
                    ubicacion: '',
                    responsable: ''
                  })
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarArea}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {areaSeleccionada ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {mostrarConfirmEliminar && areaParaEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Eliminar área
              </h2>
              <button
                onClick={() => {
                  setMostrarConfirmEliminar(false)
                  setAreaParaEliminar(null)
                  setMoverSensoresA('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {areaParaEliminar.sensores.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    No se puede eliminar el área <span className="font-semibold">"Área {areaParaEliminar.nombre}"</span> porque contiene sensores activos.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Acción requerida
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Esta área tiene {areaParaEliminar.sensores.length} sensor(es) asignado(s). Por favor, retira todos los sensores del área antes de eliminarla. Puedes mover los sensores arrastrándolos a otra área o eliminarlos individualmente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarConfirmEliminar(false)
                      setAreaParaEliminar(null)
                      setMoverSensoresA('')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                    Entendido
              </button>
            </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    ¿Estás seguro de que deseas eliminar el área <span className="font-semibold">"Área {areaParaEliminar.nombre}"</span>?
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          Esta acción no se puede deshacer
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          El área será eliminada permanentemente del sistema.
                        </p>
          </div>
        </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarConfirmEliminar(false)
                      setAreaParaEliminar(null)
                      setMoverSensoresA('')
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminarArea}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar área
                  </button>
                </div>
              </>
      )}
    </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de sensor */}
      {mostrarConfirmEliminarSensor && sensorParaEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Eliminar sensor
              </h2>
              <button
                onClick={() => {
                  setMostrarConfirmEliminarSensor(false)
                  setSensorParaEliminar(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <p className="text-base text-gray-700 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar el sensor <span className="font-semibold">"Sensor {sensorParaEliminar.sensor.nombre}"</span>?
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Esta acción no se puede deshacer
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Al eliminar este sensor, se dejará de dar seguimiento y monitoreo a sus lecturas. El dispositivo quedará desvinculado del sistema y no recibirás más alertas ni métricas relacionadas con este sensor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarConfirmEliminarSensor(false)
                  setSensorParaEliminar(null)
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarSensor}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar sensor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para añadir sensor */}
      {mostrarModalSensor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] flex flex-col gap-4">
            <div className="flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {sensorEditando ? 'Editar Sensor' : 'Añadir Sensor'}
              </h2>
              <button
                onClick={() => {
                  setMostrarModalSensor(false)
                  setSensorEditando(null)
                  setErrorFormularioSensor(null)
                  setFormDataSensor({
                    nombre: '',
                    tipos: [],
                    limites: {},
                    unidadesPersonalizadas: {},
                    ubicacion: '',
                    device_id: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mensaje de error */}
            {errorFormularioSensor && (
              <div className="flex-shrink-0 transition-all duration-200 ease-in-out">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Error de validación
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {errorFormularioSensor}
                      </p>
                    </div>
                    <button
                      onClick={() => setErrorFormularioSensor(null)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                      aria-label="Cerrar mensaje de error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Sensor
                </label>
                <input
                  type="text"
                  value={formDataSensor.nombre}
                  onChange={(e) => setFormDataSensor(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Sensor de Temperatura 01"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipos de Sensor (Selección Múltiple)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Selecciona uno o más tipos de sensores que incluirá este dispositivo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'temperatura', label: 'Temperatura', icon: Thermometer },
                    { value: 'humedad', label: 'Humedad', icon: Droplets },
                    { value: 'ph', label: 'pH', icon: Activity },
                    { value: 'personalizado', label: 'Personalizado', icon: Settings },
                  ].map((tipo) => {
                    const IconComponent = tipo.icon
                    const config = tiposSensor[tipo.value as keyof typeof tiposSensor] || tiposSensor.default
                    const isSelected = formDataSensor.tipos.includes(tipo.value as any)
                    
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => toggleTipoSensor(tipo.value as any)}
                        className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tipo.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {formDataSensor.tipos.length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {formDataSensor.tipos.length} tipo(s) seleccionado(s)
                  </p>
                )}
              </div>

              {/* Campos de límites para cada tipo seleccionado */}
              {formDataSensor.tipos.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-1 min-h-0 flex flex-col gap-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Límites de Medición
                  </label>
                  <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-1 min-h-0">
                  {formDataSensor.tipos.map((tipo) => {
                    const limite = formDataSensor.limites[tipo] || { min: '', max: '' }
                    const tipoConfig = tiposSensor[tipo as keyof typeof tiposSensor] || tiposSensor.default
                    const IconComponent = tipoConfig.icon
                    const tipoLabels: Record<string, string> = {
                      temperatura: 'Temperatura',
                      humedad: 'Humedad',
                      ph: 'pH',
                      personalizado: 'Personalizado'
                    }
                    
                    const unidadBase = obtenerUnidadSensor(tipo)
                    const unidadPersonalizada = formDataSensor.unidadesPersonalizadas[tipo] || ''
                    const unidad = tipo === 'personalizado' ? unidadPersonalizada : unidadBase
                    
                    return (
                      <div key={tipo} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${tipoConfig.color}`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {tipoLabels[tipo]}
                            {unidad && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({unidad})</span>}
                          </span>
                        </div>
                        
                        {/* Campo para unidad personalizada */}
                        {tipo === 'personalizado' && (
                          <div className="flex flex-col gap-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">
                              Unidad de Medida
                            </label>
                            <input
                              type="text"
                              value={unidadPersonalizada}
                              onChange={(e) => updateUnidadPersonalizada(tipo, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Ej: kg, m³, bar, etc."
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative flex flex-col gap-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">
                              Mínimo {unidad && <span className="text-gray-400">({unidad})</span>}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={limite.min}
                              onChange={(e) => updateLimite(tipo, 'min', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                          <div className="relative flex flex-col gap-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">
                              Máximo {unidad && <span className="text-gray-400">({unidad})</span>}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={limite.max}
                              onChange={(e) => updateLimite(tipo, 'max', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="100"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}

              <div className="flex-shrink-0 flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Área de Ubicación (Opcional)
                </label>
                <div className="relative">
                  <select
                    value={formDataSensor.ubicacion}
                    onChange={(e) => setFormDataSensor(prev => ({ ...prev, ubicacion: e.target.value }))}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    <option value="">Sin área asignada</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.ubicacion}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

            </div>
            
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setMostrarModalSensor(false)
                  setSensorEditando(null)
                  setErrorFormularioSensor(null)
                  setFormDataSensor({
                    nombre: '',
                    tipos: [],
                    limites: {},
                    unidadesPersonalizadas: {},
                    ubicacion: '',
                    device_id: ''
                  })
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarSensor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {sensorEditando ? 'Actualizar Sensor' : 'Crear Sensor'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
