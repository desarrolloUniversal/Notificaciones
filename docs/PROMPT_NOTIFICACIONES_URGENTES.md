# Implementación de Notificaciones Urgentes - Especificación Técnica

## Contexto del proyecto

El proyecto ya tiene un sistema funcional de notificaciones pendientes basado en `PendingNotificationFromUrl`. 

Existe lógica para:
- Agregar notificaciones pendientes
- Editar sección y título inline en tabla
- Persistencia en localStorage
- Envío de notificaciones

## Prioridades de implementación

1. **Respetar el código existente del proyecto**
2. **Integrar la nueva funcionalidad sin romper flujos actuales**
3. **Adaptar la nueva funcionalidad al diseño ya implementado**

⚠️ **No modificar lógica existente si no es estrictamente necesario.Y si es preguntarme antes de hacer un cambio en el flujo de funcionalidad**

---

## Objetivo

Implementar un **botón de creación rápida de notificación urgente** que genere automáticamente una notificación pendiente con datos mínimos, permitiendo que el usuario complete la información directamente desde la tabla de pendientes.

---

## Restricciones de implementación

- ❌ NO modificar la lógica actual de notificaciones normales
- ❌ NO modificar la estructura existente de la tabla de pendientes
- ❌ NO alterar los flujos actuales de envío o edición
- ✅ El nuevo flujo debe reutilizar los estados ya existentes
- ✅ La nueva propiedad `isUrgent` debe ser opcional para evitar romper tipados existentes

---

## Arquitectura de integración

El flujo urgente debe comportarse como una **variante de `PendingNotificationFromUrl`**.

Debe:
- Insertarse en el mismo array de pendientes
- Usar las mismas funciones `addPendingNotification` y `updatePendingNotification`
- Usar los mismos estados de edición
- Reutilizar las validaciones existentes

---

## Ubicación del botón

**Archivo:** `src/App.tsx`

El botón debe renderizarse dentro de `.controls-group` pero **fuera del contenedor `url-input-container`**.

### Orden visual:

```
[ Botón Urgente (+) ] [ Input URL existente ] [ Botón Actualizar ] [ Botón Login ]
```

### Condición de visibilidad:

El botón solo se muestra si:

```typescript
isAuthenticated === true
```

---

## Estructura del botón

```tsx
<button
  className="add-urgente-btn"
  onClick={handleAddUrgenteNotification}
  title="Crear notificación urgente (requiere sección y título) - Complete los campos directamente en la tabla"
  aria-label="Crear notificación urgente"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
</button>
```

### Características:
- Icono: SVG de "+" (plus)
- **NO abre modal**
- Acción directa al hacer clic

---

## Función principal: `handleAddUrgenteNotification()`

### Responsabilidad:
Crear una notificación pendiente mínima marcada como urgente.

### Flujo de ejecución:

#### 1. Validar duplicados

Antes de crear, verificar si existe otra urgente incompleta:

```typescript
const hasIncompleteUrgent = pendingNotifications.some(pending => 
  pending.isUrgent === true && 
  (!pending.seccion || pending.seccion.trim() === '' || 
   !pending.titulo || pending.titulo.trim() === '')
)

if (hasIncompleteUrgent) {
  setIsUrgentWarningModalOpen(true)
  setTimeout(() => setIsUrgentWarningModalOpen(false), 2500)
  return
}
```

**Si existe:**
- Mostrar modal de advertencia
- Cerrar automáticamente después de 2.5s
- Cancelar creación
- Mensaje: "Ya existe una notificación urgente incompleta"

#### 2. Generar ID único

```typescript
const urgentId = `urgent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

**Formato:** `urgent-1234567890123-abc123xyz`

#### 3. Crear objeto `PendingNotificationFromUrl`

```typescript
const urgentNotification: PendingNotificationFromUrl = {
  id: urgentId,
  thumbnail: '',           // Vacío → usará logo por defecto
  seccion: '',            // VACÍO → Usuario debe llenar
  titulo: '',             // VACÍO → Usuario debe llenar
  subtitulo: '',          // Opcional
  url: '',                // Opcional para urgentes
  usuarios: username || 'Todos',
  estadoEnvio: 'Pendiente',
  fechaEnvio: null,
  timestamp: new Date().toISOString(),
  isUrgent: true          // Marca especial
}
```

