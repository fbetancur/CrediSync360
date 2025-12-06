/**
 * CrediSync360 V2 - useClientes Hook
 * 
 * Hook para gestionar la lista de clientes con búsqueda en tiempo real.
 * Calcula estado de cada cliente (mora, al día) y permite búsqueda.
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Cliente } from '../types';

interface ClienteConEstado extends Cliente {
  estado: 'MORA' | 'AL_DIA' | 'SIN_CREDITOS';
  saldoTotal: number;
  creditosActivos: number;
  diasAtrasoMax: number;
}

interface UseClientesReturn {
  clientes: ClienteConEstado[];
  loading: boolean;
  error: Error | null;
  buscar: (query: string) => void;
  queryBusqueda: string;
}

/**
 * Hook para gestionar lista de clientes
 * 
 * OPTIMIZADO: Usa campos calculados (cache) en lugar de calcular cada vez.
 * Los campos se actualizan automáticamente cuando se registran pagos.
 * 
 * Property 9: Client Search Completeness
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function useClientes(tenantId: string = 'tenant-1'): UseClientesReturn {
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [error, setError] = useState<Error | null>(null);

  // Cargar todos los clientes del tenant
  // OPTIMIZACIÓN: Ya no necesitamos cargar créditos, cuotas y pagos
  // porque los campos calculados ya están en el cliente
  const clientesBase = useLiveQuery(async () => {
    try {
      return await db.clientes
        .where('tenantId')
        .equals(tenantId)
        .toArray();
    } catch (err) {
      console.error('[useClientes] Error loading clientes:', err);
      setError(err as Error);
      return [];
    }
  }, [tenantId]);

  /**
   * Mapear clientes con estado (ya calculado)
   * 
   * OPTIMIZACIÓN: Los campos ya están calculados, solo mapeamos.
   * Antes: O(n * m * p) donde n=clientes, m=créditos, p=pagos
   * Ahora: O(n) solo mapeo
   * 
   * Validates: Requirements 3.3, 3.4, 3.5
   */
  const clientesConEstado = useMemo((): ClienteConEstado[] => {
    if (!clientesBase) {
      return [];
    }

    // Los campos calculados ya están en el cliente
    // Solo necesitamos mapear al tipo esperado
    return clientesBase.map((cliente) => ({
      ...cliente,
      // Estos campos ya están calculados y actualizados
      estado: cliente.estado,
      saldoTotal: cliente.saldoTotal,
      creditosActivos: cliente.creditosActivos,
      diasAtrasoMax: cliente.diasAtrasoMax,
    }));
  }, [clientesBase]);

  /**
   * Filtrar clientes por búsqueda
   * 
   * Property 9: Client Search Completeness
   * Validates: Requirements 3.2
   */
  const clientesFiltrados = useMemo(() => {
    if (!queryBusqueda.trim()) {
      return clientesConEstado;
    }

    const query = queryBusqueda.toLowerCase().trim();

    return clientesConEstado.filter((cliente) => {
      // Buscar en nombre
      if (cliente.nombre.toLowerCase().includes(query)) {
        return true;
      }

      // Buscar en documento
      if (cliente.documento.toLowerCase().includes(query)) {
        return true;
      }

      // Buscar en teléfono
      if (cliente.telefono.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [clientesConEstado, queryBusqueda]);

  /**
   * Función de búsqueda con debounce implícito
   * 
   * Validates: Requirements 3.2
   */
  const buscar = (query: string) => {
    setQueryBusqueda(query);
  };

  return {
    clientes: clientesFiltrados,
    loading: !clientesBase,
    error,
    buscar,
    queryBusqueda,
  };
}
