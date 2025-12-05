# CrediSync360 V2 - Arquitectura AWS Amplify Gen2

## 🏗️ Stack Tecnológico

### Frontend:
- **React 18** + TypeScript
- **Vite** (build ultra-rápido)
- **Tailwind CSS** (estilos)
- **Dexie.js** (IndexedDB)
- **React DnD** (drag & drop)
- **date-fns** (fechas)

### Backend (AWS Amplify Gen2):
- **Cognito** - Autenticación
- **AppSync** - GraphQL API
- **DynamoDB** - Base de datos
- **S3** - Archivos (fotos, reportes)
- **Lambda** - Funciones serverless
- **CloudWatch** - Monitoreo

### PWA:
- **Workbox** - Service Worker
- **Web App Manifest**
- **Push Notifications**

---

## 📊 Modelo de Datos (DynamoDB)

### Principios de Diseño:
1. **Single Table Design** - Una tabla para todo
2. **Partition Key = tenantId** - Aislamiento multitenant
3. **Sort Key = tipo#id** - Queries eficientes
4. **GSI para queries comunes**
5. **Datos inmutables** - Solo INSERT, no UPDATE

### Tabla Principal: `credisync-data`

```typescript
// Partition Key: PK (tenantId)
// Sort Key: SK (tipo#id#timestamp)

interface DynamoDBItem {
  PK: string;           // tenant-001
  SK: string;           // CLIENTE#cliente-123 | PAGO#pago-456#2025-12-05T10:30:00Z
  type: string;         // CLIENTE | CREDITO | CUOTA | PAGO
  data: any;            // Datos del registro
  createdAt: string;    // ISO timestamp
  createdBy: string;    // userId
  version: number;      // Para optimistic locking
}
```

### Ejemplos de Registros:

**Cliente:**
```json
{
  "PK": "tenant-001",
  "SK": "CLIENTE#cliente-123",
  "type": "CLIENTE",
  "data": {
    "id": "cliente-123",
    "nombre": "Juan Pérez",
    "documento": "12345678",
    "telefono": "3001234567",
    "direccion": "Calle 123",
    "barrio": "Centro",
    "referencia": "Casa azul",
    "latitud": 6.248858,
    "longitud": -75.572838
  },
  "createdAt": "2025-12-01T10:00:00Z",
  "createdBy": "cobrador-001",
  "version": 1
}
```

**Crédito:**
```json
{
  "PK": "tenant-001",
  "SK": "CREDITO#credito-456",
  "type": "CREDITO",
  "data": {
    "id": "credito-456",
    "clienteId": "cliente-123",
    "productoId": "producto-diario-20",
    "cobradorId": "cobrador-001",
    "montoOriginal": 1000,
    "interesPorcentaje": 20,
    "totalAPagar": 1200,
    "numeroCuotas": 20,
    "valorCuota": 60,
    "frecuencia": "DIARIO",
    "fechaDesembolso": "2025-12-01",
    "fechaPrimeraCuota": "2025-12-02",
    "fechaUltimaCuota": "2025-12-28"
  },
  "createdAt": "2025-12-01T10:30:00Z",
  "createdBy": "cobrador-001",
  "version": 1
}
```

**Cuota:**
```json
{
  "PK": "tenant-001",
  "SK": "CUOTA#cuota-789",
  "type": "CUOTA",
  "data": {
    "id": "cuota-789",
    "creditoId": "credito-456",
    "clienteId": "cliente-123",
    "numero": 1,
    "fechaProgramada": "2025-12-02",
    "montoProgramado": 60
  },
  "createdAt": "2025-12-01T10:30:00Z",
  "createdBy": "cobrador-001",
  "version": 1
}
```

**Pago (Inmutable):**
```json
{
  "PK": "tenant-001",
  "SK": "PAGO#pago-999#2025-12-05T14:30:00Z",
  "type": "PAGO",
  "data": {
    "id": "pago-999",
    "creditoId": "credito-456",
    "cuotaId": "cuota-789",
    "clienteId": "cliente-123",
    "cobradorId": "cobrador-001",
    "monto": 60,
    "fecha": "2025-12-05",
    "latitud": 6.248858,
    "longitud": -75.572838,
    "observaciones": "Cliente pagó completo"
  },
  "createdAt": "2025-12-05T14:30:00Z",
  "createdBy": "cobrador-001",
  "version": 1
}
```

### GSI (Global Secondary Indexes):

**GSI1: Queries por Cliente**
```
PK: clienteId
SK: type#createdAt
```
Uso: Obtener todos los créditos/pagos de un cliente

**GSI2: Queries por Cobrador**
```
PK: cobradorId
SK: fecha#type
```
Uso: Ruta del día, cierre de caja

