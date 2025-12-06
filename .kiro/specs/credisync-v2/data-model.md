# CrediSync360 V2 - Modelo de Datos Definitivo

## 🎯 Principios de Diseño

1. **Datos Inmutables** - Solo INSERT, nunca UPDATE
2. **Event Sourcing** - Historial completo de cambios
3. **Calculated Properties** - Saldo, estado, etc. se calculan on-the-fly
4. **Single Source of Truth** - Cada dato en un solo lugar
5. **Optimizado para Queries** - Índices estratégicos

---

## 📊 Entidades Base

### 1. Cliente
```typescript
interface Cliente {
  id: string;                    // cliente-{timestamp}
  tenantId: string;              // tenant-001
  nombre: string;                // "Juan Pérez"
  documento: string;             // "12345678"
  telefono: string;              // "3001234567"
  direccion: string;             // "Calle 123"
  barrio: string;                // "Centro"
  referencia: string;            // "Casa azul al lado de..."
  latitud?: number;              // 6.248858
  longitud?: number;             // -75.572838
  createdAt: string;             // ISO timestamp
  createdBy: string;             // userId
}
```

**Queries Comunes:**
- Buscar por nombre/documento/teléfono
- Listar todos los clientes
- Obtener cliente por ID

---

### 2. Producto de Crédito
```typescript
interface ProductoCredito {
  id: string;                    // producto-diario-20
  tenantId: string;
  nombre: string;                // "Crédito Diario 20%"
  interesPorcentaje: number;     // 20
  numeroCuotas: number;          // 20
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  excluirDomingos: boolean;      // true
  montoMinimo?: number;          // 100
  montoMaximo?: number;          // 5000
  activo: boolean;               // true
  createdAt: string;
  createdBy: string;
}
```

**Queries Comunes:**
- Listar productos activos
- Obtener producto por ID

---

### 3. Crédito
```typescript
interface Credito {
  id: string;                    // credito-{timestamp}
  tenantId: string;
  clienteId: string;
  productoId: string;
  cobradorId: string;            // Usuario que otorgó el crédito
  
  // Datos del crédito
  montoOriginal: number;         // 1000
  interesPorcentaje: number;     // 20
  totalAPagar: number;           // 1200
  numeroCuotas: number;          // 20
  valorCuota: number;            // 60
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  
  // Fechas
  fechaDesembolso: string;       // "2025-12-01"
  fechaPrimeraCuota: string;     // "2025-12-02" (EDITABLE)
  fechaUltimaCuota: string;      // "2025-12-28"
  
  // Estado
  estado: 'ACTIVO' | 'CANCELADO' | 'CASTIGADO';
  
  // Metadata
  createdAt: string;
  createdBy: string;
}
```

**Queries Comunes:**
- Créditos de un cliente
- Créditos activos
- Créditos por cobrador

**IMPORTANTE:**
- `fechaPrimeraCuota` es EDITABLE al crear el crédito
- Por defecto es día siguiente a `fechaDesembolso`
- Se puede cambiar si es necesario

---

### 4. Cuota
```typescript
interface Cuota {
  id: string;                    // cuota-{creditoId}-{numero}
  tenantId: string;
  creditoId: string;
  clienteId: string;             // Desnormalizado para queries rápidas
  
  // Datos de la cuota
  numero: number;                // 1, 2, 3...
  fechaProgramada: string;       // "2025-12-02"
  montoProgramado: number;       // 60
  
  // Metadata
  createdAt: string;
  createdBy: string;
}
```

**Queries Comunes:**
- Cuotas de un crédito
- Cuotas de un cliente
- Cuotas por fecha (ruta del día)

**NOTA:**
- NO guardamos `montoPagado` ni `estado`
- Se calcula sumando pagos

---

### 5. Pago (Inmutable)
```typescript
interface Pago {
  id: string;                    // pago-{timestamp}-{random}
  tenantId: string;
  creditoId: string;
  cuotaId: string;
  clienteId: string;             // Desnormalizado
  cobradorId: string;            // Usuario que cobró
  
  // Datos del pago
  monto: number;                 // 60
  fecha: string;                 // "2025-12-05"
  
  // Ubicación (opcional)
  latitud?: number;
  longitud?: number;
  
  // Observaciones
  observaciones?: string;
  
  // Metadata
  createdAt: string;             // ISO timestamp exacto
  createdBy: string;
}
```

**Queries Comunes:**
- Pagos de un crédito
- Pagos de una cuota
- Pagos de un cliente
- Pagos por fecha (cierre de caja)
- Pagos por cobrador

