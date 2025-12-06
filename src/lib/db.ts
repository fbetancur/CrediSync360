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

    // Versión 2: Schema original
    this.version(2).stores({
      clientes: 'id, tenantId, documento, nombre, [tenantId+nombre]',
      productos: 'id, tenantId, activo, [tenantId+activo]',
      creditos:
        'id, tenantId, clienteId, cobradorId, estado, [tenantId+clienteId], [tenantId+estado]',
      cuotas:
        'id, tenantId, creditoId, clienteId, fechaProgramada, [tenantId+fechaProgramada], [tenantId+clienteId], [clienteId+fechaProgramada]',
      pagos:
        'id, tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha, [tenantId+fecha], [tenantId+cobradorId+fecha], [clienteId+fecha]',
      cierres: 'id, tenantId, cobradorId, fecha, [tenantId+cobradorId+fecha]',
      movimientos: 'id, tenantId, cobradorId, fecha, tipo, [tenantId+cobradorId+fecha]',
      syncQueue: '++id, status, type, timestamp, [status+timestamp]',
    });

    // Versión 3: Agregar campos calculados (optimización)
    this.version(3).stores({
      // Clientes: agregar índices para campos calculados
      clientes:
        'id, tenantId, documento, nombre, estado, diasAtrasoMax, [tenantId+nombre], [tenantId+estado]',

      // Créditos: agregar índices para campos calculados
      creditos:
        'id, tenantId, clienteId, cobradorId, estado, diasAtraso, [tenantId+clienteId], [tenantId+estado], [tenantId+diasAtraso]',

      // Cuotas: agregar índices para campos calculados
      cuotas:
        'id, tenantId, creditoId, clienteId, fechaProgramada, estado, diasAtraso, [tenantId+fechaProgramada], [tenantId+clienteId], [clienteId+fechaProgramada], [tenantId+estado]',

      // Mantener las demás tablas igual
      productos: 'id, tenantId, activo, [tenantId+activo]',
      pagos:
        'id, tenantId, creditoId, cuotaId, clienteId, cobradorId, fecha, [tenantId+fecha], [tenantId+cobradorId+fecha], [clienteId+fecha]',
      cierres: 'id, tenantId, cobradorId, fecha, [tenantId+cobradorId+fecha]',
      movimientos:
        'id, tenantId, cobradorId, fecha, tipo, [tenantId+cobradorId+fecha]',
      syncQueue: '++id, status, type, timestamp, [status+timestamp]',
    }).upgrade(async (trans) => {
      // Migración: calcular campos para registros existentes
      console.log(
        '[DB Migration v3] Calculando campos para registros existentes...'
      );

      // Importar funciones de cálculo
      const { calcularEstadoCredito, calcularEstadoCliente, calcularEstadoCuota } =
        await import('./calculos');

      // Obtener todos los datos
      const creditos = await trans.table('creditos').toArray();
      const cuotas = await trans.table('cuotas').toArray();
      const pagos = await trans.table('pagos').toArray();
      const clientes = await trans.table('clientes').toArray();

      // 1. Actualizar cuotas (primero porque créditos dependen de ellas)
      console.log(`[DB Migration v3] Actualizando ${cuotas.length} cuotas...`);
      for (const cuota of cuotas) {
        const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
        const estado = calcularEstadoCuota(cuota, pagosCuota);

        await trans.table('cuotas').update(cuota.id, {
          montoPagado: estado.montoPagado,
          saldoPendiente: estado.saldoPendiente,
          estado: estado.estado,
          diasAtraso: estado.diasAtraso,
          ultimaActualizacion: new Date().toISOString(),
        });
      }

      // 2. Actualizar créditos
      console.log(
        `[DB Migration v3] Actualizando ${creditos.length} créditos...`
      );
      for (const credito of creditos) {
        const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
        const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
        const estado = calcularEstadoCredito(
          credito,
          cuotasCredito,
          pagosCredito
        );

        await trans.table('creditos').update(credito.id, {
          saldoPendiente: estado.saldoPendiente,
          cuotasPagadas: estado.cuotasPagadas,
          diasAtraso: estado.diasAtraso,
          ultimaActualizacion: new Date().toISOString(),
        });
      }

      // 3. Actualizar clientes
      console.log(
        `[DB Migration v3] Actualizando ${clientes.length} clientes...`
      );
      for (const cliente of clientes) {
        const creditosCliente = creditos.filter(
          (c) => c.clienteId === cliente.id
        );
        const cuotasCliente = cuotas.filter((c) => c.clienteId === cliente.id);
        const pagosCliente = pagos.filter((p) => p.clienteId === cliente.id);
        const estado = calcularEstadoCliente(
          cliente,
          creditosCliente,
          cuotasCliente,
          pagosCliente
        );

        await trans.table('clientes').update(cliente.id, {
          creditosActivos: estado.creditosActivos,
          saldoTotal: estado.saldoTotal,
          diasAtrasoMax: estado.diasAtrasoMax,
          estado: estado.estado,
          score: estado.score,
          ultimaActualizacion: new Date().toISOString(),
        });
      }

      console.log('[DB Migration v3] Migración completada');
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