**GSI3: Queries por Fecha**
```
PK: tenantId#fecha
SK: type#id
```
Uso: Reportes, analytics

---

## 🔄 Sincronización Offline-First

### Arquitectura:

```
┌─────────────────┐
│   React App     │
│                 │
│  ┌───────────┐  │
│  │ IndexedDB │  │ ← Datos locales (instantáneo)
│  └───────────┘  │
│        ↕         │
│  ┌───────────┐  │
│  │ SyncQueue │  │ ← Cola de operaciones pendientes
│  └───────────┘  │
└────────┬────────┘
         │
         ↓ (Background sync cada 30s)
┌─────────────────┐
│   AppSync API   │
│   (GraphQL)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   DynamoDB      │
│   (Servidor)    │
└─────────────────┘
```

### Flujo de Sincronización:

**1. Operación Local (Registrar Pago):**
```typescript
async function registrarPago(pago: Pago) {
  // 1. Guardar en IndexedDB (instantáneo)
  await db.pagos.add(pago);
  
  // 2. Agregar a cola de sincronización
  await db.syncQueue.add({
    type: 'CREATE_PAGO',
    data: pago,
    timestamp: Date.now(),
    retries: 0,
    status: 'PENDING'
  });
  
  // 3. UI se actualiza inmediatamente
  return pago;
}
```

**2. Sincronización Background:**
```typescript
// Cada 30 segundos
setInterval(async () => {
  if (!navigator.onLine) return;
  
  const pending = await db.syncQueue
    .where('status').equals('PENDING')
    .toArray();
  
  for (const item of pending) {
    try {
      // Enviar a AppSync
      await syncToServer(item);
      
      // Marcar como sincronizado
      await db.syncQueue.update(item.id, {
        status: 'SYNCED',
        syncedAt: Date.now()
      });
    } catch (error) {
      // Incrementar reintentos
      await db.syncQueue.update(item.id, {
        retries: item.retries + 1,
        lastError: error.message
      });
    }
  }
}, 30000);
```

**3. Resolución de Conflictos:**
```typescript
// Regla simple: Servidor gana
async function resolveConflict(local, server) {
  // Si hay diferencia, usar versión del servidor
  if (local.version < server.version) {
    await db.update(local.id, server);
    return server;
  }
  return local;
}
```

---

## 🔐 Seguridad y Multitenant

### Aislamiento por Tenant:

**1. Cognito User Pools:**
```typescript
// Cada usuario tiene atributo tenantId
{
  "sub": "user-123",
  "email": "cobrador@empresa.com",
  "custom:tenantId": "tenant-001",
  "custom:role": "COBRADOR"
}
```

**2. AppSync Resolvers:**
```typescript
// Todos los queries filtran por tenantId
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :tenantId",
    "expressionValues": {
      ":tenantId": {
        "S": "$ctx.identity.claims['custom:tenantId']"
      }
    }
  }
}
```

**3. Row-Level Security:**
- Cada query automáticamente filtra por tenantId
- Imposible acceder a datos de otro tenant
- Validación en Lambda si es necesario

---

## 📱 Estructura del Proyecto

```
credisync-v2/
├── amplify/
│   ├── auth/
│   │   └── resource.ts          # Cognito config
│   ├── data/
│   │   └── resource.ts          # AppSync + DynamoDB
│   ├── functions/
│   │   ├── sync/                # Lambda para sync
│   │   └── reports/             # Lambda para reportes
│   └── backend.ts               # Amplify Gen2 config
│
├── src/
│   ├── components/
│   │   ├── cobros/
│   │   │   ├── RutaDelDia.tsx
│   │   │   ├── ClienteCard.tsx
│   │   │   └── RegistrarPago.tsx
│   │   ├── clientes/
│   │   │   ├── ClientesList.tsx
│   │   │   └── ClienteDetail.tsx
│   │   ├── creditos/
│   │   │   └── OtorgarCredito.tsx
│   │   └── cierre/
│   │       └── CierreCaja.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                # Dexie setup
│   │   ├── sync.ts              # Sync manager
│   │   └── calculos.ts          # Funciones puras
│   │
│   ├── hooks/
│   │   ├── useRuta.ts
│   │   ├── useCobro.ts
│   │   └── useClientes.ts
│   │
│   └── types/
│       └── index.ts
│
└── package.json
```

---

## 🚀 Funciones Puras de Cálculo

