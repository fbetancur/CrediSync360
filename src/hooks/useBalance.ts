/**
 * Hook para gestionar el balance y caja del cobrador
 * 
 * Calcula automáticamente el estado de la caja basado en:
 * - Caja base
 * - Cobros realizados
 * - Créditos otorgados
 * - Entradas/Inversiones
 * - Gastos/Salidas
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { EstadoCaja, MovimientoCaja } from '../types';

// TODO: Reemplazar con valores reales del contexto de autenticación
const TENANT_ID = 'tenant-demo';
const COBRADOR_ID = 'cobrador-demo';

export function useBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha de hoy
  const hoy = new Date().toISOString().split('T')[0];

  // Cargar estado de la caja
  const estadoCaja = useLiveQuery(async (): Promise<EstadoCaja | null> => {
    try {
      // Verificar si hay un cierre para hoy
      const cierreHoy = await db.cierres
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .first();

      // Caja base = total del día anterior
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];
      
      const cierreAyer = await db.cierres
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, fechaAyer])
        .first();
      
      const cajaBase = cierreAyer ? cierreAyer.totalCaja : 0;

      // Total cobrado hoy
      const pagosHoy = await db.pagos
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .toArray();
      const totalCobrado = pagosHoy.reduce((sum, p) => sum + p.monto, 0);

      // Total créditos otorgados hoy
      const creditosHoy = await db.creditos
        .where('tenantId')
        .equals(TENANT_ID)
        .filter((c) => c.fechaDesembolso === hoy && c.cobradorId === COBRADOR_ID)
        .toArray();
      const totalCreditosOtorgados = creditosHoy.reduce(
        (sum, c) => sum + c.montoOriginal,
        0
      );

      // Movimientos del día
      const movimientosHoy = await db.movimientos
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .toArray();

      const totalEntradas = movimientosHoy
        .filter((m) => m.tipo === 'ENTRADA')
        .reduce((sum, m) => sum + m.valor, 0);

      const totalGastos = movimientosHoy
        .filter((m) => m.tipo === 'GASTO')
        .reduce((sum, m) => sum + m.valor, 0);

      // Calcular total de caja
      const totalCaja =
        cajaBase + totalCobrado - totalCreditosOtorgados + totalEntradas - totalGastos;

      return {
        fecha: hoy,
        estado: cierreHoy ? 'CERRADA' : 'ABIERTA',
        cajaBase,
        totalCobrado,
        totalCreditosOtorgados,
        totalEntradas,
        totalGastos,
        totalCaja,
      };
    } catch (err) {
      console.error('Error calculando estado de caja:', err);
      return null;
    }
  }, [hoy]);

  // Cargar movimientos del día
  const movimientos = useLiveQuery(
    () =>
      db.movimientos
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .toArray(),
    [hoy]
  );

  /**
   * Agregar un movimiento (entrada o gasto)
   */
  const agregarMovimiento = async (
    tipo: 'ENTRADA' | 'GASTO',
    detalle: string,
    valor: number
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const movimiento: MovimientoCaja = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId: TENANT_ID,
        cobradorId: COBRADOR_ID,
        fecha: hoy,
        tipo,
        detalle,
        valor,
        createdAt: new Date().toISOString(),
        createdBy: COBRADOR_ID,
      };

      await db.movimientos.add(movimiento);
      setLoading(false);
    } catch (err) {
      console.error('Error agregando movimiento:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      throw err;
    }
  };

  /**
   * Eliminar un movimiento (solo antes del cierre)
   */
  const eliminarMovimiento = async (movimientoId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await db.movimientos.delete(movimientoId);
      setLoading(false);
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      throw err;
    }
  };

  /**
   * Cerrar la caja del día
   */
  const cerrarCaja = async (observaciones?: string): Promise<void> => {
    if (!estadoCaja) {
      throw new Error('No hay estado de caja disponible');
    }

    setLoading(true);
    setError(null);

    try {
      // Calcular cuotas cobradas
      const cuotasHoy = await db.cuotas
        .where('[tenantId+fechaProgramada]')
        .equals([TENANT_ID, hoy])
        .toArray();

      const pagosHoy = await db.pagos
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .toArray();

      const cuotasConPago = new Set(pagosHoy.map((p) => p.cuotaId));
      const cuotasCobradas = cuotasConPago.size;

      // Clientes visitados
      const clientesVisitados = new Set(pagosHoy.map((p) => p.clienteId)).size;

      // Crear cierre
      const cierre = {
        id: `cierre-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId: TENANT_ID,
        cobradorId: COBRADOR_ID,
        fecha: hoy,
        cajaBase: estadoCaja.cajaBase,
        totalCobrado: estadoCaja.totalCobrado,
        totalCreditosOtorgados: estadoCaja.totalCreditosOtorgados,
        totalEntradas: estadoCaja.totalEntradas,
        totalGastos: estadoCaja.totalGastos,
        totalCaja: estadoCaja.totalCaja,
        cuotasCobradas,
        cuotasTotales: cuotasHoy.length,
        clientesVisitados,
        observaciones,
        createdAt: new Date().toISOString(),
        createdBy: COBRADOR_ID,
      };

      await db.cierres.add(cierre);
      setLoading(false);
    } catch (err) {
      console.error('Error cerrando caja:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      throw err;
    }
  };

  /**
   * Reabrir la caja del día
   * TODO: En Fase 9, restringir solo a administradores
   */
  const reabrirCaja = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Buscar el cierre de hoy
      const cierreHoy = await db.cierres
        .where('[tenantId+cobradorId+fecha]')
        .equals([TENANT_ID, COBRADOR_ID, hoy])
        .first();

      if (!cierreHoy) {
        throw new Error('No hay cierre para reabrir');
      }

      // Eliminar el cierre para reabrir la caja
      await db.cierres.delete(cierreHoy.id);
      setLoading(false);
    } catch (err) {
      console.error('Error reabriendo caja:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      throw err;
    }
  };

  return {
    estadoCaja,
    movimientos: movimientos || [],
    loading,
    error,
    agregarMovimiento,
    eliminarMovimiento,
    cerrarCaja,
    reabrirCaja,
  };
}