**IMPORTANTE:**
- Los pagos son INMUTABLES
- Nunca se modifican ni eliminan
- Para corregir, crear pago negativo

---

### 6. Cierre de Caja
```typescript
interface CierreCaja {
  id: string;                    // cierre-{timestamp}
  tenantId: string;
  cobradorId: string;
  fecha: string;                 // "2025-12-05"
  
  // Datos del cierre
  cajaBase: number;              // Total del día anterior
  totalCobrado: number;          // Suma de pagos del día
  totalCreditosOtorgados: number;// Suma de créditos otorgados
  totalEntradas: number;         // Suma de entradas/inversiones
  totalGastos: number;           // Suma de gastos/salidas
  totalCaja: number;             // Base + Cobrado - Créditos + Entradas - Gastos
  
  // Estadísticas
  cuotasCobradas: number;
  cuotasTotales: number;
  clientesVisitados: number;
  observaciones?: string;
  
  // Metadata
  createdAt: string;
  createdBy: string;
}
```

**Queries Comunes:**
- Cierre de un día específico
- Cierres de un cobrador
- Cierre del día anterior (para calcular caja base)

**IMPORTANTE:**
- Solo puede haber UN cierre por cobrador por día
- La caja base se calcula del cierre del día anterior
- Si no hay cierre anterior, caja base = 0

---

### 7. Movimiento de Caja
```typescript
interface MovimientoCaja {
  id: string;                    // mov-{timestamp}-{random}
  tenantId: string;
  cobradorId: string;
  fecha: string;                 // "2025-12-05"
  tipo: 'ENTRADA' | 'GASTO';
  detalle: string;               // "Inversión inicial", "Gasolina"
  valor: number;                 // 50000
  
  // Metadata
  createdAt: string;
  createdBy: string;
}
```

**Queries Comunes:**
- Movimientos de un día
- Movimientos por tipo (ENTRADA o GASTO)
- Movimientos de un cobrador

**IMPORTANTE:**
- Los movimientos se pueden ELIMINAR solo antes del cierre
- Después del cierre, son inmutables
- Se usan para calcular el total de caja

---

## 🔄 Cálculos Derivados

### Estado de Caja:
```typescript
function calcularEstadoCaja(
  fecha: string,
  tenantId: string,
  cobradorId: string
): EstadoCaja {
  // 1. Verificar si hay cierre para hoy
  const cierreHoy = await db.cierres
    .where('[tenantId+cobradorId+fecha]')
    .equals([tenantId, cobradorId, fecha])
    .first();
  
  // 2. Obtener caja base del día anterior
  const ayer = new Date(fecha);
  ayer.setDate(ayer.getDate() - 1);
  const fechaAyer = ayer.toISOString().split('T')[0];
  
  const cierreAyer = await db.cierres
    .where('[tenantId+cobradorId+fecha]')
    .equals([tenantId, cobradorId, fechaAyer])
    .first();
  
  const cajaBase = cierreAyer ? cierreAyer.totalCaja : 0;
  
  // 3. Calcular totales del día
  const pagosHoy = await db.pagos
    .where('[tenantId+cobradorId+fecha]')
    .equals([tenantId, cobradorId, fecha])
    .toArray();
  const totalCobrado = pagosHoy.reduce((sum, p) => sum + p.monto, 0);
  
  const creditosHoy = await db.creditos
    .where('tenantId')
    .equals(tenantId)
    .filter(c => c.fechaDesembolso === fecha && c.cobradorId === cobradorId)
    .toArray();
  const totalCreditosOtorgados = creditosHoy.reduce((sum, c) => sum + c.montoOriginal, 0);
  
  const movimientosHoy = await db.movimientos
    .where('[tenantId+cobradorId+fecha]')
    .equals([tenantId, cobradorId, fecha])
    .toArray();
  
  const totalEntradas = movimientosHoy
    .filter(m => m.tipo === 'ENTRADA')
    .reduce((sum, m) => sum + m.valor, 0);
  
  const totalGastos = movimientosHoy
    .filter(m => m.tipo === 'GASTO')
    .reduce((sum, m) => sum + m.valor, 0);
  
  // 4. Calcular total de caja
  const totalCaja = cajaBase + totalCobrado - totalCreditosOtorgados + totalEntradas - totalGastos;
  
  return {
    fecha,
    estado: cierreHoy ? 'CERRADA' : 'ABIERTA',
    cajaBase,
    totalCobrado,
    totalCreditosOtorgados,
    totalEntradas,
    totalGastos,
    totalCaja
  };
}
```

