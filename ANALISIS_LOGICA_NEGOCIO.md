# Análisis Completo de Lógica de Negocio - AlerTrace Frontend

## 📊 Definición de la Lógica de Negocio Principal

### Visión General del Sistema
**AlerTrace** es una plataforma de trazabilidad y monitoreo agrícola basada en IoT que permite a dos tipos principales de usuarios gestionar y monitorear sus operaciones:

1. **Usuarios Tipo Industria/Empresa**: Plantas de procesamiento que monitorean equipos, lotes de producción, y procesos industriales
2. **Usuarios Tipo Agricultor/Trabajador**: Productores agrícolas que monitorean cultivos, sensores de campo, y condiciones ambientales

### Arquitectura del Sistema

#### Frontend
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: localStorage para autenticación
- **Mapas**: Leaflet para visualización geográfica
- **Componentes UI**: Lucide React para iconos

#### Backend (API)
- **Base URL**: `http://localhost:8002` (desarrollo) o Railway (producción)
- **Autenticación**: JWT tokens con Bearer authentication
- **Endpoints principales**:
  - `/api/v1/auth/*` - Autenticación y gestión de usuarios
  - `/api/v1/sensores/*` - CRUD de sensores IoT
  - `/api/v1/cultivos/*` - Gestión de cultivos
  - `/api/v1/alertas/*` - Sistema de alertas
  - `/api/v1/dashboard/*` - Datos agregados

### Modelos de Datos Principales

#### 1. Sensores IoT
```typescript
interface SensorResponse {
  id_sensor: number
  device_id: string
  nombre: string
  tipo: 'temperatura' | 'humedad' | 'ph' | 'radiacion' | 'multisensor' | 'gps_tracker'
  id_empresa: number
  activo: boolean
  intervalo_lectura: number
  ultima_lectura?: Date
  bateria_nivel?: number
  ubicacion_sensor?: string
  coordenadas_lat?: number
  coordenadas_lng?: number
  fecha_instalacion: Date
}
```

#### 2. Cultivos
```typescript
interface CultivoResponse {
  id_cultivo: number
  tipo_cultivo: string
  variedad?: string
  hectareas: number
  fecha_siembra?: Date
  fecha_estimada_cosecha?: Date
  estado: 'ACTIVO' | 'EN_COSECHA' | 'FINALIZADO'
  ubicacion_especifica?: string
  coordenadas_lat?: number
  coordenadas_lng?: number
}
```

#### 3. Alertas
```typescript
interface AlertaResponse {
  id_alerta: number
  id_sensor: number
  tipo_alerta: string
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  titulo: string
  mensaje: string
  valor_actual?: number
  valor_umbral?: number
  resuelta: boolean
  fecha_creacion: Date
}
```

#### 4. Usuarios
```typescript
interface UserData {
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
```

### Flujos de Negocio Principales

#### Flujo 1: Autenticación y Acceso
1. Usuario selecciona tipo (Industria/Agricultor)
2. Ingresa credenciales (email/password)
3. Sistema valida tipo de usuario contra backend
4. Si el tipo no coincide, muestra error y auto-cambia pestaña
5. Redirige al dashboard correspondiente:
   - `/dashboard-empresa` para tipo industria
   - `/dashboard-agricultor` para tipo agricultor

#### Flujo 2: Monitoreo de Sensores (Agricultor)
1. Sistema carga lista de sensores desde API
2. Muestra sensores en tarjetas con código de colores:
   - Verde: Estado normal
   - Amarillo: Advertencia
   - Rojo: Crítico
3. Usuario puede expandir tarjeta para ver:
   - Valor actual con unidad
   - Rango permitido
   - Ubicación del sensor
   - Tendencia (subiendo/bajando/estable)
   - Nivel de batería
   - Última actualización
4. Sistema actualiza datos automáticamente cada 30 segundos

#### Flujo 3: Dashboard Empresa
1. Sistema carga KPIs principales:
   - Rendimiento de extracción
   - Tiempo en rango
   - Mermas
   - Lotes procesados
   - Alertas abiertas
2. Muestra estado de equipos en tiempo real
3. Lista alertas pendientes con priorización
4. Actualización automática cada 30 segundos

#### Flujo 4: Gestión de Alertas
1. Sistema detecta valores fuera de umbral
2. Crea alerta con severidad calculada
3. Notifica en dashboard
4. Usuario puede:
   - Reconocer alerta (ACK)
   - Resolver alerta
   - Marcar como leída
5. Alertas resueltas se archivan

---

## 🚨 Problemas y Cuellos de Botella Identificados

### Problemas Críticos

#### 1. **Dependencia de Google Fonts Bloqueada**
- **Descripción**: El build falla porque no puede acceder a Google Fonts
- **Impacto**: Alto - Impide el deployment en producción
- **Ubicación**: `src/app/layout.tsx` línea 2
- **Solución**: Cambiar a fuentes del sistema o pre-descargar fuentes

