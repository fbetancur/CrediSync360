# 📊 MODELO DE DATOS - CrediSync360 V2

**Última actualización:** 6 de diciembre de 2025  
**Versión:** 2.0 (Multitenant con campos calculados)

---

## 🎯 ARQUITECTURA

### Principios de Diseño

1. **Multitenant:** Todos los modelos incluyen `tenantId` para aislamiento de datos
2. **Offline-First:** Campos calculados pre-computados para rendimiento
3. **Inmutabilidad:** Los pagos son inmutables (no se pueden editar ni eliminar)
4. **Relaciones Bidireccionales:** Todas las relaciones FK tienen belongsTo/hasMany

---

## 📋 MODELOS

### 1. Ruta

Representa una ruta de cobro asignada a un supervisor.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required) - Identificador del tenant
- `nombre`: String (required) - Nombre de la ruta
- `supervisorId`: String (required) - ID del supervisor
- `activa`: Boolean (required) - Si la ruta está activa

**Relaciones:**
- `clientes`: hasMany Cliente
- `creditos`: hasMany Credito
- `cuotas`: hasMany Cuota
- `pagos`: hasMany Pago
- `cierres`: hasMany CierreCaja
- `movimientos`: hasMany MovimientoCaja

**Índices:**
- Primary: `id`
- Tenant: `tenantId`

---

### 2. Cliente

Representa un cliente que recibe créditos.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `nombre`: String (required)
- `documento`: String (required)
- `telefono`: String (required)
- `direccion`: String (required)
- `barrio`: String (optional)
- `referencia`: String (optional)
- `latitud`: Float (optional)
- `longitud`: Float (optional)

**Campos Calculados (Optimización):**
- `creditosActivos`: Integer (required) - Número de créditos activos
- `saldoTotal`: Float (required) - Suma de saldos pendientes
- `diasAtrasoMax`: Integer (required) - Máximo días de atraso
- `estado`: Enum (optional) - SIN_CREDITOS | AL_DIA | MORA
- `score`: Enum (optional) - CONFIABLE | REGULAR | RIESGOSO
- `ultimaActualizacion`: String (required) - ISO timestamp

**Relaciones:**
- `ruta`: belongsTo Ruta
- `creditos`: hasMany Credito
- `cuotas`: hasMany Cuota
- `pagos`: hasMany Pago

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+rutaId]`
- Búsqueda: `documento`, `nombre`

---

### 3. ProductoCredito

Representa un producto de crédito con sus condiciones.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `nombre`: String (required)
- `interesPorcentaje`: Float (required)
- `numeroCuotas`: Integer (required)
- `frecuencia`: Enum (required) - DIARIO | SEMANAL | QUINCENAL | MENSUAL
- `excluirDomingos`: Boolean (required)
- `montoMinimo`: Float (optional)
- `montoMaximo`: Float (optional)
- `activo`: Boolean (required)

**Relaciones:**
- `creditos`: hasMany Credito

**Índices:**
- Primary: `id`
- Tenant: `tenantId`
- Filtro: `activo`

---

### 4. Credito

Representa un crédito otorgado a un cliente.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `clienteId`: ID (required) - FK a Cliente
- `productoId`: ID (required) - FK a ProductoCredito
- `cobradorId`: String (required)
- `montoOriginal`: Float (required)
- `interesPorcentaje`: Float (required)
- `totalAPagar`: Float (required)
- `numeroCuotas`: Integer (required)
- `valorCuota`: Float (required)
- `frecuencia`: Enum (required) - DIARIO | SEMANAL | QUINCENAL | MENSUAL
- `fechaDesembolso`: Date (required)
- `fechaPrimeraCuota`: Date (required)
- `fechaUltimaCuota`: Date (required)
- `estado`: Enum (optional) - ACTIVO | CANCELADO | CASTIGADO

**Campos Calculados (Optimización):**
- `saldoPendiente`: Float (required) - Saldo pendiente total
- `cuotasPagadas`: Integer (required) - Número de cuotas pagadas
- `diasAtraso`: Integer (required) - Días de atraso máximo
- `ultimaActualizacion`: String (required) - ISO timestamp

**Relaciones:**
- `ruta`: belongsTo Ruta
- `cliente`: belongsTo Cliente
- `producto`: belongsTo ProductoCredito
- `cuotas`: hasMany Cuota
- `pagos`: hasMany Pago

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+clienteId]`
- Compuesto: `[tenantId+rutaId]`
- Filtro: `estado`

