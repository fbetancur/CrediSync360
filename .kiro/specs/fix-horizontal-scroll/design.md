# Design Document: Fix Horizontal Scroll

## Overview

El problema de scroll horizontal en la PWA CrediSync360 afecta todas las pantallas de la aplicación. La causa raíz es la falta de restricciones globales de ancho y el uso de elementos que pueden expandirse más allá del viewport (tablas, números largos, grids).

La solución implementará una estrategia de dos niveles:
1. **Nivel Global**: Estilos CSS globales que previenen overflow horizontal en toda la aplicación
2. **Nivel Componente**: Ajustes específicos en componentes problemáticos (tablas, cards, formularios)

## Architecture

### Estrategia de Solución

```
┌─────────────────────────────────────┐
│   Estilos Globales (index.css)     │
│   - overflow-x: hidden              │
│   - max-width: 100vw                │
│   - box-sizing: border-box          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Contenedor Principal (App.tsx)    │
│   - w-screen (100vw)                │
│   - overflow-x-hidden               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Componentes Individuales          │
│   - Balance: tablas responsive      │
│   - Clientes: cards con max-w       │
│   - Cobros: grids adaptables        │
│   - Productos: listas contenidas    │
└─────────────────────────────────────┘
```

### Principios de Diseño

1. **Mobile-First**: Diseñar para el viewport más pequeño primero
2. **Contenido Fluido**: Usar anchos relativos (%, vw) en lugar de absolutos (px)
3. **Overflow Control**: Aplicar overflow-x-hidden en contenedores clave
4. **Responsive Typography**: Ajustar tamaños de fuente según viewport
5. **Table Strategies**: Usar técnicas responsive para tablas (scroll interno, stacked layout, font-size reducido)

## Components and Interfaces

### 1. Global CSS (index.css)

Estilos globales que se aplican a toda la aplicación:

```css
/* Prevenir scroll horizontal global */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}

#root {
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}

/* Asegurar box-sizing en todos los elementos */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Prevenir que elementos inline causen overflow */
img, video, iframe {
  max-width: 100%;
  height: auto;
}

/* Tablas responsive por defecto */
table {
  max-width: 100%;
  table-layout: fixed;
}
```

### 2. App Container (App.tsx)

El contenedor principal debe tener restricciones de ancho:

```tsx
<div className="h-screen w-screen flex flex-col overflow-hidden">
  {/* Navegación */}
  <nav className="...">...</nav>
  
  {/* Contenido - agregar max-w-full */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
    {/* Pantallas */}
  </div>
</div>
```

### 3. Balance Component (Balance.tsx)

Componente más afectado por tablas con números grandes:

**Cambios necesarios:**

1. **Contenedor principal**: Agregar `max-w-full` y `overflow-x-hidden`
2. **Tablas**: Aplicar estrategia responsive
   - Reducir padding en celdas
   - Usar font-size más pequeño para números
   - Aplicar `word-break: break-all` en columnas de valores
   - Considerar `table-layout: fixed` con anchos de columna definidos
3. **Números grandes**: Usar `whitespace-nowrap` con `text-overflow: ellipsis` o reducir font-size

