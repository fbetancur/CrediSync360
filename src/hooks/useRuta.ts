/**
 * CrediSync360 V2 - useRuta Hook
 * 
 * Hook para gestionar la ruta del día del cobrador.
 * Carga cuotas del día, agrupa por cliente, calcula estados y ordena.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../lib/db';
import { calcularEstadoCuota } from '../lib/calculos';
import type { ClienteRuta } from '../types';

// TODO: Reemplazar con valores reales del contexto de autenticación
const TENANT_ID = 'tenant-demo';
const COBRADOR_ID = 'cobrador-demo';

/**
 * Hook para gestionar la ruta del día
 * 
 * @returns Estado de la ruta del día
 */
export function useRuta() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [ordenPersonalizado, setOrdenPersonalizado] = useState<string[]>([]);

  // Fecha de hoy en formato YYYY-MM-DD
  const hoy = format(new Date(), 'yyyy-MM-dd');

  // Cargar todas las cuotas del día y atrasadas
  const cuotas = useLiveQuery(async () => {
    try {
      // Obtener cuotas programadas para hoy o antes (atrasadas)
      return await db.cuotas
        .where('fechaProgramada')
        .belowOrEqual(hoy)
        .toArray();
    } catch (err) {
      console.error('[useRuta] Error loading cuotas:', err);
      setError(err as Error);
      return [];
    }
  }, [hoy]);

  // Cargar todos los pagos
  const pagos = useLiveQuery(async () => {
    try {
      return await db.pagos.toArray();
    } catch (err) {
      console.error('[useRuta] Error loading pagos:', err);
      return [];
    }
  }, []);

  // Cargar todos los clientes
  const clientes = useLiveQuery(async () => {
    try {
      return await db.clientes.toArray();
    } catch (err) {
      console.error('[useRuta] Error loading clientes:', err);
      return [];
    }
  }, []);

  // Cargar todos los créditos
  const creditos = useLiveQuery(async () => {
    try {
      return await db.creditos.toArray();
    } catch (err) {
      console.error('[useRuta] Error loading creditos:', err);
      return [];
    }
  }, []);

  /**
   * Procesar y agrupar cuotas por cliente
   * 
   * Property 2: Overdue Grouping Consistency
   * Validates: Requirements 1.4, 1.5
   */
  const procesarRuta = useCallback((): ClienteRuta[] => {
    if (!cuotas || !pagos || !clientes || !creditos) {
      return [];
    }

    // Agrupar cuotas por cliente
    const cuotasPorCliente = new Map<string, ClienteRuta>();

    for (const cuota of cuotas) {
      const cliente = clientes.find((c) => c.id === cuota.clienteId);
      if (!cliente) continue;

      const credito = creditos.find((cr) => cr.id === cuota.creditoId);
      if (!credito) continue;

      // Calcular estado de la cuota
      const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
      const estadoCuota = calcularEstadoCuota(cuota, pagosCuota);

      // Solo incluir cuotas pendientes o parciales
      if (estadoCuota.estado === 'PAGADA') continue;

      // Si el cliente ya existe en el mapa, agregar la cuota
      if (cuotasPorCliente.has(cliente.id)) {
        const clienteExistente = cuotasPorCliente.get(cliente.id)!;
        clienteExistente.cuotas.push(cuota);
        clienteExistente.totalPendiente += estadoCuota.saldoPendiente;
        clienteExistente.diasAtrasoMax = Math.max(
          clienteExistente.diasAtrasoMax,
          estadoCuota.diasAtraso
        );
      } else {
        // Crear nueva entrada para el cliente
        cuotasPorCliente.set(cliente.id, {
          cliente,
          credito,
          cuotas: [cuota],
          totalPendiente: estadoCuota.saldoPendiente,
          diasAtrasoMax: estadoCuota.diasAtraso,
        });
      }
    }

    // Convertir mapa a array
    return Array.from(cuotasPorCliente.values());
  }, [cuotas, pagos, clientes, creditos]);

  /**
   * Ordenar ruta: atrasados primero, luego del día
   * 
   * Property 3: Route Ordering Invariant
   * Validates: Requirements 1.6, 1.7
   */
  const ordenarRuta = useCallback(
    (clientesConCuotas: ClienteRuta[]): ClienteRuta[] => {
      // Si hay orden personalizado, aplicarlo
      if (ordenPersonalizado.length > 0) {
        const ordenMap = new Map(
          ordenPersonalizado.map((id, index) => [id, index])
        );

        return [...clientesConCuotas].sort((a, b) => {
          const ordenA = ordenMap.get(a.cliente.id) ?? Infinity;
          const ordenB = ordenMap.get(b.cliente.id) ?? Infinity;
          return ordenA - ordenB;
        });
      }

      // Orden por defecto: atrasados primero (por días de atraso desc), luego del día
      return [...clientesConCuotas].sort((a, b) => {
        // Primero: clientes con atraso
        if (a.diasAtrasoMax > 0 && b.diasAtrasoMax === 0) return -1;
        if (a.diasAtrasoMax === 0 && b.diasAtrasoMax > 0) return 1;

        // Si ambos tienen atraso, ordenar por días de atraso descendente
        if (a.diasAtrasoMax > 0 && b.diasAtrasoMax > 0) {
          return b.diasAtrasoMax - a.diasAtrasoMax;
        }

        // Si ninguno tiene atraso, mantener orden alfabético
        return a.cliente.nombre.localeCompare(b.cliente.nombre);
      });
    },
    [ordenPersonalizado]
  );

  // Procesar y ordenar ruta
  const rutaDelDia = ordenarRuta(procesarRuta());

  /**
   * Calcular estadísticas de la ruta
   * 
   * Validates: Requirements 1.2, 1.3
   */
  const estadisticas = useCallback(() => {
    if (!pagos || !cuotas) {
      return {
        totalCobradoHoy: 0,
        cuotasCobradas: 0,
        cuotasPendientes: 0,
      };
    }

    // Filtrar pagos de hoy SOLO del cobrador actual
    const pagosHoy = pagos.filter(
      (p) => p.fecha === hoy && p.cobradorId === COBRADOR_ID
    );
    const totalCobradoHoy = pagosHoy.reduce((sum, p) => sum + p.monto, 0);

    // Contar cuotas cobradas (completamente pagadas)
    let cuotasCobradas = 0;
    let cuotasPendientes = 0;

    for (const cuota of cuotas) {
      const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
      const estadoCuota = calcularEstadoCuota(cuota, pagosCuota);

      if (estadoCuota.estado === 'PAGADA') {
        cuotasCobradas++;
      } else {
        cuotasPendientes++;
      }
    }

    return {
      totalCobradoHoy,
      cuotasCobradas,
      cuotasPendientes,
    };
  }, [pagos, cuotas, hoy]);

  /**
   * Reordenar ruta manualmente
   * 
   * Validates: Requirements 1.8
   */
  const reordenarRuta = useCallback((nuevoOrden: string[]) => {
    setOrdenPersonalizado(nuevoOrden);
    // TODO: Persistir orden en localStorage o Dexie
  }, []);

  // Actualizar estado de carga
  useEffect(() => {
    if (cuotas && pagos && clientes && creditos) {
      setIsLoading(false);
    }
  }, [cuotas, pagos, clientes, creditos]);

  return {
    rutaDelDia,
    estadisticas: estadisticas(),
    isLoading,
    error,
    reordenarRuta,
  };
}
