/**
 * CrediSync360 V2 - TypeScript Types
 * 
 * Tipos para todas las entidades del sistema
 */

// ============================================================================
// Enums
// ============================================================================

export type Frecuencia = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
export type EstadoCredito = 'ACTIVO' | 'CANCELADO' | 'CASTIGADO';
export type EstadoCuota = 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
export type EstadoCliente = 'SIN_CREDITOS' | 'AL_DIA' | 'MORA';
export type Score = 'CONFIABLE' | 'REGULAR' | 'RIESGOSO';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

// ============================================================================
// Entidades Base
// ============================================================================

export interface Cliente {
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
  // Campos calculados (cache) - se actualizan cuando hay cambios en créditos
  creditosActivos: number;
  saldoTotal: number;
  diasAtrasoMax: number;
  estado: EstadoCliente;
  score: Score;
  ultimaActualizacion: string; // timestamp ISO para validar frescura
  createdAt: string;
  createdBy: string;
}

export interface ProductoCredito {
  id: string;
  tenantId: string;
  nombre: string;
  interesPorcentaje: number;
  numeroCuotas: number;
  frecuencia: Frecuencia;
  excluirDomingos: boolean;
  montoMinimo?: number;
  montoMaximo?: number;
  activo: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Credito {
  id: string;
  tenantId: string;
  clienteId: string;
  productoId: string;
  cobradorId: string;
  // Datos del crédito
  montoOriginal: number;
  interesPorcentaje: number;
  totalAPagar: number;
  numeroCuotas: number;
  valorCuota: number;
  frecuencia: Frecuencia;
  // Fechas
  fechaDesembolso: string; // YYYY-MM-DD
  fechaPrimeraCuota: string; // YYYY-MM-DD
  fechaUltimaCuota: string; // YYYY-MM-DD
  // Estado
  estado: EstadoCredito;
  // Campos calculados (cache) - se actualizan cuando hay pagos
  saldoPendiente: number;
  cuotasPagadas: number;
  diasAtraso: number;
  ultimaActualizacion: string; // timestamp ISO para validar frescura
  // Metadata
  createdAt: string;
  createdBy: string;
}

export interface Cuota {
  id: string;
  tenantId: string;
  creditoId: string;
  clienteId: string;
  // Datos de la cuota
  numero: number;
  fechaProgramada: string; // YYYY-MM-DD
  montoProgramado: number;
  // Campos calculados (cache) - se actualizan cuando hay pagos
  montoPagado: number;
  saldoPendiente: number;
  estado: EstadoCuota;
  diasAtraso: number;
  ultimaActualizacion: string; // timestamp ISO para validar frescura
  // Metadata
  createdAt: string;
  createdBy: string;
}

export interface Pago {
  id: string;
  tenantId: string;
  creditoId: string;
  cuotaId: string;
  clienteId: string;
  cobradorId: string;
  // Datos del pago
  monto: number;
  fecha: string; // YYYY-MM-DD
  // Ubicación
  latitud?: number;
  longitud?: number;
  // Observaciones
  observaciones?: string;
  // Metadata
  createdAt: string;
  createdBy: string;
}

export interface CierreCaja {
  id: string;
  tenantId: string;
  cobradorId: string;
  fecha: string; // YYYY-MM-DD
  // Datos del cierre
  cajaBase: number;
  totalCobrado: number;
  totalCreditosOtorgados: number;
  totalEntradas: number;
  totalGastos: number;
  totalCaja: number;
  cuotasCobradas: number;
  cuotasTotales: number;
  clientesVisitados: number;
  observaciones?: string;
  // Metadata
  createdAt: string;
  createdBy: string;
}

export interface MovimientoCaja {
  id: string;
  tenantId: string;
  cobradorId: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'ENTRADA' | 'GASTO';
  detalle: string;
  valor: number;
  createdAt: string;
  createdBy: string;
}

export interface EstadoCaja {
  fecha: string;
  estado: 'ABIERTA' | 'CERRADA';
  cajaBase: number;
  totalCobrado: number;
  totalCreditosOtorgados: number;
  totalEntradas: number;
  totalGastos: number;
  totalCaja: number;
}

// ============================================================================
// Sync Queue
// ============================================================================

export type SyncOperationType = 
  | 'CREATE_CLIENTE' 
  | 'CREATE_CREDITO' 
  | 'CREATE_PAGO' 
  | 'CREATE_CIERRE';

export interface SyncQueueItem {
  id?: number; // Auto-increment
  type: SyncOperationType;
  data: any;
  timestamp: number;
  retries: number;
  status: SyncStatus;
  lastError?: string;
  syncedAt?: number;
}

// ============================================================================
// Tipos Calculados (no se guardan en DB)
// ============================================================================

export interface EstadoCuotaCalculado {
  montoPagado: number;
  saldoPendiente: number;
  estado: EstadoCuota;
  diasAtraso: number;
}

export interface EstadoCreditoCalculado {
  saldoPendiente: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  diasAtraso: number;
  estadoCalculado: EstadoCredito;
}

export interface EstadoClienteCalculado {
  creditosActivos: number;
  saldoTotal: number;
  diasAtrasoMax: number;
  estado: EstadoCliente;
  score: Score;
}

// ============================================================================
// Tipos para UI
// ============================================================================

export interface ClienteConCuota extends Cliente {
  cuotasAtrasadas: number;
  saldoACobrar: number;
  diasAtraso: number;
  credito?: Credito;
}

export interface ClienteRuta {
  cliente: Cliente;
  credito: Credito;
  cuotas: Cuota[];
  totalPendiente: number;
  diasAtrasoMax: number;
}

export interface DistribucionPago {
  cuotaId: string;
  montoPagar: number;
}

// ============================================================================
// Tipos para Formularios
// ============================================================================

export interface CrearClienteForm {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  barrio: string;
  referencia: string;
  latitud?: number;
  longitud?: number;
}

export interface OtorgarCreditoForm {
  clienteId: string;
  productoId: string;
  montoOriginal: number;
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
}

export interface RegistrarPagoForm {
  creditoId: string;
  cuotaId: string;
  clienteId: string;
  monto: number;
  fecha: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
}