#### 2. **Falta de Manejo de Errores de Conexión**
- **Descripción**: Cuando el backend no está disponible, el frontend muestra errores genéricos
- **Impacto**: Alto - Mala experiencia de usuario
- **Ubicación**: `lib/api.ts` - función `apiRequest()`
- **Solución**: Implementar retry logic y mensajes de error más descriptivos

#### 3. **Datos Mock Mezclados con Datos Reales**
- **Descripción**: El código tiene lógica para datos mock y reales sin clara separación
- **Impacto**: Medio - Confusión en desarrollo y potenciales bugs
- **Ubicación**: `lib/api.ts`, `lib/mockData.ts`
- **Solución**: Usar feature flags o variables de entorno para cambiar entre modos

### Problemas de Performance

#### 4. **Sin Paginación en Listas Largas**
- **Descripción**: Las listas de sensores, cultivos y alertas cargan todos los datos
- **Impacto**: Alto - Performance degradada con muchos registros
- **Ubicación**: Todos los componentes de listado
- **Solución**: Implementar paginación o scroll infinito

#### 5. **Polling Continuo Sin Optimización**
- **Descripción**: Los dashboards hacen polling cada 30s sin verificar si el usuario está activo
- **Impacto**: Medio - Uso innecesario de recursos
- **Ubicación**: `dashboard-empresa/page.tsx`, `dashboard-agricultor/page.tsx`
- **Solución**: Implementar WebSockets o usar Page Visibility API

#### 6. **No Hay Caché de Datos**
- **Descripción**: Cada vista recarga todos los datos desde cero
- **Impacto**: Medio - Llamadas API redundantes
- **Solución**: Implementar cache layer con React Query o SWR

### Problemas de Seguridad

#### 7. **Token en localStorage Sin Protección**
- **Descripción**: JWT token guardado en localStorage vulnerable a XSS
- **Impacto**: Alto - Riesgo de seguridad
- **Ubicación**: `lib/auth.ts`, componentes de autenticación
- **Solución**: Usar httpOnly cookies o implementar refresh tokens

#### 8. **No Hay Validación de Permisos en Frontend**
- **Descripción**: El frontend no valida permisos, solo tipo de usuario
- **Impacto**: Medio - Usuarios podrían intentar acceder a rutas no autorizadas
- **Solución**: Implementar sistema de permisos granular

### Problemas de UX

#### 9. **Sin Indicadores de Carga Consistentes**
- **Descripción**: Algunas vistas muestran spinners, otras no
- **Impacto**: Bajo - Inconsistencia en la UX
- **Ubicación**: Varios componentes
- **Solución**: Implementar componente de loading unificado

#### 10. **Falta de Feedback Visual en Acciones**
- **Descripción**: Al resolver alertas o realizar acciones, no hay confirmación clara
- **Impacto**: Medio - Usuario no sabe si la acción fue exitosa
- **Solución**: Implementar sistema de toasts/notificaciones

### Problemas de Arquitectura

#### 11. **Lógica de Negocio en Componentes de UI**
- **Descripción**: Componentes tienen lógica compleja mezclada con presentación
- **Impacto**: Medio - Dificulta mantenimiento y testing
- **Ubicación**: Especialmente en `dashboard-agricultor/page.tsx`
- **Solución**: Extraer lógica a custom hooks y servicios

#### 12. **Sin Testing**
- **Descripción**: No hay tests unitarios ni de integración
- **Impacto**: Alto - Riesgo de regresiones
- **Solución**: Implementar suite de tests con Jest y React Testing Library

---

## 🚀 Features Necesarias Propuestas

### Features de Funcionalidad Core

#### Feature 1: Sistema de Notificaciones en Tiempo Real
**Prioridad**: Alta  
**Descripción**: Implementar WebSocket o Server-Sent Events para notificaciones push de alertas críticas  
**Beneficios**:
- Notificaciones instantáneas sin polling
- Reducción de carga en el servidor
- Mejor experiencia de usuario

**Componentes a crear**:
- `components/shared/NotificationCenter.tsx`
- `lib/websocket.ts`
- Hook: `useNotifications()`

#### Feature 2: Dashboard de Análisis de Tendencias
**Prioridad**: Alta  
**Descripción**: Gráficos históricos de métricas de sensores con análisis predictivo  
**Beneficios**:
- Visualización de tendencias temporales
- Detección temprana de problemas
- Toma de decisiones basada en datos

**Componentes a crear**:
- `components/dashboard/TrendChart.tsx`
- `app/dashboard-agricultor/tendencias/page.tsx`
- `lib/analytics.ts`

**Dependencias**: Chart.js o Recharts

#### Feature 3: Sistema de Reportes Exportables
**Prioridad**: Media  
**Descripción**: Generación de reportes en PDF/Excel con métricas personalizables  
**Beneficios**:
- Documentación de operaciones
- Compliance regulatorio
- Compartir información con stakeholders

**Componentes a crear**:
- `components/dashboard/ReportGenerator.tsx`
- `app/dashboard-empresa/reportes/page.tsx`
- `lib/reportGenerator.ts`

