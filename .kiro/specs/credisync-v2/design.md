# CrediSync360 V2 - Documento de Diseño

**Fecha:** 5 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** En Revisión

---

## Overview

CrediSync360 V2 es una Progressive Web App (PWA) diseñada con arquitectura offline-first para cobradores de microcréditos. El sistema utiliza AWS Amplify Gen2 como backend, IndexedDB (vía Dexie.js) para almacenamiento local, y React 18 con TypeScript para el frontend.

### Principios de Diseño:

1. **Offline-First:** Todas las operaciones funcionan sin conexión, sincronizando en background
2. **Immutable Data:** Los datos nunca se modifican, solo se agregan nuevos registros (event sourcing)
3. **Calculated Properties:** Estado derivado se calcula en tiempo real, no se almacena
4. **Single Source of Truth:** Cada dato existe en un solo lugar
5. **Multitenant:** Aislamiento completo de datos por tenant desde el diseño
6. **Performance-First:** Optimizado para 200+ clientes con respuesta < 100ms

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Cobros     │  │   Clientes   │  │   Créditos   │  │
│  │  Component   │  │  Component   │  │  Component   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │              Custom Hooks Layer                     │ │
│  │  useRuta | useCobro | useClientes | useCredito     │ │
│  └─────────────────────────┬──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │           Business Logic Layer                      │ │
│  │  calculos.ts (Pure Functions)                       │ │
│  └─────────────────────────┬──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │              Local Database (Dexie)                 │ │
│  │  IndexedDB: clientes, creditos, cuotas, pagos      │ │
│  └─────────────────────────┬──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │           Sync Queue Manager                        │ │
│  │  Background sync every 30s                          │ │
│  └─────────────────────────┬──────────────────────────┘ │
└────────────────────────────┼──────────────────────────┘
                             │
                             │ HTTPS/GraphQL
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  AWS Amplify Gen2                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Cognito    │  │   AppSync    │  │  DynamoDB    │  │
│  │     Auth     │  │  GraphQL API │  │   Database   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2.0 + TypeScript 5.4.5
- Vite 5.4.10 (build tool)
- Dexie.js 4.2.1 (IndexedDB wrapper)
- date-fns 4.1.0 (date manipulation)
- react-window 2.2.3 (virtualization)
- react-beautiful-dnd 13.1.1 (drag & drop)

**Backend (AWS Amplify Gen2):**
- Cognito (Authentication with custom attributes)
- AppSync (GraphQL API)
- DynamoDB (NoSQL database)
- Lambda (Serverless functions)
- S3 (File storage for reports)
- CloudWatch (Monitoring)

**Testing:**
- Vitest 4.0.15 (unit tests)
- fast-check (property-based testing library)
- @testing-library/react 16.3.0 (component testing)

---

## Components and Interfaces

### Frontend Components

#### 1. RutaDelDia Component
**Purpose:** Display daily route with client cards  
**Props:**
```typescript
interface RutaDelDiaProps {
  fecha: Date;
  cobradorId: string;
}
```

**State:**
```typescript
interface RutaDelDiaState {
  clientes: ClienteConCuota[];
  totalRecaudado: number;
  cuotasCobradas: number;
  cuotasPendientes: number;
  loading: boolean;
  error: Error | null;
}
```

#### 2. RegistrarPago Component
**Purpose:** Modal for payment registration  
**Props:**
```typescript
interface RegistrarPagoProps {
  cliente: Cliente;
  credito: Credito;
  cuotas: Cuota[];
  pagos: Pago[];
  onConfirm: (pago: Pago) => Promise<void>;
  onCancel: () => void;
}
```

#### 3. ClientesList Component
**Purpose:** Searchable list of clients  
**Props:**
```typescript
interface ClientesListProps {
  tenantId: string;
}
```

#### 4. OtorgarCredito Component
**Purpose:** Credit granting form  
**Props:**
```typescript
interface OtorgarCreditoProps {
  cliente: Cliente;
  productos: ProductoCredito[];
  onConfirm: (credito: Credito, cuotas: Cuota[]) => Promise<void>;
  onCancel: () => void;
}
```

