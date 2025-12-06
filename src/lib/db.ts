/**
 * CrediSync360 V2 - Dexie Database
 * 
 * Base de datos local usando IndexedDB con Dexie.js
 * Todos los datos se guardan localmente y se sincronizan en background.
 */

import Dexie, { Table } from 'dexie';
import type {
  Cliente,
  ProductoCredito,
  Credito,
  Cuota,
  Pago,
  CierreCaja,
  SyncQueueItem,
} from '../types';

/**
 * Clase principal de la base de datos
 */
export class CrediSyncDB extends Dexie {
  // Tablas
  clientes!: Table<Cliente, string>;
  productos!: Table<ProductoCredito, string>;
  creditos!: Table<Credito, string>;
  cuotas!: Table<Cuota, string>;
  pagos!: Table<Pago, string>;
  cierres!: Table<CierreCaja, string>;
  movimientos!: Table<import('../types').MovimientoCaja, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('credisync-v2');

    // Definir schema con índices
    this.version(2).stores({
      // Clientes
      // Índices: id (primary), tenantId, documento, nombre, [tenantId+nombre]
      clientes: 'id, tenantId, documento, nombre, [tenantId+nombre]',

      // Productos de Crédito
      // Índices: id (primary), tenantId, activo, [tenantId+activo]
      productos: 'id, tenantId, activo, [tenantId+activo]',

      // Créditos
      // Índices: id (primary), tenantId, clienteId, cobradorId, estado
      creditos:
        'id, tenantId, clienteId, cobradorId, estado, [tenantId+clienteId], [tenantId+estado]',

      // Cuotas
      // Índices: id (primary), tenantId, creditoId, clienteId, fechaProgramada
      // Índices compuestos para queries comunes
      cuotas:
        'id, tenantId, creditoId, clienteId, fechaProgramada, [tenantId+fechaProgramada], [tenantId+clienteId], [clienteId+fechaProgramada]',

      // Pagos
      // Índices: id (primary), tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha
      pagos:
        'id, tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha, [tenantId+fecha], [tenantId+cobradorId+fecha], [clienteId+fecha]',

      // Cierres de Caja
      // Índices: id (primary), tenantId, cobradorId, fecha
      cierres: 'id, tenantId, cobradorId, fecha, [tenantId+cobradorId+fecha]',

      // Movimientos de Caja (Entradas y Gastos)
      // Índices: id (primary), tenantId, cobradorId, fecha, tipo
      movimientos: 'id, tenantId, cobradorId, fecha, tipo, [tenantId+cobradorId+fecha]',

      // Cola de Sincronización
      // Índices: id (auto-increment primary), status, type, timestamp
      syncQueue: '++id, status, type, timestamp, [status+timestamp]',
    });
  }

  /**
   * Limpiar todos los datos (útil para logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.clientes.clear(),
      this.productos.clear(),
      this.creditos.clear(),
      this.cuotas.clear(),
      this.pagos.clear(),
      this.cierres.clear(),
      this.movimientos.clear(),
      this.syncQueue.clear(),
    ]);
  }

  /**
   * Limpiar datos de un tenant específico
   */
  async clearTenant(tenantId: string): Promise<void> {
    await Promise.all([
      this.clientes.where('tenantId').equals(tenantId).delete(),
      this.productos.where('tenantId').equals(tenantId).delete(),
      this.creditos.where('tenantId').equals(tenantId).delete(),
      this.cuotas.where('tenantId').equals(tenantId).delete(),
      this.pagos.where('tenantId').equals(tenantId).delete(),
      this.cierres.where('tenantId').equals(tenantId).delete(),
      this.movimientos.where('tenantId').equals(tenantId).delete(),
    ]);
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getStats(): Promise<{
    clientes: number;
    creditos: number;
    cuotas: number;
    pagos: number;
    syncPending: number;
  }> {
    const [clientes, creditos, cuotas, pagos, syncPending] = await Promise.all([
      this.clientes.count(),
      this.creditos.count(),
      this.cuotas.count(),
      this.pagos.count(),
      this.syncQueue.where('status').equals('PENDING').count(),
    ]);

    return {
      clientes,
      creditos,
      cuotas,
      pagos,
      syncPending,
    };
  }
}

// Instancia única de la base de datos
export const db = new CrediSyncDB();

// Exportar para uso en otros módulos
export default db;