#### 4. Insertar en pendientes

```typescript
addPendingNotification(urgentNotification)
```

#### 5. Activar edición automática

**Activar AMBOS modos de edición simultáneamente:**

```typescript
setEditingSectionId(urgentId)
setEditingSectionValue('')
setEditingTitleId(urgentId)
setEditingTitleValue('')
```

El usuario verá dos inputs activos al mismo tiempo.

**Prioridad de focus:** El input de sección debe tener `autoFocus={true}`.

#### 6. Mostrar feedback visual

```typescript
setIsUrgentSuccessModalOpen(true)
setTimeout(() => setIsUrgentSuccessModalOpen(false), 2000)
```

Modal temporal (2 segundos) con mensaje de éxito.

#### 7. Scroll automático a tabla con highlight

```typescript
setTimeout(() => {
  if (pendingSectionRef.current) {
    pendingSectionRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
    
    // Highlight temporal de la fila recién creada
    setTimeout(() => {
      const newRow = document.querySelector(`tr[data-pending-id="${urgentId}"]`)
      if (newRow) {
        newRow.classList.add('highlight-flash')
        setTimeout(() => newRow.classList.remove('highlight-flash'), 2000)
      }
    }, 500)
  }
}, 300)
```

#### 8. Log informativo

```typescript
console.log('✅ Notificación urgente creada. Complete los campos de Sección y Título.')
```

---

## Visualización en tabla

Las notificaciones urgentes se renderizan en la **misma tabla de pendientes**.

### Estructura del `<tr>`:

```tsx
<tr 
  key={pending.id}
  data-pending-id={pending.id}  // Atributo para selección
  className={`
    ${pending.isResend ? 'resend-row' : ''}
    ${isUrgentIncomplete(pending) ? 'urgent-row-incomplete' : ''}
  `}
>
```

### Diferencias visuales

Si `isUrgent === true` y falta sección o título:

Aplicar clase: `urgent-row-incomplete`

Esto añade:
- ✅ Borde izquierdo rojo prominente (5px)
- ✅ Fondo gradiente rojo claro
- ✅ Animación de pulso (opcional)

---

## Función helper: `isUrgentIncomplete()`

```typescript
const isUrgentIncomplete = (pending: PendingNotificationFromUrl): boolean => {
  return pending.isUrgent === true && 
         (!pending.seccion || pending.seccion.trim() === '' || 
          !pending.titulo || pending.titulo.trim() === '')
}
```

### Condición de urgente incompleta:

```
isUrgent === true 
AND 
(seccion vacío OR titulo vacío)
```

---

## Función helper adicional: `isUrgentOld()`

```typescript
const isUrgentOld = (pending: PendingNotificationFromUrl): boolean => {
  if (!pending.isUrgent) return false
  const created = new Date(pending.timestamp)
  const now = new Date()
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  return hoursDiff > 24
}
```

Detecta urgentes con más de 24 horas sin completar.

---

## Validación antes de enviar

### En la función `handleApplyPending`:

```typescript
const handleApplyPending = async (pending: PendingNotificationFromUrl) => {
  // Validación específica para urgentes
  if (pending.isUrgent) {
    // Validar sección (OBLIGATORIO)
    if (!pending.seccion || pending.seccion.trim() === '') {
      alert('⚠️ Sección requerida\n\nDebe ingresar una sección para la notificación urgente.')
      setEditingSectionId(pending.id)
      return
    }
    
    // Validar título (OBLIGATORIO)
    if (!pending.titulo || pending.titulo.trim() === '') {
      alert('⚠️ Título requerido\n\nDebe ingresar un título para la notificación urgente.')
      setEditingTitleId(pending.id)
      return
    }
  }
  
  // ... resto de la lógica de envío
}
```

### Campos obligatorios para urgentes:
- ✅ **sección** (obligatorio)
- ✅ **título** (obligatorio)

### Campos opcionales:
- ⚪ subtitulo
- ⚪ url
- ⚪ thumbnail (se usa logo por defecto si está vacío)

---

## Comportamiento de edición inline

### Input de Sección