### Estado de una Cuota:
```typescript
function calcularEstadoCuota(
  cuota: Cuota,
  pagos: Pago[]
): {
  montoPagado: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  diasAtraso: number;
} {
  // Sumar pagos de esta cuota
  const pagosCuota = pagos.filter(p => p.cuotaId === cuota.id);
  const montoPagado = pagosCuota.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = Math.max(0, cuota.montoProgramado - montoPagado);
  
  // Determinar estado
  let estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  if (montoPagado === 0) {
    estado = 'PENDIENTE';
  } else if (montoPagado < cuota.montoProgramado) {
    estado = 'PARCIAL';
  } else {
    estado = 'PAGADA';
  }
  
  // Calcular días de atraso
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaCuota = new Date(cuota.fechaProgramada);
  fechaCuota.setHours(0, 0, 0, 0);
  
  let diasAtraso = 0;
  if (estado !== 'PAGADA' && hoy > fechaCuota) {
    diasAtraso = Math.floor((hoy.getTime() - fechaCuota.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return { montoPagado, saldoPendiente, estado, diasAtraso };
}
```

### Estado de un Crédito:
```typescript
function calcularEstadoCredito(
  credito: Credito,
  cuotas: Cuota[],
  pagos: Pago[]
): {
  saldoPendiente: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  diasAtraso: number;
  estadoCalculado: 'AL_DIA' | 'MORA' | 'CANCELADO';
} {
  // Calcular saldo pendiente
  const totalCuotas = cuotas.reduce((sum, c) => sum + c.montoProgramado, 0);
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = Math.max(0, totalCuotas - totalPagos);
  
  // Contar cuotas pagadas
  let cuotasPagadas = 0;
  let diasAtrasoMax = 0;
  
  for (const cuota of cuotas) {
    const estado = calcularEstadoCuota(cuota, pagos);
    if (estado.estado === 'PAGADA') {
      cuotasPagadas++;
    }
    diasAtrasoMax = Math.max(diasAtrasoMax, estado.diasAtraso);
  }
  
  const cuotasPendientes = credito.numeroCuotas - cuotasPagadas;
  
  // Determinar estado
  let estadoCalculado: 'AL_DIA' | 'MORA' | 'CANCELADO';
  if (saldoPendiente === 0) {
    estadoCalculado = 'CANCELADO';
  } else if (diasAtrasoMax > 0) {
    estadoCalculado = 'MORA';
  } else {
    estadoCalculado = 'AL_DIA';
  }
  
  return {
    saldoPendiente,
    cuotasPagadas,
    cuotasPendientes,
    diasAtraso: diasAtrasoMax,
    estadoCalculado
  };
}
```

### Estado de un Cliente:
```typescript
function calcularEstadoCliente(
  cliente: Cliente,
  creditos: Credito[],
  cuotas: Cuota[],
  pagos: Pago[]
): {
  creditosActivos: number;
  saldoTotal: number;
  diasAtrasoMax: number;
  estado: 'SIN_CREDITOS' | 'AL_DIA' | 'MORA';
  score: 'CONFIABLE' | 'REGULAR' | 'RIESGOSO';
} {
  const creditosActivos = creditos.filter(c => c.estado === 'ACTIVO');
  
  if (creditosActivos.length === 0) {
    return {
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: calcularScore(cliente, creditos, cuotas, pagos)
    };
  }
  
  let saldoTotal = 0;
  let diasAtrasoMax = 0;
  
  for (const credito of creditosActivos) {
    const cuotasCredito = cuotas.filter(c => c.creditoId === credito.id);
    const pagosCredito = pagos.filter(p => p.creditoId === credito.id);
    const estado = calcularEstadoCredito(credito, cuotasCredito, pagosCredito);
    
    saldoTotal += estado.saldoPendiente;
    diasAtrasoMax = Math.max(diasAtrasoMax, estado.diasAtraso);
  }
  
  const estado = diasAtrasoMax > 0 ? 'MORA' : 'AL_DIA';
  
  return {
    creditosActivos: creditosActivos.length,
    saldoTotal,
    diasAtrasoMax,
    estado,
    score: calcularScore(cliente, creditos, cuotas, pagos)
  };
}
```