```typescript
// lib/calculos.ts

/**
 * Calcular saldo pendiente de un crédito
 */
export function calcularSaldoPendiente(
  cuotas: Cuota[],
  pagos: Pago[]
): number {
  const totalCuotas = cuotas.reduce((sum, c) => sum + c.montoProgramado, 0);
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
  return Math.max(0, totalCuotas - totalPagos);
}

/**
 * Calcular días de atraso
 */
export function calcularDiasAtraso(
  cuotas: Cuota[],
  pagos: Pago[]
): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Encontrar cuotas pendientes
  const cuotasPendientes = cuotas.filter(cuota => {
    const pagosCuota = pagos.filter(p => p.cuotaId === cuota.id);
    const totalPagado = pagosCuota.reduce((sum, p) => sum + p.monto, 0);
    return totalPagado < cuota.montoProgramado;
  });

  if (cuotasPendientes.length === 0) return 0;

  // Ordenar por fecha
  cuotasPendientes.sort((a, b) => 
    new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime()
  );

  const cuotaMasAntigua = cuotasPendientes[0];
  const fechaCuota = new Date(cuotaMasAntigua.fechaProgramada);
  fechaCuota.setHours(0, 0, 0, 0);

  if (hoy > fechaCuota) {
    return Math.floor((hoy.getTime() - fechaCuota.getTime()) / (1000 * 60 * 60 * 24));
  }

  return 0;
}

/**
 * Distribuir pago entre cuotas
 */
export function distribuirPago(
  monto: number,
  cuotas: Cuota[],
  pagos: Pago[]
): Array<{ cuotaId: string; montoPagar: number }> {
  const distribucion: Array<{ cuotaId: string; montoPagar: number }> = [];
  let montoRestante = monto;

  // Ordenar cuotas por número
  const cuotasOrdenadas = [...cuotas].sort((a, b) => a.numero - b.numero);

  for (const cuota of cuotasOrdenadas) {
    if (montoRestante <= 0) break;

    // Calcular cuánto falta por pagar de esta cuota
    const pagosCuota = pagos.filter(p => p.cuotaId === cuota.id);
    const totalPagado = pagosCuota.reduce((sum, p) => sum + p.monto, 0);
    const saldoCuota = cuota.montoProgramado - totalPagado;

    if (saldoCuota <= 0) continue;

    if (montoRestante >= saldoCuota) {
      // Pagar cuota completa
      distribucion.push({
        cuotaId: cuota.id,
        montoPagar: saldoCuota
      });
      montoRestante -= saldoCuota;
    } else {
      // Pago parcial
      distribucion.push({
        cuotaId: cuota.id,
        montoPagar: montoRestante
      });
      montoRestante = 0;
    }
  }

  return distribucion;
}

/**
 * Generar fechas de cuotas
 */
export function generarFechasCuotas(
  fechaDesembolso: Date,
  fechaPrimeraCuota: Date,
  numeroCuotas: number,
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
  excluirDomingos: boolean = true
): string[] {
  const fechas: string[] = [];
  let fecha = new Date(fechaPrimeraCuota);

  for (let i = 0; i < numeroCuotas; i++) {
    fechas.push(format(fecha, 'yyyy-MM-dd'));

    // Calcular siguiente fecha
    if (i < numeroCuotas - 1) {
      switch (frecuencia) {
        case 'DIARIO':
          fecha = addDays(fecha, 1);
          if (excluirDomingos) {
            while (isSunday(fecha)) {
              fecha = addDays(fecha, 1);
            }
          }
          break;
        case 'SEMANAL':
          fecha = addDays(fecha, 7);
          break;
        case 'QUINCENAL':
          fecha = addDays(fecha, 15);
          break;
        case 'MENSUAL':
          fecha = addDays(fecha, 30);
          break;
      }
    }
  }

  return fechas;
}
```

---

## 📊 Optimizaciones de Performance

### 1. Virtualización de Listas:
```typescript
import { FixedSizeList } from 'react-window';

// Para 200 tarjetas
<FixedSizeList
  height={600}
  itemCount={clientes.length}
  itemSize={120}
>
  {({ index, style }) => (
    <div style={style}>
      <ClienteCard cliente={clientes[index]} />
    </div>
  )}
</FixedSizeList>
```

### 2. Memoización:
```typescript
const saldoPendiente = useMemo(() => 
  calcularSaldoPendiente(cuotas, pagos),
  [cuotas, pagos]
);
```

### 3. Lazy Loading:
```typescript
const CierreCaja = lazy(() => import('./components/cierre/CierreCaja'));
```

### 4. Índices en Dexie:
```typescript
this.version(1).stores({
  cuotas: 'id, creditoId, clienteId, fechaProgramada, [clienteId+fechaProgramada]',
  pagos: 'id, creditoId, cuotaId, clienteId, fecha, [clienteId+fecha]'
});
```

---

**Próximo:** Ver `data-model.md` para schema completo