```tsx
<input
  type="text"
  className="section-edit-input"
  value={editingSectionValue}
  onChange={(e) => setEditingSectionValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSaveSection(pending.id)
    if (e.key === 'Escape') handleCancelEditSection()
  }}
  autoFocus  // ✅ IMPORTANTE: Focus automático
  placeholder="Ingrese la sección..."
/>
```

### Input de Título

```tsx
<input
  type="text"
  className="title-edit-input"
  value={editingTitleValue}
  onChange={(e) => setEditingTitleValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSaveTitle(pending.id)
    if (e.key === 'Escape') handleCancelEditTitle()
  }}
  autoFocus
  placeholder="Ingrese el título..."
/>
```

### Atajos de teclado:
- **Enter**: Guardar cambios
- **Escape**: Cancelar edición

---

## Badge de antigüedad

Mostrar badge si urgente tiene >24 horas sin completar:

```tsx
{isUrgentOld(pending) && isUrgentIncomplete(pending) && (
  <span 
    className="urgent-old-badge" 
    title={`Urgente creada hace más de 24 horas (${pending.timestamp})`}
  >
    ⏰ Antiguo
  </span>
)}
```

---

## Eliminación de urgentes

### Función `handleRemovePending` mejorada:

```typescript
const handleRemovePending = (id: string) => {
  // Validación para urgentes con datos completados
  const pending = getPendingNotifications().find(p => p.id === id)
  
  if (pending?.isUrgent && (pending.seccion || pending.titulo)) {
    const hasData = [
      pending.seccion && `Sección: "${pending.seccion}"`,
      pending.titulo && `Título: "${pending.titulo}"`
    ].filter(Boolean).join('\n')
    
    const confirmed = confirm(
      `⚠️ Esta notificación urgente tiene datos completados:\n\n${hasData}\n\n¿Desea eliminarla de todos modos?`
    )
    
    if (!confirmed) {
      return // Cancelar eliminación
    }
  }
  
  removePendingNotification(id)
}
```

**Comportamiento:**
- Sin confirmación para urgentes vacías
- Con confirmación para urgentes con datos parciales

---

## Modales de feedback

### Modal de éxito (urgente creada)

```jsx
{isUrgentSuccessModalOpen && (
  <div className="urgent-success-modal">
    <div className="urgent-success-content">
      <span className="urgent-success-icon">✓</span>
      <p className="urgent-success-text">
        Notificación urgente creada. Complete sección y título.
      </p>
    </div>
  </div>
)}
```

**Características:**
- Posición: top-right
- Duración: 2 segundos
- Auto-cierre con animación

### Modal de advertencia (duplicado)

```jsx
{isUrgentWarningModalOpen && (
  <div className="urgent-warning-modal">
    <div className="urgent-warning-content">
      <span className="urgent-warning-icon">⚠</span>
      <p className="urgent-warning-text">
        Ya existe una notificación urgente incompleta
      </p>
    </div>
  </div>
)}
```

**Características:**
- Posición: top-right
- Duración: 2.5 segundos
- Auto-cierre con animación

---

## Compatibilidad con código existente

### NO modificar:

- ❌ `canSendNotification`
- ❌ Estructura de tabla existente
- ❌ Flujos de resend
- ❌ Modales actuales de URL
- ❌ Lógica de autenticación

### Propiedad nueva:

```typescript
interface PendingNotificationFromUrl {
  // ... campos existentes
  isUrgent?: boolean  // ✅ OPCIONAL - no rompe compatibilidad
}
```

---

## Persistencia

Las notificaciones urgentes deben persistir en localStorage usando el **mismo mecanismo existente** para pendientes.

Esto garantiza:
- ✅ Recuperación después de refresh
- ✅ Continuidad de edición
- ✅ Compatibilidad con sistema multi-usuario

---

## Estilos CSS requeridos

### Botón urgente

```css
/* Botón de Notificación Urgente (SVG +) */
.add-urgente-btn {
  padding: 10px;
  font-size: 18px;
  font-weight: 700;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.add-urgente-btn:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  animation: pulse-urgent 2s infinite;
}

@keyframes pulse-urgent {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
}
```

### Fila urgente incompleta