```tsx
// Ejemplo de tabla responsive
<div className="overflow-x-auto max-w-full">
  <table className="w-full min-w-0">
    <thead>
      <tr>
        <th className="px-2 py-2 text-xs">Detalle</th>
        <th className="px-2 py-2 text-xs text-right w-24">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="px-2 py-2 text-xs truncate">...</td>
        <td className="px-2 py-2 text-xs text-right break-all">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4. Clientes Component (ClientesList.tsx)

**Cambios necesarios:**

1. **Cards**: Asegurar que tengan `max-w-full`
2. **Barra de búsqueda**: Verificar que no exceda el contenedor
3. **Formularios**: Inputs con `w-full` pero dentro de contenedores con padding apropiado

### 5. Cobros Component (RutaDelDia.tsx)

**Cambios necesarios:**

1. **Grids de estadísticas**: Verificar que `grid-cols-3` no cause overflow en pantallas pequeñas
2. **Cards de clientes**: Asegurar max-width
3. **Drag & drop**: Verificar que el dragging no cause overflow temporal

### 6. Productos Component (ProductosList.tsx)

**Cambios necesarios:**

1. **Lista de productos**: Asegurar contenedores con max-width
2. **Formularios**: Inputs y selects con anchos apropiados

## Data Models

No se requieren cambios en los modelos de datos. Este es un fix puramente de UI/CSS.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No horizontal overflow in any screen

*For any* pantalla de la aplicación (Cobros, Clientes, Balance, Productos), el ancho total del contenido renderizado no debe exceder el ancho del viewport (window.innerWidth)

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: All tables fit within viewport

*For any* tabla renderizada en cualquier componente, el ancho de la tabla debe ser menor o igual al ancho del contenedor padre, y el contenedor padre debe ser menor o igual al viewport width

**Validates: Requirements 2.1**

### Property 3: All text content respects boundaries

*For any* elemento de texto o número, el contenido debe estar contenido dentro de su contenedor sin causar overflow horizontal, ya sea mediante truncamiento, word-break, o font-size reducido

**Validates: Requirements 2.4**

### Property 4: Global overflow-x hidden is applied

*For any* elemento raíz (html, body, #root), la propiedad CSS `overflow-x` debe estar establecida en `hidden`

**Validates: Requirements 3.1**

### Property 5: All containers have max-width constraints

*For any* contenedor principal de componente, debe tener una restricción de `max-width` (ya sea 100%, 100vw, o un valor específico) que prevenga expansión más allá del viewport

**Validates: Requirements 3.2, 3.4**

## Error Handling

No se requiere manejo de errores específico para este fix. Si el scroll horizontal persiste después de aplicar los cambios, se debe:

1. Inspeccionar el elemento específico usando DevTools
2. Identificar qué propiedad CSS está causando el overflow
3. Aplicar override específico en el componente

## Testing Strategy

### Manual Testing

Dado que este es un fix visual de CSS, el testing será principalmente manual:

1. **Testing en diferentes viewports**:
   - Mobile: 375px, 390px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

2. **Testing por pantalla**:
   - Cobros: Verificar estadísticas, lista de clientes, drag & drop
   - Clientes: Verificar lista, búsqueda, formulario nuevo cliente, detalle
   - Balance: Verificar tablas de entradas/gastos, totales, formularios
   - Productos: Verificar lista, formulario nuevo producto

3. **Testing de interacciones**:
   - Scroll vertical debe funcionar normalmente
   - Modales y formularios deben ajustarse al viewport
   - Navegación entre pantallas no debe causar overflow temporal

### Automated Testing (Optional)

Se pueden crear tests automatizados usando Playwright o Cypress para verificar:

```typescript
// Ejemplo de test
test('No horizontal scroll in Balance screen', async () => {
  // Navegar a Balance
  await page.goto('/');
  await page.click('text=Caja');
  
  // Verificar que no hay scroll horizontal
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
```

### Property-Based Testing

Dado que este es un fix de UI, no es práctico implementar property-based testing. Los correctness properties serán verificados mediante testing manual y visual.

## Implementation Notes

### Orden de Implementación

1. **Primero**: Aplicar estilos globales en `index.css`
2. **Segundo**: Verificar y ajustar contenedor principal en `App.tsx`
3. **Tercero**: Ajustar componente Balance (más afectado)
4. **Cuarto**: Ajustar componentes Clientes, Cobros, Productos
5. **Quinto**: Testing exhaustivo en diferentes viewports

### Consideraciones de Performance

- Los cambios de CSS no deben afectar el performance
- `overflow-x: hidden` puede mejorar el performance al prevenir cálculos de scroll horizontal

### Consideraciones de Accesibilidad

- Asegurar que el truncamiento de texto no oculte información crítica
- Considerar tooltips para texto truncado si es necesario
- Mantener tamaños de fuente legibles (mínimo 12px)

### Tailwind Classes Útiles

- `overflow-x-hidden`: Prevenir scroll horizontal
- `max-w-full`: Limitar ancho al 100% del padre
- `w-full`: Ancho completo del contenedor
- `truncate`: Truncar texto con ellipsis
- `break-all`: Romper palabras largas
- `break-words`: Romper en límites de palabra
- `text-xs`, `text-sm`: Reducir tamaño de fuente
- `px-2`, `px-3`: Reducir padding horizontal
