# Dashboard Empresa - Sensores

## Contexto (estado actual)
- El frontend agrupa sensores por `ubicacion_sensor` (string) y presenta esas agrupaciones como "Áreas".
- No existe entidad `Área` en backend; el identificador de área en UI es el propio string de `ubicacion_sensor`.
- Tipos actuales expuestos en el frontend (`front/src/types/index.ts`):
  - `SensorResponse.ubicacion_sensor?: string`
  - `SensorUpdate.ubicacion_sensor?: string`
- API disponibles hoy (`front/src/lib/api.ts`):
  - `GET /api/v1/sensores/`
  - `GET /api/v1/sensores/{id}/lecturas`
  - No hay endpoint de escritura para actualizar sensores.

## Necesidades del Frontend
1. **Mover sensores entre áreas** cuando:
   - El usuario selecciona una ubicación en el selector de la card del sensor.
   - El usuario arrastra la card del sensor a otra área (drag & drop).

2. **Editar un área** (card):
   - Cambiar nombre, descripción, color, ubicación, responsable.
   - Esto implica renombrar la `ubicacion_sensor` de todos los sensores asociados a esa área.

3. **Eliminar un área** (card):
   - Eliminar la agrupación visual.
   - Los sensores deben ser reasignados a otra área o quedar sin área asignada.

4. Opcional: creación/estandarización de catálogo de áreas (si se desea pasar de string libre a IDs reales en el futuro).

## Endpoints Propuestos (mínimo viable)
### 1) Actualizar un sensor (PATCH)
- `PATCH /api/v1/sensores/{id}`
- Body (JSON):
```json
{
  "ubicacion_sensor": "Zona de Secado - Nivel 1",
  "coordenadas_lat":  -12.0464,
  "coordenadas_lng":  -77.0428
}
```
- Respuesta 200 (JSON): `SensorResponse` actualizado.
- Validaciones sugeridas:
  - `id` válido y sensor existente.
  - `ubicacion_sensor` string ≤ 128 chars (saneamiento contra XSS y espacios extra).
  - Si se envían coordenadas, validar rango lat/lng.
- Errores:
  - 400: payload inválido
  - 404: sensor no encontrado
  - 401/403: auth/permiso

### 2) Mover múltiples sensores (batch) - Renombrar/Editar área
- `POST /api/v1/sensores/move`
- Body (JSON):
```json
{
  "from_ubicacion": "Zona de Secado - Nivel 1",
  "to_ubicacion": "Zona de Secado - Nivel 2",
  "sensor_ids": [123, 456, 789]  // opcional: si no se envía, mueve todos los de from_ubicacion
}
```
- Respuesta 200: lista de `SensorResponse` actualizados o resumen `{ "updated": n, "errors": [...] }`.
- Idempotencia: repetir el mismo `to_ubicacion` no debe fallar.
- **Uso**: Para editar/renombrar un área, se mueven todos los sensores de `from_ubicacion` a `to_ubicacion`.

### 3) Eliminar área (mover sensores a otra área o sin área)
- `DELETE /api/v1/sensores/by-ubicacion/{ubicacion}?move_to={nueva_ubicacion}`
- Query params:
  - `move_to` (opcional): Si se proporciona, mueve todos los sensores a esta nueva ubicación. Si no, deja `ubicacion_sensor = null`.
- Respuesta 200:
```json
{
  "deleted_ubicacion": "Zona de Secado - Nivel 1",
  "sensors_moved": 5,
  "new_ubicacion": "Área General"  // o null si no se especificó move_to
}
```
- **Uso**: Para eliminar un área, se reasignan todos sus sensores.

## Consideraciones de Modelo de Datos (futuro)
- Si se quiere una entidad `Área` real:
  - Tabla `areas`: `id_area (PK)`, `id_empresa (FK)`, `nombre` (único por empresa), `color_hex`, `ubicacion`, `responsable`, timestamps.
  - `sensores.id_area (FK)` y deprecar `ubicacion_sensor` (o mantener como etiqueta).
  - Endpoints CRUD de áreas:
    - `GET /api/v1/areas/`
    - `POST /api/v1/areas/`
    - `PATCH /api/v1/areas/{id}`
    - `DELETE /api/v1/areas/{id}`
  - Endpoint para mover sensor a un área por `id_area`:
    - `PATCH /api/v1/sensores/{id}` body `{ "id_area": 999 }`