```css
/* Fila de notificación urgente incompleta */
.pending-notifications-table tbody tr.urgent-row-incomplete {
  background: linear-gradient(90deg, 
    rgba(220, 38, 38, 0.08) 0%, 
    rgba(255, 220, 220, 0.35) 100%
  ) !important;
  border-left: 5px solid #dc2626 !important; /* ✅ Border prominente */
  position: relative;
}

/* Hover para filas urgentes */
.pending-notifications-table tbody tr.urgent-row-incomplete:hover {
  background: linear-gradient(90deg, 
    rgba(220, 38, 38, 0.15) 0%, 
    rgba(255, 200, 200, 0.5) 100%
  ) !important;
}
```

### Animación de highlight

```css
/* Animación de highlight para fila recién creada */
.pending-notifications-table tbody tr.highlight-flash {
  animation: highlight-flash 0.6s ease 3;
}

@keyframes highlight-flash {
  0%, 100% { 
    background: transparent; 
  }
  50% { 
    background: rgba(220, 38, 38, 0.25);
    transform: scale(1.01);
  }
}
```

### Badge de antigüedad

```css
/* Badge de urgente antiguo */
.urgent-old-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  margin-left: 8px;
  white-space: nowrap;
  animation: pulse-warning 2s ease-in-out infinite;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}
```

### Modales de feedback

```css
/* Modal de éxito urgente */
.urgent-success-modal {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  animation: urgentSlideIn 0.3s ease, urgentSlideOut 0.3s ease 1.7s;
}

.urgent-success-content {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

/* Modal de advertencia urgente */
.urgent-warning-modal {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  animation: urgentSlideIn 0.3s ease, urgentSlideOut 0.3s ease 2.2s;
}

.urgent-warning-content {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
}

@keyframes urgentSlideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes urgentSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(400px); opacity: 0; }
}
```

---

## Experiencia de usuario esperada

### Flujo completo:

```
1. Usuario hace clic en botón [+] Urgente
   ↓
2. Validación: ¿existe urgente incompleta?
   → SÍ: Mostrar advertencia y cancelar
   → NO: Continuar
   ↓
3. Crear notificación con ID único
   ↓
4. Agregar a tabla de pendientes
   ↓
5. Activar edición de sección y título simultáneamente
   ↓
6. Mostrar modal de éxito (2s)
   ↓
7. Scroll automático a tabla
   ↓
8. Highlight de fila nueva (animación 3x)
   ↓
9. Usuario escribe en input de sección (focus automático)
   ↓
10. Usuario presiona Enter o hace clic en ✓
   ↓
11. Usuario escribe título
   ↓
12. Usuario presiona Enter o hace clic en ✓
   ↓
13. Fila deja de tener clase "urgent-row-incomplete"
   ↓
14. Usuario hace clic en botón ↑ (Enviar)
   ↓
15. Validación OK → Envío exitoso
```

---

## Testing esperado

### Casos de prueba:

#### ✅ Creación básica
- [ ] Click en botón crea fila inmediatamente
- [ ] ID generado tiene formato `urgent-{timestamp}-{random}`
- [ ] Inputs de sección y título están activos
- [ ] Input de sección tiene focus automático

#### ✅ Validación de duplicados
- [ ] No permite crear si existe urgente incompleta
- [ ] Muestra modal de advertencia correctamente
- [ ] Modal se cierra automáticamente después de 2.5s

#### ✅ Edición inline
- [ ] Escribir en sección y guardar con Enter funciona
- [ ] Escribir en título y guardar con Enter funciona
- [ ] Cancelar con Escape funciona
- [ ] Placeholder aparece cuando campo está vacío

#### ✅ Visualización
- [ ] Clase `urgent-row-incomplete` se aplica correctamente
- [ ] Border rojo izquierdo (5px) visible
- [ ] Background gradiente rojo claro visible
- [ ] Badge "⏰ Antiguo" aparece después de 24h

#### ✅ Validación de envío
- [ ] Bloquea envío si falta sección
- [ ] Bloquea envío si falta título
- [ ] Muestra alert específico para cada campo faltante
- [ ] Activa edición del campo faltante automáticamente