### Custom Hooks

#### useRuta Hook
```typescript
interface UseRutaReturn {
  clientes: ClienteConCuota[];
  totalRecaudado: number;
  cuotasCobradas: number;
  cuotasPendientes: number;
  loading: boolean;
  error: Error | null;
  reordenar: (clienteId: string, newIndex: number) => void;
}

function useRuta(fecha: Date, cobradorId: string): UseRutaReturn;
```

#### useCobro Hook
```typescript
interface UseCobro {
  registrarPago: (pago: Omit<Pago, 'id' | 'createdAt'>) => Promise<void>;
  distribuirPago: (monto: number, cuotas: Cuota[], pagos: Pago[]) => Distribution[];
  loading: boolean;
  error: Error | null;
}

function useCobro(): UseCobro;
```

#### useBalance Hook
```typescript
interface UseBalanceReturn {
  estadoCaja: EstadoCaja | null;
  movimientos: MovimientoCaja[];
  loading: boolean;
  error: Error | null;
  agregarMovimiento: (tipo: 'ENTRADA' | 'GASTO', detalle: string, valor: number) => Promise<void>;
  eliminarMovimiento: (movimientoId: string) => Promise<void>;
  cerrarCaja: (observaciones?: string) => Promise<void>;
  reabrirCaja: () => Promise<void>;
}

function useBalance(): UseBalanceReturn;
```

### Business Logic Functions (Pure)

```typescript
// lib/calculos.ts

/**
 * Calculate pending balance for a credit
 */
export function calcularSaldoPendiente(
  cuotas: Cuota[],
  pagos: Pago[]
): number;

/**
 * Calculate days overdue for a credit
 */
export function calcularDiasAtraso(
  cuotas: Cuota[],
  pagos: Pago[]
): number;

/**
 * Distribute payment amount across installments
 */
export function distribuirPago(
  monto: number,
  cuotas: Cuota[],
  pagos: Pago[]
): Array<{ cuotaId: string; montoPagar: number }>;

/**
 * Calculate installment status
 */
export function calcularEstadoCuota(
  cuota: Cuota,
  pagos: Pago[]
): {
  montoPagado: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  diasAtraso: number;
};

/**
 * Calculate credit status
 */
export function calcularEstadoCredito(
  credito: Credito,
  cuotas: Cuota[],
  pagos: Pago[]
): {
  saldoPendiente: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  diasAtraso: number;
  estadoCalculado: 'AL_DIA' | 'MORA' | 'CANCELADO';
};

/**
 * Calculate client score
 */
export function calcularScore(
  cliente: Cliente,
  creditos: Credito[],
  cuotas: Cuota[],
  pagos: Pago[]
): 'CONFIABLE' | 'REGULAR' | 'RIESGOSO';

/**
 * Generate installment dates
 */
export function generarFechasCuotas(
  fechaDesembolso: Date,
  fechaPrimeraCuota: Date,
  numeroCuotas: number,
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
  excluirDomingos: boolean
): string[];
```

---

## Data Models

### Local Database Schema (Dexie/IndexedDB)

```typescript
// lib/db.ts

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
      clientes: 'id, tenantId, documento, nombre, [tenantId+nombre]',
      creditos: 'id, tenantId, clienteId, cobradorId, estado, [tenantId+clienteId], [tenantId+estado]',
      cuotas: 'id, tenantId, creditoId, clienteId, fechaProgramada, [tenantId+fechaProgramada], [clienteId+fechaProgramada]',
      pagos: 'id, tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha, [tenantId+fecha], [clienteId+fecha]',
      productos: 'id, tenantId, activo, [tenantId+activo]',
      syncQueue: '++id, status, type, timestamp, [status+timestamp]'
    });
  }
}

export const db = new CrediSyncDB();
```

### Entity Interfaces

