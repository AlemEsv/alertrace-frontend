# 🎨 Tokens de Color - AlertRace Design System

## 📊 Resumen de Tokens de Color Principales

### 🟢 Tema Agricultor

**Color Principal:** Verde (`green-600`)

| Token | Hex | RGB | HSL | Uso |
|-------|-----|-----|-----|-----|
| `primary.50` | `#f0fdf4` | `rgb(240, 253, 244)` | `hsl(142, 76%, 96%)` | Fondos muy claros |
| `primary.100` | `#dcfce7` | `rgb(220, 252, 231)` | `hsl(142, 76%, 93%)` | Fondos claros |
| `primary.200` | `#bbf7d0` | `rgb(187, 247, 208)` | `hsl(142, 76%, 85%)` | Bordes claros |
| `primary.300` | `#86efac` | `rgb(134, 239, 172)` | `hsl(142, 76%, 73%)` | Hover states claros |
| `primary.400` | `#4ade80` | `rgb(74, 222, 128)` | `hsl(142, 76%, 58%)` | Elementos secundarios |
| `primary.500` | `#22c55e` | `rgb(34, 197, 94)` | `hsl(142, 76%, 45%)` | Elementos importantes |
| **`primary.600`** | **`#16a34a`** | **`rgb(22, 163, 74)`** | **`hsl(142, 76%, 36%)`** | **🎯 COLOR PRINCIPAL** |
| `primary.700` | `#15803d` | `rgb(21, 128, 61)` | `hsl(142, 76%, 29%)` | Hover states oscuros |
| `primary.800` | `#166534` | `rgb(22, 101, 52)` | `hsl(142, 76%, 24%)` | Textos sobre fondos claros |
| `primary.900` | `#14532d` | `rgb(20, 83, 45)` | `hsl(142, 76%, 20%)` | Fondos oscuros |

**Clases Tailwind Equivalentes:**
- `primary.600` = `green-600`
- `primary.700` = `green-700`
- etc.

---

### 🔵 Tema Empresa

**Color Principal:** Azul (`blue-600`)

| Token | Hex | RGB | HSL | Uso |
|-------|-----|-----|-----|-----|
| `primary.50` | `#eff6ff` | `rgb(239, 246, 255)` | `hsl(220, 100%, 97%)` | Fondos muy claros |
| `primary.100` | `#dbeafe` | `rgb(219, 234, 254)` | `hsl(220, 100%, 93%)` | Fondos claros |
| `primary.200` | `#bfdbfe` | `rgb(191, 219, 254)` | `hsl(220, 100%, 87%)` | Bordes claros |
| `primary.300` | `#93c5fd` | `rgb(147, 197, 253)` | `hsl(220, 100%, 78%)` | Hover states claros |
| `primary.400` | `#60a5fa` | `rgb(96, 165, 250)` | `hsl(220, 100%, 68%)` | Elementos secundarios |
| `primary.500` | `#3b82f6` | `rgb(59, 130, 246)` | `hsl(220, 100%, 60%)` | Elementos importantes |
| **`primary.600`** | **`#2563eb`** | **`rgb(37, 99, 235)`** | **`hsl(220, 100%, 50%)`** | **🎯 COLOR PRINCIPAL** |
| `primary.700` | `#1d4ed8` | `rgb(29, 78, 216)` | `hsl(220, 100%, 48%)` | Hover states oscuros |
| `primary.800` | `#1e40af` | `rgb(30, 64, 175)` | `hsl(220, 100%, 40%)` | Textos sobre fondos claros |
| `primary.900` | `#1e3a8a` | `rgb(30, 58, 138)` | `hsl(220, 100%, 33%)` | Fondos oscuros |

**Clases Tailwind Equivalentes:**
- `primary.600` = `blue-600`
- `primary.700` = `blue-700`
- etc.

---

## 🔄 Mapeo con Variables CSS (globals.css)

En `globals.css` también hay definiciones en formato HSL:

### Agricultor
```css
--agricultor-primary: 142 76% 36%;        /* = primary.600 */
--agricultor-primary-dark: 142 76% 30%;   /* ≈ primary.700 */
```

### Empresa
```css
--empresa-primary: 220 100% 50%;          /* = primary.600 */
--empresa-primary-dark: 220 100% 45%;     /* ≈ primary.700 */
```

**⚠️ Nota:** Los valores en `globals.css` coinciden con los tokens principales.

---

## 📝 Uso en Código

### Opción 1: Usar clases del tema (Recomendado)
```typescript
import { useDashboardTheme } from '@/lib/design-system/useTheme'

const theme = useDashboardTheme()
// Usar: theme.colors.classes.primary
// Usar: theme.colors.classes.primaryButton
```

### Opción 2: Usar valores hexadecimales directamente
```typescript
const theme = useDashboardTheme()
// theme.colors.primary[600] // '#16a34a' o '#2563eb'
```

### Opción 3: Usar clases Tailwind directamente (No recomendado para temas)
```typescript
// No usar directamente - usar sistema de temas
className="bg-green-600" // ❌ No usar
className={theme.colors.classes.primaryButton} // ✅ Usar
```

---

## ✅ Estado Actual

| Tema | Token Principal | Definido | Implementado |
|------|----------------|----------|---------------|
| 🟢 Agricultor | `primary.600 = #16a34a` | ✅ | ✅ |
| 🔵 Empresa | `primary.600 = #2563eb` | ✅ | ✅ |
| 🟣 Admin (futuro) | `primary.600 = #9333ea` | ✅ | ⏳ |

---

**Última actualización:** Después de implementación de temas