#### ✅ Persistencia
- [ ] Urgentes persisten después de refresh
- [ ] Datos parciales (solo sección) se mantienen
- [ ] Datos parciales (solo título) se mantienen
- [ ] `isUrgent: true` se mantiene correctamente

#### ✅ Scroll y animación
- [ ] Scroll automático a tabla funciona
- [ ] Animación highlight se ejecuta 3 veces
- [ ] Scroll es suave (smooth behavior)

#### ✅ Eliminación
- [ ] Eliminar urgente vacía no pide confirmación
- [ ] Eliminar urgente con datos pide confirmación
- [ ] Mensaje de confirmación muestra datos completados
- [ ] Cancelar confirmación mantiene la urgente

#### ✅ Responsive
- [ ] Botón se ve correctamente en mobile
- [ ] Tabla de pendientes scroll horizontal funciona
- [ ] Inputs inline funcionan en pantallas pequeñas
- [ ] Modales de feedback no se salen de pantalla

---

## Checklist de implementación

### Paso 1: Actualizar tipos (si es necesario)
- [ ] Verificar que `isUrgent?: boolean` existe en `PendingNotificationFromUrl`

### Paso 2: Estados (ya existen)
- [ ] `isUrgentSuccessModalOpen`
- [ ] `isUrgentWarningModalOpen`
- [ ] `editingSectionId` y `editingTitleId`

### Paso 3: Función principal
- [ ] Implementar `handleAddUrgenteNotification`
- [ ] Agregar validación de duplicados
- [ ] Agregar creación de objeto
- [ ] Agregar activación de edición
- [ ] Agregar scroll con highlight

### Paso 4: Funciones helper
- [ ] Implementar `isUrgentIncomplete`
- [ ] Implementar `isUrgentOld`

### Paso 5: Validación de envío
- [ ] Actualizar `handleApplyPending` con validaciones urgentes

### Paso 6: Visualización
- [ ] Agregar `data-pending-id` al `<tr>`
- [ ] Aplicar clase `urgent-row-incomplete`
- [ ] Agregar `autoFocus` a inputs
- [ ] Agregar badge de antigüedad

### Paso 7: Eliminación
- [ ] Actualizar `handleRemovePending` con confirmación

### Paso 8: Estilos CSS
- [ ] Agregar estilos de botón `.add-urgente-btn`
- [ ] Agregar estilos de fila `.urgent-row-incomplete`
- [ ] Agregar animación `.highlight-flash`
- [ ] Agregar estilos de badge `.urgent-old-badge`
- [ ] Agregar estilos de modales

### Paso 9: Testing
- [ ] Probar todos los casos de prueba listados arriba

---

## Notas adicionales

### Mejoras futuras consideradas:

1. **Plantillas predefinidas**: Dropdown con tipos de urgentes
2. **Historial de urgentes**: Ver urgentes enviadas en últimas 24h
3. **Auto-save**: Guardar cambios cada 10s automáticamente
4. **Keyboard shortcut global**: `Ctrl+U` para crear urgente
5. **Validación de sección**: Lista predefinida de secciones válidas
6. **Mínimo de caracteres**: Título debe tener al menos 10 caracteres

### Consideraciones de rendimiento:

- La función `isUrgentOld` se ejecuta en cada render → ✅ Es eficiente (operación simple)
- Los modales temporales usan `setTimeout` → ✅ Se limpian automáticamente
- La animación highlight usa CSS → ✅ Hardware accelerated

### Accesibilidad:

- ✅ `aria-label` en botón
- ✅ `title` descriptivo con instrucciones
- ✅ Keyboard navigation (Enter/Escape)
- ✅ Focus management automático
- ⚠️ Considerar: ARIA live regions para anunciar creación

---

## Resultado final esperado

Después de la implementación completa, el sistema debe permitir:

1. ✅ Crear notificaciones urgentes con 1 clic
2. ✅ Editar sección y título inline inmediatamente
3. ✅ Ver feedback visual claro (colores, borders, badges)
4. ✅ Prevenir errores (validaciones y confirmaciones)
5. ✅ Mantener compatibilidad total con flujo existente
6. ✅ Persistir datos correctamente
7. ✅ Proporcionar experiencia fluida y rápida