**Dependencias**: jsPDF, xlsx

#### Feature 4: Gestión Avanzada de Umbrales por Cultivo
**Prioridad**: Alta  
**Descripción**: Interface para configurar umbrales dinámicos según etapa de crecimiento  
**Beneficios**:
- Alertas más precisas
- Reducción de falsos positivos
- Configuración flexible por cultivo

**Componentes a crear**:
- `app/dashboard-agricultor/configuracion-umbrales/page.tsx`
- `components/dashboard/ThresholdEditor.tsx`
- API endpoints para CRUD de configuraciones

#### Feature 5: Sistema de Backup y Recuperación
**Prioridad**: Media  
**Descripción**: Exportar/importar configuraciones y datos históricos  
**Beneficios**:
- Protección contra pérdida de datos
- Migración entre entornos facilitada
- Auditoría de cambios

**Componentes a crear**:
- `app/dashboard-empresa/backup/page.tsx`
- `lib/backup.ts`
- API endpoints para backup/restore

#### Feature 6: Integración con APIs Climáticas
**Prioridad**: Alta  
**Descripción**: Integrar datos de pronóstico del tiempo con recomendaciones  
**Beneficios**:
- Decisiones proactivas basadas en clima
- Alertas preventivas
- Optimización de recursos

**Componentes a crear**:
- `components/dashboard/WeatherWidget.tsx`
- `lib/weatherApi.ts`
- `app/dashboard-agricultor/clima/page.tsx` (ya existe, mejorar)

**APIs**: OpenWeatherMap, WeatherAPI

### Features de Mejora de UX

#### Feature 7: Modo Offline (PWA Completo)
**Prioridad**: Media  
**Descripción**: Service Worker robusto para funcionamiento offline  
**Beneficios**:
- Funcionalidad en zonas con conectividad limitada
- Sincronización automática al recuperar conexión
- App más resiliente

#### Feature 8: Tour Interactivo (Onboarding)
**Prioridad**: Baja  
**Descripción**: Guía paso a paso para nuevos usuarios  
**Beneficios**:
- Reducción de curva de aprendizaje
- Menor necesidad de soporte
- Mejor adopción de features

**Dependencias**: Intro.js o react-joyride

#### Feature 9: Búsqueda Global
**Prioridad**: Media  
**Descripción**: Buscador centralizado para sensores, cultivos, alertas  
**Beneficios**:
- Navegación más rápida
- Mejor experiencia de usuario
- Acceso rápido a información

**Componente**: `components/shared/GlobalSearch.tsx`

### Features de Seguridad

#### Feature 10: Autenticación de Dos Factores (2FA)
**Prioridad**: Alta  
**Descripción**: Implementar TOTP o SMS para segunda capa de autenticación  
**Beneficios**:
- Mayor seguridad de cuentas
- Compliance con estándares de seguridad
- Protección contra accesos no autorizados

#### Feature 11: Auditoría de Acciones
**Prioridad**: Media  
**Descripción**: Log de todas las acciones críticas de usuarios  
**Beneficios**:
- Trazabilidad de operaciones
- Detección de anomalías
- Compliance regulatorio

**Componente**: `app/dashboard-empresa/auditoria/page.tsx`

### Features de Integración

#### Feature 12: API Pública para Integraciones
**Prioridad**: Media  
**Descripción**: Documentación y endpoints para integraciones de terceros  
**Beneficios**:
- Ecosistema extensible
- Integraciones con ERP/CRM
- Mayor valor de la plataforma

#### Feature 13: Webhooks para Eventos
**Prioridad**: Baja  
**Descripción**: Notificaciones HTTP POST a URLs configuradas  
**Beneficios**:
- Integraciones en tiempo real
- Automatización de flujos
- Flexibilidad para desarrolladores

---

## 📋 Resumen Ejecutivo

### Estado Actual
AlerTrace es una plataforma funcional con dos dashboards diferenciados (Industria y Agricultor), sistema de autenticación robusto, y monitoreo básico de sensores IoT. La arquitectura es sólida pero tiene oportunidades de mejora en performance, seguridad y experiencia de usuario.

### Prioridades Inmediatas
1. **Corregir build de producción** (Google Fonts)
2. **Implementar sistema de notificaciones en tiempo real**
3. **Agregar dashboard de tendencias**
4. **Mejorar gestión de umbrales**
5. **Integrar APIs climáticas**

### ROI de Features Propuestas
- **Corto plazo**: Features 1, 2, 4, 6 mejorarán inmediatamente la utilidad de la plataforma
- **Mediano plazo**: Features 3, 5, 9 agregarán valor a usuarios existentes
- **Largo plazo**: Features 10, 11, 12, 13 posicionarán la plataforma como enterprise-ready

### Próximos Pasos
1. Implementar las features de prioridad Alta en la rama `features-github`
2. Realizar testing exhaustivo
3. Documentar cambios y nuevas funcionalidades
4. Desplegar a entorno de staging para validación