```typescript
interface Cliente {
  id: string;
  tenantId: string;
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  barrio: string;
  referencia: string;
  latitud?: number;
  longitud?: number;
  createdAt: string;
  createdBy: string;
}

interface Credito {
  id: string;
  tenantId: string;
  clienteId: string;
  productoId: string;
  cobradorId: string;
  montoOriginal: number;
  interesPorcentaje: number;
  totalAPagar: number;
  numeroCuotas: number;
  valorCuota: number;
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
  fechaUltimaCuota: string;
  estado: 'ACTIVO' | 'CANCELADO' | 'CASTIGADO';
  createdAt: string;
  createdBy: string;
}

interface Cuota {
  id: string;
  tenantId: string;
  creditoId: string;
  clienteId: string;
  numero: number;
  fechaProgramada: string;
  montoProgramado: number;
  createdAt: string;
  createdBy: string;
}

interface Pago {
  id: string;
  tenantId: string;
  creditoId: string;
  cuotaId: string;
  clienteId: string;
  cobradorId: string;
  monto: number;
  fecha: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  createdAt: string;
  createdBy: string;
}

interface SyncQueueItem {
  id?: number;
  type: 'CREATE_CLIENTE' | 'CREATE_CREDITO' | 'CREATE_PAGO' | 'CREATE_CIERRE';
  data: any;
  timestamp: number;
  retries: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  lastError?: string;
  syncedAt?: number;
}
```

### DynamoDB Schema (Single Table Design)