**Tiempo estimado de implementación completa:** 2-3 horas

**Archivos a modificar:**
- `src/App.tsx` (principal)
- `src/App.css` (estilos)
- `src/notificaciones/types/notificacionesTypes.ts` (si no existe `isUrgent`)

---

## Soporte y mantenimiento

### Problemas comunes:

**"El botón no aparece"**
→ Verificar: `isAuthenticated === true`

**"No puedo crear otra urgente"**
→ Esperado si existe urgente incompleta → Completar o eliminar la existente

**"Los inputs no tienen focus"**
→ Verificar: `autoFocus={true}` en ambos inputs

**"La animación no funciona"**
→ Verificar: `data-pending-id` existe y CSS está importado

**"No valida sección/título al enviar"**
→ Verificar: Bloque `if (pending.isUrgent)` en `handleApplyPending`

---

## 🛠️ Scripts de Validación Automatizados

### Script PowerShell: Validar Compatibilidad CSS

Guarda este script como `validate-urgent-css.ps1` en la raíz del proyecto:

```powershell
# validate-urgent-css.ps1
# Valida que las clases CSS para urgentes no existan antes de implementar

Write-Host "🔍 VALIDACIÓN DE COMPATIBILIDAD CSS - NOTIFICACIONES URGENTES" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

$cssFile = "src/App.css"
$errors = 0
$warnings = 0

# Verificar que el archivo existe
if (!(Test-Path $cssFile)) {
    Write-Host "❌ ERROR: No se encontró $cssFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Analizando: $cssFile" -ForegroundColor Yellow
Write-Host ""

# Lista de clases que NO deben existir
$classesToCheck = @(
    "add-urgente-btn",
    "urgent-row-incomplete",
    "urgent-old-badge",
    "highlight-flash",
    "urgent-success-modal",
    "urgent-warning-modal",
    "urgent-success-content",
    "urgent-warning-content",
    "urgent-success-icon",
    "urgent-warning-icon"
)

# Lista de animaciones que NO deben existir
$animationsToCheck = @(
    "pulse-urgent",
    "highlight-flash",
    "pulse-warning",
    "urgentSlideIn",
    "urgentSlideOut"
)

Write-Host "1️⃣ Verificando clases CSS..." -ForegroundColor Cyan

foreach ($class in $classesToCheck) {
    $found = Select-String -Path $cssFile -Pattern "\.$class\b" -Quiet
    if ($found) {
        Write-Host "   ❌ CONFLICTO: Clase .$class ya existe" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "   ✅ .$class - OK (no existe)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "2️⃣ Verificando animaciones @keyframes..." -ForegroundColor Cyan

foreach ($anim in $animationsToCheck) {
    $found = Select-String -Path $cssFile -Pattern "@keyframes\s+$anim\b" -Quiet
    if ($found) {
        Write-Host "   ❌ CONFLICTO: Animación @keyframes $anim ya existe" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "   ✅ @keyframes $anim - OK (no existe)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3️⃣ Verificando z-index de modales..." -ForegroundColor Cyan

$zIndexes = Select-String -Path $cssFile -Pattern "z-index:\s*(\d+)" | ForEach-Object {
    if ($_.Matches[0].Groups[1].Value -match '^\d+$') {
        [int]$_.Matches[0].Groups[1].Value
    }
}

if ($zIndexes) {
    $maxZIndex = ($zIndexes | Measure-Object -Maximum).Maximum
    Write-Host "   📊 Z-index máximo actual: $maxZIndex" -ForegroundColor Yellow
    
    if ($maxZIndex -ge 10000) {
        Write-Host "   ⚠️  ADVERTENCIA: Modales urgentes usan z-index: 10000" -ForegroundColor Yellow
        Write-Host "      Considerar usar z-index: $($maxZIndex + 1) para evitar conflictos" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "   ✅ Z-index 10000 es seguro (mayor que $maxZIndex)" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  No se encontraron z-index en el archivo" -ForegroundColor Gray
}

Write-Host ""
Write-Host "4️⃣ Verificando selectores de tabla..." -ForegroundColor Cyan

$tableSelectors = Select-String -Path $cssFile -Pattern "\.pending-notifications-table.*urgent" -Quiet
if ($tableSelectors) {
    Write-Host "   ❌ CONFLICTO: Ya existen selectores de tabla con 'urgent'" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   ✅ No hay selectores de tabla con 'urgent' - OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Resumen final
if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ VALIDACIÓN EXITOSA" -ForegroundColor Green
    Write-Host "   Ningún conflicto detectado. Es seguro implementar las clases CSS." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Agregar las clases CSS al final de $cssFile" -ForegroundColor White
    Write-Host "   2. Implementar las funciones TypeScript en App.tsx" -ForegroundColor White
    Write-Host "   3. Ejecutar: npm run dev" -ForegroundColor White
    Write-Host "   4. Probar la funcionalidad" -ForegroundColor White
    exit 0
} elseif ($errors -eq 0 -and $warnings -gt 0) {
    Write-Host "⚠️  VALIDACIÓN CON ADVERTENCIAS" -ForegroundColor Yellow
    Write-Host "   Se encontraron $warnings advertencia(s)" -ForegroundColor Yellow
    Write-Host "   Revisar las recomendaciones antes de implementar" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ VALIDACIÓN FALLIDA" -ForegroundColor Red
    Write-Host "   Se encontraron $errors error(es) y $warnings advertencia(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  ACCIÓN REQUERIDA:" -ForegroundColor Yellow
    Write-Host "   Resolver los conflictos antes de implementar nuevas clases." -ForegroundColor Yellow
    Write-Host "   Opciones:" -ForegroundColor White
    Write-Host "   1. Renombrar las clases existentes" -ForegroundColor White
    Write-Host "   2. Usar nombres diferentes para las clases nuevas" -ForegroundColor White
    Write-Host "   3. Eliminar las clases conflictivas si no se usan" -ForegroundColor White
    exit 1
}
```