### Score del Cliente:
```typescript
function calcularScore(
  cliente: Cliente,
  creditos: Credito[],
  cuotas: Cuota[],
  pagos: Pago[]
): 'CONFIABLE' | 'REGULAR' | 'RIESGOSO' {
  const creditosCancelados = creditos.filter(c => c.estado === 'CANCELADO');
  
  // Contar créditos pagados sin mora
  let creditosSinMora = 0;
  let creditosConMora = 0;
  
  for (const credito of creditosCancelados) {
    const cuotasCredito = cuotas.filter(c => c.creditoId === credito.id);
    const pagosCredito = pagos.filter(p => p.creditoId === credito.id);
    const estado = calcularEstadoCredito(credito, cuotasCredito, pagosCredito);
    
    if (estado.diasAtraso === 0) {
      creditosSinMora++;
    } else {
      creditosConMora++;
    }
  }
  
  // Determinar score
  if (creditosSinMora >= 3 && creditosConMora === 0) {
    return 'CONFIABLE';
  } else if (creditosConMora > creditosSinMora) {
    return 'RIESGOSO';
  } else {
    return 'REGULAR';
  }
}
```

---

## 📊 Queries Optimizadas

### Ruta del Día:
```typescript
async function obtenerRutaDelDia(
  tenantId: string,
  cobradorId: string,
  fecha: string
): Promise<ClienteConCuota[]> {
  // 1. Obtener cuotas del día
  const cuotasDelDia = await db.cuotas
    .where('[tenantId+fechaProgramada]')
    .equals([tenantId, fecha])
    .toArray();
  
  // 2. Obtener clientes únicos
  const clienteIds = [...new Set(cuotasDelDia.map(c => c.clienteId))];
  const clientes = await db.clientes
    .where('id')
    .anyOf(clienteIds)
    .toArray();
  
  // 3. Obtener todos los créditos y pagos necesarios
  const creditoIds = [...new Set(cuotasDelDia.map(c => c.creditoId))];
  const creditos = await db.creditos
    .where('id')
    .anyOf(creditoIds)
    .toArray();
  
  const pagos = await db.pagos
    .where('clienteId')
    .anyOf(clienteIds)
    .toArray();
  
  // 4. Calcular estado de cada cliente
  return clientes.map(cliente => {
    const creditosCliente = creditos.filter(c => c.clienteId === cliente.id);
    const cuotasCliente = cuotasDelDia.filter(c => c.clienteId === cliente.id);
    const pagosCliente = pagos.filter(p => p.clienteId === cliente.id);
    
    // Calcular cuotas atrasadas
    const cuotasAtrasadas = cuotasCliente.filter(cuota => {
      const estado = calcularEstadoCuota(cuota, pagosCliente);
      return estado.diasAtraso > 0;
    });
    
    // Calcular saldo total a cobrar
    const saldoACobrar = cuotasCliente.reduce((sum, cuota) => {
      const estado = calcularEstadoCuota(cuota, pagosCliente);
      return sum + estado.saldoPendiente;
    }, 0);
    
    return {
      ...cliente,
      cuotasAtrasadas: cuotasAtrasadas.length,
      saldoACobrar,
      diasAtraso: Math.max(...cuotasCliente.map(c => 
        calcularEstadoCuota(c, pagosCliente).diasAtraso
      ))
    };
  });
}
```

---

## 🔐 Índices de Dexie

```typescript
class CrediSyncDB extends Dexie {
  clientes!: Table<Cliente>;
  creditos!: Table<Credito>;
  cuotas!: Table<Cuota>;
  pagos!: Table<Pago>;
  productos!: Table<ProductoCredito>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('credisync-v2');
    
    this.version(1).stores({
      // Clientes
      clientes: 'id, tenantId, documento, nombre, [tenantId+nombre]',
      
      // Créditos
      creditos: 'id, tenantId, clienteId, cobradorId, estado, [tenantId+clienteId], [tenantId+estado]',
      
      // Cuotas
      cuotas: 'id, tenantId, creditoId, clienteId, fechaProgramada, [tenantId+fechaProgramada], [tenantId+clienteId], [clienteId+fechaProgramada]',
      
      // Pagos
      pagos: 'id, tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha, [tenantId+fecha], [tenantId+cobradorId+fecha], [clienteId+fecha]',
      
      // Productos
      productos: 'id, tenantId, activo, [tenantId+activo]',
      
      // Cola de sincronización
      syncQueue: '++id, status, type, timestamp, [status+timestamp]'
    });
  }
}
```

---

**Próximo:** Ver `implementation.md` para plan de desarrollo