## Seguridad / Auth
- Requiere usuario autenticado (empresa) con permiso para gestionar sensores de su empresa.
- Validar `id_empresa` del sensor vs. usuario para prevenir accesos cruzados.

## Ejemplos

### 1. Mover sensor por drag & drop
Request:
```
PATCH /api/v1/sensores/123
Content-Type: application/json
{
  "ubicacion_sensor": "Área General"
}
```
Response 200:
```json
{
  "id_sensor": 123,
  "nombre": "Sensor T1",
  "tipo": "temperatura",
  "id_empresa": 42,
  "activo": true,
  "intervalo_lectura": 60,
  "ubicacion_sensor": "Área General",
  "fecha_instalacion": "2024-01-01T00:00:00.000Z"
}
```

### 2. Editar/Renombrar área (mover todos sus sensores)
Request:
```
POST /api/v1/sensores/move
Content-Type: application/json
{
  "from_ubicacion": "Zona de Secado - Nivel 1",
  "to_ubicacion": "Zona de Secado - Nivel 2 Renombrado"
}
```
Response 200:
```json
{
  "updated": 5,
  "errors": []
}
```

### 3. Eliminar área (mover sensores a otra área)
Request:
```
DELETE /api/v1/sensores/by-ubicacion/Zona%20de%20Secado%20-%20Nivel%201?move_to=Área%20General
```
Response 200:
```json
{
  "deleted_ubicacion": "Zona de Secado - Nivel 1",
  "sensors_moved": 5,
  "new_ubicacion": "Área General"
}
```

### 4. Eliminar área (dejar sensores sin área)
Request:
```
DELETE /api/v1/sensores/by-ubicacion/Zona%20de%20Secado%20-%20Nivel%201
```
Response 200:
```json
{
  "deleted_ubicacion": "Zona de Secado - Nivel 1",
  "sensors_moved": 5,
  "new_ubicacion": null
}
```

## Impacto en el Frontend
- Tras exponer los endpoints, añadiremos en `front/src/lib/api.ts`:
```ts
sensors: {
  async getSensors() { /* existente */ },
  async getSensorData(sensorId: string) { /* existente */ },
  async updateSensor(sensorId: string, data: SensorUpdate) {
    return apiRequest(`${API_BASE_URL}/api/v1/sensores/${sensorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },
  async moveSensors(fromUbicacion: string, toUbicacion: string, sensorIds?: number[]) {
    return apiRequest(`${API_BASE_URL}/api/v1/sensores/move`, {
      method: 'POST',
      body: JSON.stringify({
        from_ubicacion: fromUbicacion,
        to_ubicacion: toUbicacion,
        sensor_ids: sensorIds
      })
    })
  },
  async deleteArea(ubicacion: string, moveTo?: string) {
    const url = new URL(`${API_BASE_URL}/api/v1/sensores/by-ubicacion/${encodeURIComponent(ubicacion)}`)
    if (moveTo) {
      url.searchParams.set('move_to', moveTo)
    }
    return apiRequest(url.toString(), {
      method: 'DELETE'
    })
  }
}
```
- En la UI de Sensores:
  - **Drag & Drop o Selector**: `await api.sensors.updateSensor(sensorId, { ubicacion_sensor: nuevaUbicacion })`
  - **Editar área**: `await api.sensors.moveSensors(areaVieja.ubicacion, formData.ubicacion)`
  - **Eliminar área**: `await api.sensors.deleteArea(area.ubicacion, 'Área General')` o `await api.sensors.deleteArea(area.ubicacion)`

## Métricas / Logs sugeridos
- Loggear cambios de `ubicacion_sensor` con `user_id`, `sensor_id`, y valores anterior→nuevo.
- Contador de movimientos por día para auditoría.

## Timeline recomendado
1) **MVP**: Implementar `PATCH /api/v1/sensores/{id}` (mover sensores individuales)
2) **Fase 2**: Implementar `POST /api/v1/sensores/move` (editar/renombrar áreas)
3) **Fase 3**: Implementar `DELETE /api/v1/sensores/by-ubicacion/{ubicacion}` (eliminar áreas)
4) (Futuro) Modelo de `áreas` con IDs y CRUD completo
