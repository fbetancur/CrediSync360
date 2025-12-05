# 🧪 Guía de Testing - CrediSync360 V2

## 🚀 Cómo Ver la Aplicación

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:5174/**

### 2. Agregar Datos de Prueba

La aplicación usa IndexedDB (Dexie) para almacenamiento local. Para ver la interfaz funcionando, necesitas agregar datos de prueba.

#### Opción A: Desde la Consola del Navegador

1. Abre la aplicación en el navegador
2. Abre las DevTools (F12)
3. Ve a la pestaña **Console**
4. Ejecuta:

```javascript
// Limpiar y agregar datos de prueba
await window.seedData.resetAndSeed()

// Luego recarga la página
location.reload()
```

#### Opción B: Datos Incluidos

Los datos de prueba incluyen:

- **5 clientes** con diferentes estados:
  - María García: 5 días de atraso (aparecerá primero, tarjeta roja)
  - Juan Pérez: 5 días de atraso (aparecerá segundo, tarjeta roja)
  - Ana Rodríguez: Cuota de hoy (tarjeta verde)
  - Carlos López: Al día (tarjeta verde)
  - Laura Martínez: Al día (tarjeta verde)

- **5 créditos** de $300,000 cada uno
- **50 cuotas** de $30,000 cada una

### 3. Funcionalidades para Probar

#### ✅ Pantalla Principal (Ruta del Día)

- **Resumen del día**: Verás 3 tarjetas con estadísticas
  - Total cobrado hoy: $0 (aún no hay pagos)
  - Cuotas cobradas: 0
  - Cuotas pendientes: 50

- **Lista de clientes**: Ordenados por prioridad
  - Los clientes con atraso aparecen primero (tarjetas rojas)
  - Ordenados por días de atraso descendente
  - Los clientes al día aparecen después (tarjetas verdes)

- **Tarjetas de cliente**: Cada tarjeta muestra
  - Nombre del cliente
  - Estado (MORA o AL DÍA)
  - Número de cuotas pendientes
  - Días de atraso (si aplica)
  - Monto total a cobrar
  - Dirección y barrio

#### ✅ Drag & Drop

- Arrastra cualquier tarjeta para reordenar la ruta
- El orden se guarda localmente

#### ✅ Registrar Pago

- Al hacer click en una tarjeta, se abre el modal de registro de pago
- El modal muestra:
  - Información del cliente (nombre, documento, teléfono, dirección)
  - Información del crédito (cuotas pendientes, saldo pendiente)
  - Input de monto (pre-llenado con el saldo pendiente)
  - Textarea para observaciones (opcional, máx 500 caracteres)
  - Botones Cancelar y Confirmar Pago
- Al confirmar:
  - Se valida que el monto sea mayor a 0
  - Se captura la ubicación GPS automáticamente
  - Se distribuye el pago entre las cuotas en orden cronológico
  - Se guarda en IndexedDB
  - Se agrega a la cola de sincronización
  - La UI se actualiza automáticamente

## 🧪 Tests Unitarios

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

### Tests Actuales

- ✅ **21 tests pasando** (100%)
  - 18 unit tests
  - 3 property-based tests

- **Funciones testeadas**:
  - `calcularSaldoPendiente`: 5 tests
  - `distribuirPago`: 7 tests
  - `generarFechasCuotas`: 6 tests
  - Property 5: Payment Distribution Correctness
  - Property 7: Balance Calculation Consistency
  - Property 11: No Sundays when excluirDomingos=true

## 🔍 Inspeccionar la Base de Datos

### Usando Chrome DevTools

1. Abre DevTools (F12)
2. Ve a la pestaña **Application**
3. En el panel izquierdo, expande **IndexedDB**
4. Verás la base de datos **CrediSync360DB**
5. Puedes explorar las tablas:
   - `clientes`
   - `creditos`
   - `cuotas`
   - `pagos`
   - `productos`
   - `cierres`
   - `syncQueue`

### Limpiar la Base de Datos

Si quieres empezar de cero:

```javascript
// En la consola del navegador
await window.seedData.clearDatabase()
location.reload()
```

## 📊 Verificar Funcionalidades

### ✅ Agrupación de Cuotas Atrasadas

- María García tiene 5 cuotas atrasadas
- Debe aparecer **1 sola tarjeta** con el total de las 5 cuotas
- Esto valida **Property 2: Overdue Grouping Consistency**

### ✅ Ordenamiento de Ruta

- Los clientes con atraso aparecen primero
- Ordenados por días de atraso descendente (5 días antes que 3 días)
- Los clientes al día aparecen después
- Esto valida **Property 3: Route Ordering Invariant**

### ✅ Virtualización

- Si agregas más de 50 clientes, la lista se virtualiza automáticamente
- Esto mejora el performance para 200+ clientes

## ⚠️ Warnings Conocidos (Normales en Desarrollo)

Estos warnings aparecen en la consola pero **NO afectan la funcionalidad**:

### 1. `Support for defaultProps will be removed from memo components`
- **Causa**: `react-beautiful-dnd` usa una API antigua de React
- **Impacto**: Ninguno. Es solo un aviso de desarrollo
- **Solución**: Se eliminará automáticamente en producción

### 2. `Unable to find draggable with id: cliente-X`
- **Causa**: `react-beautiful-dnd` busca elementos antes de que se rendericen
- **Impacto**: Ninguno. El drag & drop funciona perfectamente
- **Solución**: Es un mensaje de desarrollo, desaparece en producción

**✅ El drag & drop funciona correctamente a pesar de estos warnings.**

### Cómo Probar el Drag & Drop

1. **Haz click y mantén presionado** sobre cualquier parte de una tarjeta de cliente
2. **Arrastra** la tarjeta hacia arriba o abajo
3. **Suelta** para reordenar
4. **Verifica** en la consola: `✅ Ruta reordenada: [...]`

**Nota**: El cursor cambiará a una "mano" (grab) cuando pases sobre la tarjeta, indicando que se puede arrastrar.

## 🐛 Troubleshooting

### La aplicación muestra "No hay cobros pendientes"

- Asegúrate de haber ejecutado `window.seedData.resetAndSeed()`
- Recarga la página después de agregar datos

### Error "Cannot read property 'seedData' of undefined"

- Asegúrate de que el servidor de desarrollo esté corriendo
- Recarga la página completamente (Ctrl+Shift+R)

### Los tests fallan

- Verifica que todas las dependencias estén instaladas: `npm install`
- Ejecuta `npm test` para ver el error específico

### El drag & drop no funciona

- Asegúrate de hacer click y mantener presionado
- Arrastra la tarjeta al menos 10px antes de soltar
- Verifica que haya datos de prueba cargados

## 📝 Próximas Funcionalidades

- [ ] Modal de registro de pagos
- [ ] Pantalla de gestión de clientes
- [ ] Pantalla de detalle de cliente
- [ ] Cierre de caja
- [ ] Sincronización con el servidor

## 🎯 Performance

La aplicación está optimizada para:
- ✅ 200+ clientes en la ruta
- ✅ < 100ms respuesta UI
- ✅ Virtualización automática
- ✅ Offline-first (funciona sin internet)
