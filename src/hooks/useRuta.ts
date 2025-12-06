/**
 * CrediSync360 V2 - useRuta Hook
 * 
 * Hook para gestionar la ruta del día del cobrador.
 * Carga cuotas del día, agrupa por cliente, calcula estados y ordena.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../lib/db';
import type { ClienteRuta, Cliente } from '../types';

// TODO: Reemplazar con valores reales del contexto de autenticación
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

  // OPTIMIZADO: Cargar solo cuotas del cobrador actual
  const cuotas = useLiveQuery(async () => {
    try {
      // Obtener cuotas del cobrador programadas para hoy o antes (atrasadas)
      return await db.cuotas
        .where('[tenantId+cobradorId+fechaProgramada]')
        .between(
          ['tenant-1', COBRADOR_ID, '2000-01-01'],
          ['tenant-1', COBRADOR_ID, hoy]
        )
        .toArray();
    } catch (err) {
      console.error('[useRuta] Error loading cuotas:', err);
      setError(err as Error);
      return [];
    }
  }, [hoy]);

  // OPTIMIZADO: Cargar solo pagos del cobrador
  const pagos = useLiveQuery(async () => {
    try {
      return await db.pagos
        .where('cobradorId')
        .equals(COBRADOR_ID)
        .toArray();
    } catch (err) {
      console.error('[useRuta] Error loading pagos:', err);
      return [];
    }
  }, []);

  // OPTIMIZADO: Cargar solo clientes del cobrador (a través de sus cuotas)
  const clientes = useLiveQuery(async () => {
    try {
      if (!cuotas) return [];
      
      // Obtener IDs únicos de clientes
      const clienteIds = [...new Set(cuotas.map(c => c.clienteId))];
      
      // Cargar solo esos clientes
      return await db.clientes.bulkGet(clienteIds).then(results => 
        results.filter(c => c !== undefined) as Cliente[]
      );
    } catch (err) {
      console.error('[useRuta] Error loading clientes:', err);
      return [];
    }
  }, [cuotas]);

  // OPTIMIZADO: Cargar solo créditos del cobrador
  const creditos = useLiveQuery(async () => {
    try {
      return await db.creditos
        .where('cobradorId')
        .equals(COBRADOR_ID)
        .toArray();
    } catch (err) {
      console.error('[useRuta] Error loading creditos:', err);
      return [];
    }
  }, []);

  /**
   * Procesar y agrupar cuotas por cliente
   * OPTIMIZADO: Usa campos calculados en lugar de recalcular
   * 
   * Property 2: Overdue Grouping Consistency
   * Validates: Requirements 1.4, 1.5
   */
  const procesarRuta = useCallback((): ClienteRuta[] => {
    if (!cuotas || !clientes || !creditos) {
      return [];
    }

    // Agrupar cuotas por cliente
    const cuotasPorCliente = new Map<string, ClienteRuta>();

    for (const cuota of cuotas) {
      // OPTIMIZACIÓN: Usar campo calculado 'estado' en lugar de calcular
      if (cuota.estado === 'PAGADA') continue;

      const cliente = clientes.find((c) => c.id === cuota.clienteId);
      if (!cliente) continue;

      const credito = creditos.find((cr) => cr.id === cuota.creditoId);
      if (!credito) continue;

      // Si el cliente ya existe en el mapa, agregar la cuota
      if (cuotasPorCliente.has(cliente.id)) {
        const clienteExistente = cuotasPorCliente.get(cliente.id)!;
        clienteExistente.cuotas.push(cuota);
        // OPTIMIZACIÓN: Usar campos calculados directamente
        clienteExistente.totalPendiente += cuota.saldoPendiente;
        clienteExistente.diasAtrasoMax = Math.max(
          clienteExistente.diasAtrasoMax,
          cuota.diasAtraso
        );
      } else {
        // Crear nueva entrada para el cliente
        cuotasPorCliente.set(cliente.id, {
          cliente,
          credito,
          cuotas: [cuota],
          // OPTIMIZACIÓN: Usar campos calculados directamente
          totalPendiente: cuota.saldoPendiente,
          diasAtrasoMax: cuota.diasAtraso,
        });
      }
    }

    // Convertir mapa a array
    return Array.from(cuotasPorCliente.values());
  }, [cuotas, clientes, creditos]);

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
   * OPTIMIZADO: Cambiado de useCallback a useMemo para evitar recálculos innecesarios
   * OPTIMIZADO: Usa campos calculados en lugar de recalcular estados
   * 
   * Validates: Requirements 1.2, 1.3
   */
  const estadisticas = useMemo(() => {
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

    // OPTIMIZACIÓN: Usar campos calculados directamente
    const cuotasCobradas = cuotas.filter(c => c.estado === 'PAGADA').length;
    const cuotasPendientes = cuotas.filter(c => c.estado !== 'PAGADA').length;

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
    estadisticas, // Ya no es función, es el valor memoizado
    isLoading,
    error,
    reordenarRuta,
  };
}