```typescript
interface DynamoDBItem {
  PK: string;           // tenantId (partition key)
  SK: string;           // TYPE#id#timestamp (sort key)
  type: 'CLIENTE' | 'CREDITO' | 'CUOTA' | 'PAGO';
  data: any;
  createdAt: string;
  createdBy: string;
  version: number;
}

// GSI1: Queries by Cliente
// PK: clienteId, SK: type#createdAt

// GSI2: Queries by Cobrador
// PK: cobradorId, SK: fecha#type

// GSI3: Queries by Date
// PK: tenantId#fecha, SK: type#id
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Daily Route Loading Completeness
*For any* valid date and cobradorId, when the system loads the daily route, all clients with installments due on that date should appear in the route list.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Overdue Grouping Consistency
*For any* cliente with multiple overdue installments, the system should display exactly one card showing the total count and total amount.

**Validates: Requirements 1.4, 1.5**

### Property 3: Route Ordering Invariant
*For any* daily route, overdue clients should always appear before clients with installments due today, and overdue clients should be ordered by days overdue descending.

**Validates: Requirements 1.6, 1.7**

### Property 4: Route Reordering Persistence
*For any* route reordering operation, if a client card is moved to position N, then reloading the route should show that client at position N.

**Validates: Requirements 1.8**

### Property 5: Payment Distribution Correctness
*For any* payment amount and list of installments, the distributed payment should satisfy:
- Sum of distributed amounts equals the payment amount
- Installments are paid in chronological order
- No installment receives more than its pending balance
- No negative amounts are distributed

**Validates: Requirements 2.9, 2.10**

### Property 6: Payment Idempotency
*For any* payment registration, saving the same payment twice should result in only one payment record in the database.

**Validates: Requirements 2.6, 2.7**

### Property 7: Balance Calculation Consistency
*For any* credit, the pending balance should always equal the sum of programmed installments minus the sum of payments.

**Validates: Requirements 2.2, 4.9**

### Property 8: Days Overdue Monotonicity
*For any* credit with overdue installments, as time progresses, the days overdue should never decrease (unless a payment is made).

**Validates: Requirements 1.6, 4.9**

### Property 9: Client Search Completeness
*For any* search query, all clients whose name, document, or phone contains the query string should appear in the results.

**Validates: Requirements 3.2**

### Property 10: Client Score Determinism
*For any* client with the same credit history, calculating the score multiple times should always return the same result.

**Validates: Requirements 4.5, 4.6, 4.7, 4.8**

### Property 11: Installment Date Generation Correctness
*For any* credit with DIARIO frequency and excluirDomingos=true, no generated installment date should fall on a Sunday.

**Validates: Requirements 5.8**

### Property 12: Credit Calculation Accuracy
*For any* credit with amount A and interest rate R%, the total to pay should equal A * (1 + R/100), and the installment value should equal total / number of installments.

**Validates: Requirements 5.4**

### Property 13: First Installment Date Editability
*For any* credit being created, if the user sets a custom first installment date D, then all generated installment dates should be calculated starting from D.

**Validates: Requirements 5.6, 5.7**

### Property 14: Sync Queue FIFO Ordering
*For any* sequence of operations added to the sync queue, they should be synced to the server in the same order they were added.

**Validates: Requirements 7.2, 7.3**

### Property 15: Offline Operation Completeness
*For any* operation performed while offline, the operation should complete successfully and be added to the sync queue.

**Validates: Requirements 7.1, 7.9**

### Property 16: Sync Retry Exponential Backoff
*For any* failed sync operation, each retry should wait longer than the previous retry (exponential backoff).

**Validates: Requirements 7.5**

### Property 17: Tenant Data Isolation
*For any* two different tenants, querying data for tenant A should never return data from tenant B.

**Validates: Requirements 8.4, 8.5, 8.6, 10.2, 10.5**

### Property 18: Authentication Session Validity
*For any* authenticated user, all operations should include the user's tenantId and userId from the authentication token.

**Validates: Requirements 8.2, 8.3**

### Property 19: Data Immutability
*For any* payment record, once created, the record should never be modified (only new records can be added).

**Validates: Requirements 7.1** (Implicit from architecture)

### Property 20: Calculated Property Consistency
*For any* credit, recalculating the pending balance from installments and payments should always match the previously calculated value.

**Validates: Requirements 2.2, 4.9** (Implicit from architecture)

### Property 21: Base Cash Calculation Correctness
*For any* day, the base cash should equal the total cash from the previous day's closing, or zero if no previous closing exists.

**Validates: Requirements 6.2**

### Property 22: Cash Balance Formula Consistency
*For any* cash state, the total cash should always equal: Base + Collected - Credits + Entries - Expenses.

**Validates: Requirements 6.9**

### Property 23: Movement Deletion Restriction
*For any* movement deletion attempt, the operation should only succeed if the cash register is in OPEN state.

**Validates: Requirements 6.8**

### Property 24: Cash Reopen Idempotency
*For any* cash reopening operation, reopening an already open cash should have no effect.

**Validates: Requirements 6.11, 6.12**

---

## Error Handling

### Error Categories

**1. Network Errors:**
- Handled by sync queue retry mechanism
- User notified only after 5 failed retries
- Operations continue working offline

**2. Validation Errors:**
- Caught at form level before submission
- Clear error messages displayed to user
- No data saved until validation passes

**3. Data Integrity Errors:**
- Logged to console and monitoring
- User notified with actionable message
- System attempts automatic recovery

**4. Authentication Errors:**
- User redirected to login screen
- Local data preserved for next session
- Sync queue paused until re-authentication

### Error Handling Strategy

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Show user-friendly error message
    this.setState({ hasError: true, error });
  }
}

// Async operation error handling
async function registrarPago(pago: Pago): Promise<void> {
  try {
    // Save to IndexedDB
    await db.pagos.add(pago);
    
    // Add to sync queue
    await db.syncQueue.add({
      type: 'CREATE_PAGO',
      data: pago,
      timestamp: Date.now(),
      retries: 0,
      status: 'PENDING'
    });
  } catch (error) {
    // Log error
    console.error('Error registering payment:', error);
    
    // Show user notification
    showNotification({
      type: 'error',
      message: 'Error al registrar pago. Por favor intente nuevamente.',
      duration: 5000
    });
    
    // Re-throw for caller to handle
    throw error;
  }
}
```

---

## Testing Strategy

### Dual Testing Approach

The system uses both **unit testing** and **property-based testing** to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide complete coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing

**Framework:** Vitest 4.0.15

**Coverage:**
- Component rendering and user interactions
- Hook behavior with specific inputs
- Integration between components
- Error handling scenarios