---

### 5. Cuota

Representa una cuota de un crédito.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `creditoId`: ID (required) - FK a Credito
- `clienteId`: ID (required) - FK a Cliente
- `cobradorId`: String (required)
- `numero`: Integer (required) - Número de cuota (1, 2, 3...)
- `fechaProgramada`: Date (required)
- `montoProgramado`: Float (required)

**Campos Calculados (Optimización):**
- `montoPagado`: Float (required) - Suma de pagos aplicados
- `saldoPendiente`: Float (required) - montoProgramado - montoPagado
- `estado`: Enum (required) - PENDIENTE | PARCIAL | PAGADA
- `diasAtraso`: Integer (required) - Días de atraso
- `ultimaActualizacion`: String (required) - ISO timestamp

**Relaciones:**
- `ruta`: belongsTo Ruta
- `credito`: belongsTo Credito
- `cliente`: belongsTo Cliente
- `pagos`: hasMany Pago

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+cobradorId+fechaProgramada]` - Para ruta del día
- Compuesto: `[tenantId+creditoId]`
- Filtro: `estado`

---

### 6. Pago

Representa un pago realizado a una cuota. **INMUTABLE**.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `creditoId`: ID (required) - FK a Credito
- `cuotaId`: ID (required) - FK a Cuota
- `clienteId`: ID (required) - FK a Cliente
- `cobradorId`: String (required)
- `monto`: Float (required)
- `fecha`: Date (required)
- `latitud`: Float (optional)
- `longitud`: Float (optional)
- `observaciones`: String (optional)

**Relaciones:**
- `ruta`: belongsTo Ruta
- `credito`: belongsTo Credito
- `cuota`: belongsTo Cuota
- `cliente`: belongsTo Cliente

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+cuotaId]`
- Compuesto: `[tenantId+fecha]`

**Reglas:**
- ❌ NO se puede actualizar
- ❌ NO se puede eliminar
- ✅ Solo se puede crear

---

### 7. CierreCaja

Representa el cierre de caja diario de un cobrador.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `cobradorId`: String (required)
- `fecha`: Date (required)
- `cajaBase`: Float (required)
- `totalCobrado`: Float (required)
- `totalCreditosOtorgados`: Float (required)
- `totalEntradas`: Float (required)
- `totalGastos`: Float (required)
- `totalCaja`: Float (required)
- `cuotasCobradas`: Integer (required)
- `cuotasTotales`: Integer (required)
- `clientesVisitados`: Integer (required)
- `observaciones`: String (optional)