### Cómo usar el script:

```powershell
# En PowerShell, desde la raíz del proyecto:
.\validate-urgent-css.ps1
```

**Resultado esperado:**
```
🔍 VALIDACIÓN DE COMPATIBILIDAD CSS - NOTIFICACIONES URGENTES
======================================================================

📄 Analizando: src/App.css

1️⃣ Verificando clases CSS...
   ✅ .add-urgente-btn - OK (no existe)
   ✅ .urgent-row-incomplete - OK (no existe)
   ✅ .urgent-old-badge - OK (no existe)
   ...

2️⃣ Verificando animaciones @keyframes...
   ✅ @keyframes pulse-urgent - OK (no existe)
   ✅ @keyframes highlight-flash - OK (no existe)
   ...

3️⃣ Verificando z-index de modales...
   📊 Z-index máximo actual: 9999
   ✅ Z-index 10000 es seguro (mayor que 9999)

4️⃣ Verificando selectores de tabla...
   ✅ No hay selectores de tabla con 'urgent' - OK

======================================================================

✅ VALIDACIÓN EXITOSA
   Ningún conflicto detectado. Es seguro implementar las clases CSS.
```

---



### 🎯 Recomendación:

**Es SEGURO implementar todas las clases CSS del prompt** tal como están especificadas.

### 📋 Orden de Implementación Recomendado:

1. ✅ **Primero:** Ejecutar `validate-urgent-css.ps1` (validación pre-implementación)
2. ✅ **Segundo:** Agregar clases CSS al final de `App.css` (con comentario de sección)
3. ✅ **Tercero:** Implementar funciones TypeScript en `App.tsx`
4. ✅ **Cuarto:** Ejecutar `test-urgent-implementation.ps1` (validación post-implementación)
5. ✅ **Quinto:** Probar manualmente con `npm run dev`

### 🛡️ Garantía de No-Ruptura:

- ✅ Clases con nombres únicos (prefijo `urgent-`)
- ✅ Selectores específicos (no afectan elementos existentes)
- ✅ Estados independientes (no interfieren con flujos actuales)
- ✅ Z-index adecuado (mayor que modales existentes)
- ✅ Animaciones con nombres únicos

---

**Versión del documento:** 2.1  
**Última actualización:** 5 de marzo de 2026  
**Autor:** GitHub Copilot - Claude Sonnet 4.5  
**Con análisis de compatibilidad CSS incluido**