**Example:**
```typescript
// tests/unit/calculos.test.ts
import { describe, it, expect } from 'vitest';
import { calcularSaldoPendiente } from '../lib/calculos';

describe('calcularSaldoPendiente', () => {
  it('should calculate correct balance with full payment', () => {
    const cuotas = [
      { id: '1', montoProgramado: 60 },
      { id: '2', montoProgramado: 60 }
    ];
    const pagos = [
      { id: 'p1', cuotaId: '1', monto: 60 }
    ];
    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(60);
  });

  it('should return 0 when all installments are paid', () => {
    const cuotas = [{ id: '1', montoProgramado: 60 }];
    const pagos = [{ id: 'p1', cuotaId: '1', monto: 60 }];
    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(0);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (chosen for TypeScript compatibility and maturity)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with property number and requirement reference
- Format: `// Property {number}: {property_text} - Validates: Requirements {X.Y}`

**Test Organization:**
- One property-based test per correctness property
- Tests placed close to implementation for early error detection
- Generators create realistic test data

**Example:**
```typescript
// tests/properties/payment-distribution.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { distribuirPago } from '../lib/calculos';

describe('Payment Distribution Properties', () => {
  it('Property 5: Payment distribution correctness', () => {
    // Property 5: Payment Distribution Correctness
    // Validates: Requirements 2.9, 2.10
    
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 10000 }), // payment amount
        fc.array(fc.record({
          id: fc.string(),
          montoProgramado: fc.float({ min: 1, max: 1000 })
        }), { minLength: 1, maxLength: 20 }), // installments
        (monto, cuotas) => {
          const distribucion = distribuirPago(monto, cuotas, []);
          
          // Sum of distributed amounts equals payment amount
          const totalDistribuido = distribucion.reduce((sum, d) => sum + d.montoPagar, 0);
          expect(Math.abs(totalDistribuido - monto)).toBeLessThan(0.01);
          
          // No negative amounts
          distribucion.forEach(d => {
            expect(d.montoPagar).toBeGreaterThanOrEqual(0);
          });
          
          // No installment receives more than its balance
          distribucion.forEach(d => {
            const cuota = cuotas.find(c => c.id === d.cuotaId);
            expect(d.montoPagar).toBeLessThanOrEqual(cuota!.montoProgramado);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Requirements:**
- Each correctness property MUST be implemented by a SINGLE property-based test
- Each test MUST be tagged with format: `// Property {number}: {text} - Validates: Requirements {X.Y}`
- Each test MUST run minimum 100 iterations
- Tests MUST use smart generators that constrain to valid input space

---

## Performance Optimizations

### 1. Virtual Scrolling
```typescript
import { FixedSizeList } from 'react-window';

// For 200+ client cards
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

### 2. Memoization
```typescript
const saldoPendiente = useMemo(
  () => calcularSaldoPendiente(cuotas, pagos),
  [cuotas, pagos]
);

const ClienteCard = memo(({ cliente }: Props) => {
  // Component implementation
});
```

### 3. Lazy Loading
```typescript
const CierreCaja = lazy(() => import('./components/cierre/CierreCaja'));
const OtorgarCredito = lazy(() => import('./components/creditos/OtorgarCredito'));
```

### 4. IndexedDB Indexes
Strategic compound indexes for common queries:
- `[tenantId+fechaProgramada]` for daily route
- `[clienteId+fechaProgramada]` for client installments
- `[tenantId+fecha]` for cash closing

### 5. Debounced Search
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    // Perform search
  }, 300),
  []
);
```

---

## Security Considerations

### Authentication
- Cognito handles all authentication
- Custom attributes: `tenantId`, `role`
- JWT tokens with 1-hour expiration
- Refresh tokens for seamless re-authentication

### Authorization
- Row-level security via tenantId filtering
- All queries automatically scoped to user's tenant
- AppSync resolvers validate tenantId from JWT

### Data Encryption
- HTTPS for all network communication
- IndexedDB data encrypted at rest (browser-level)
- DynamoDB encryption at rest enabled
- S3 bucket encryption for reports

### Audit Trail
- All operations include `createdBy` userId
- All operations include `createdAt` timestamp
- Immutable data provides complete history
- CloudWatch logs for monitoring

---

**Próximo Documento:** tasks.md - Lista ejecutable de tareas de implementación