**Relaciones:**
- `ruta`: belongsTo Ruta

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+cobradorId+fecha]`

---

### 8. MovimientoCaja

Representa entradas y gastos de caja.

**Campos:**
- `id`: ID (auto-generado)
- `tenantId`: String (required)
- `rutaId`: ID (required) - FK a Ruta
- `cobradorId`: String (required)
- `fecha`: Date (required)
- `tipo`: Enum (required) - ENTRADA | GASTO
- `detalle`: String (required)
- `valor`: Float (required)

**Relaciones:**
- `ruta`: belongsTo Ruta

**Índices:**
- Primary: `id`
- Compuesto: `[tenantId+cobradorId+fecha]`

---

## 🔗 MATRIZ DE RELACIONES

| Modelo Hijo | Campo FK | belongsTo | Modelo Padre | hasMany | Tipo |
|-------------|----------|-----------|--------------|---------|------|
| Cliente | rutaId | ✅ ruta | Ruta | ✅ clientes | 1:N |
| Credito | rutaId | ✅ ruta | Ruta | ✅ creditos | 1:N |
| Credito | clienteId | ✅ cliente | Cliente | ✅ creditos | 1:N |
| Credito | productoId | ✅ producto | ProductoCredito | ✅ creditos | 1:N |
| Cuota | rutaId | ✅ ruta | Ruta | ✅ cuotas | 1:N |
| Cuota | creditoId | ✅ credito | Credito | ✅ cuotas | 1:N |
| Cuota | clienteId | ✅ cliente | Cliente | ✅ cuotas | 1:N |
| Pago | rutaId | ✅ ruta | Ruta | ✅ pagos | 1:N |
| Pago | creditoId | ✅ credito | Credito | ✅ pagos | 1:N |
| Pago | cuotaId | ✅ cuota | Cuota | ✅ pagos | 1:N |
| Pago | clienteId | ✅ cliente | Cliente | ✅ pagos | 1:N |
| CierreCaja | rutaId | ✅ ruta | Ruta | ✅ cierres | 1:N |
| MovimientoCaja | rutaId | ✅ ruta | Ruta | ✅ movimientos | 1:N |

**Total:** 13 relaciones bidireccionales ✅

---

## 📊 DIAGRAMA DE RELACIONES

```
Ruta (1) ──────────────┬─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
                       │                 │              │              │              │              │
                       ↓ (N)             ↓ (N)          ↓ (N)          ↓ (N)          ↓ (N)          ↓ (N)
                    Cliente          Credito         Cuota          Pago       CierreCaja    MovimientoCaja
                       │                 │              │              │
                       │                 │              │              │
ProductoCredito (1) ───┼─────────────────┘              │              │
                       │                                │              │
                       │                                │              │
                       └────────────────────────────────┴──────────────┘
                       
Cliente (1) ────────────┬─────────────────┬──────────────┐
                        │                 │              │
                        ↓ (N)             ↓ (N)          ↓ (N)
                     Credito           Cuota          Pago
                        │                 │              │
                        │                 │              │
                        └─────────────────┴──────────────┘

Credito (1) ────────────┬─────────────────┐
                        │                 │
                        ↓ (N)             ↓ (N)
                      Cuota             Pago
                        │                 │
                        │                 │
                        └─────────────────┘

Cuota (1) ──────────────┐
                        │
                        ↓ (N)
                      Pago
```

---

## 🎯 CAMPOS CALCULADOS

Los campos calculados se pre-computan para optimizar el rendimiento en dispositivos móviles.

### Cliente
- `creditosActivos`: Cuenta de créditos con estado ACTIVO
- `saldoTotal`: Suma de `credito.saldoPendiente` de todos los créditos activos
- `diasAtrasoMax`: Máximo de `credito.diasAtraso` de todos los créditos activos
- `estado`: Calculado según creditosActivos y diasAtrasoMax
- `score`: Calculado según historial de pagos
- `ultimaActualizacion`: Timestamp de última modificación

### Credito
- `saldoPendiente`: Suma de `cuota.saldoPendiente` de todas las cuotas
- `cuotasPagadas`: Cuenta de cuotas con estado PAGADA
- `diasAtraso`: Máximo de `cuota.diasAtraso` de todas las cuotas
- `ultimaActualizacion`: Timestamp de última modificación

### Cuota
- `montoPagado`: Suma de `pago.monto` de todos los pagos aplicados
- `saldoPendiente`: `montoProgramado - montoPagado`
- `estado`: PENDIENTE (montoPagado=0) | PARCIAL (0<montoPagado<montoProgramado) | PAGADA (montoPagado>=montoProgramado)
- `diasAtraso`: Días entre hoy y fechaProgramada (si saldoPendiente > 0)
- `ultimaActualizacion`: Timestamp de última modificación

---

## 🔄 ACTUALIZACIÓN DE CAMPOS CALCULADOS

Los campos calculados se actualizan automáticamente mediante `actualizarCampos.ts`:

### Trigger: Crear Pago
1. Actualizar `Cuota`: montoPagado, saldoPendiente, estado, diasAtraso
2. Actualizar `Credito`: saldoPendiente, cuotasPagadas, diasAtraso
3. Actualizar `Cliente`: saldoTotal, diasAtrasoMax, estado

### Trigger: Crear Crédito
1. Actualizar `Cliente`: creditosActivos, saldoTotal, estado

### Trigger: Cambiar Estado Crédito
1. Actualizar `Cliente`: creditosActivos, saldoTotal, diasAtrasoMax, estado

---

## 📝 REGLAS DE NEGOCIO

### Cliente
- Un cliente puede tener múltiples créditos
- Un cliente debe pertenecer a una ruta
- El estado se calcula automáticamente:
  - `SIN_CREDITOS`: creditosActivos = 0
  - `AL_DIA`: creditosActivos > 0 && diasAtrasoMax <= 3
  - `MORA`: creditosActivos > 0 && diasAtrasoMax > 3

### Crédito
- Un crédito pertenece a un cliente y una ruta
- Un crédito se basa en un producto de crédito
- Al crear un crédito, se generan automáticamente todas las cuotas
- El saldoPendiente se actualiza con cada pago

### Cuota
- Una cuota pertenece a un crédito, cliente y ruta
- Las cuotas se generan automáticamente al crear el crédito
- El estado se actualiza automáticamente con cada pago
- Los días de atraso se calculan diariamente

### Pago
- Un pago es INMUTABLE (no se puede editar ni eliminar)
- Un pago se aplica a una cuota específica
- Un pago actualiza automáticamente los campos calculados
- Se puede registrar ubicación GPS del pago

### CierreCaja
- Un cobrador debe hacer un cierre diario
- El cierre incluye todos los movimientos del día
- Solo puede haber un cierre por cobrador por día

---

## 🔐 SEGURIDAD

### Aislamiento Multitenant
- Todos los modelos incluyen `tenantId`
- Todas las queries filtran por `tenantId`
- No se puede acceder a datos de otros tenants

### Autorización
- Actualmente: `publicApiKey` (desarrollo)
- Futuro (Fase 9): Cognito User Pools con roles

---

## 📊 ÍNDICES OPTIMIZADOS

### Índices Compuestos (Dexie)
```typescript
clientes: '[tenantId+rutaId], documento, nombre'
creditos: '[tenantId+clienteId], [tenantId+rutaId], estado'
cuotas: '[tenantId+cobradorId+fechaProgramada], [tenantId+creditoId], estado'
pagos: '[tenantId+cuotaId], [tenantId+fecha]'
cierres: '[tenantId+cobradorId+fecha]'
movimientos: '[tenantId+cobradorId+fecha]'
```

### Índices AWS AppSync
- Automáticos por Amplify Gen2
- GSI por tenantId en todos los modelos
- GSI por campos FK para relaciones

---

## 🚀 OPTIMIZACIONES

### 1. Campos Calculados Pre-computados
- Reduce cálculos en tiempo real
- Mejora rendimiento en móviles
- Actualización incremental

### 2. Índices Compuestos
- Queries optimizadas para ruta del día
- Filtrado eficiente por cobrador
- Reducción de datos cargados (150x menos)

### 3. Offline-First
- Datos en IndexedDB local
- Sincronización en background
- Funciona sin conexión

---

## 📚 REFERENCIAS

- **Schema Amplify:** `amplify/data/resource.ts`
- **Schema Dexie:** `src/lib/db.ts`
- **Tipos TypeScript:** `src/types/index.ts`
- **Actualización Campos:** `src/lib/actualizarCampos.ts`
- **Cálculos:** `src/lib/calculos.ts`

---

**Última actualización:** 6 de diciembre de 2025  
**Versión del Schema:** 2.0  
**Estado:** ✅ Validado y en producción
