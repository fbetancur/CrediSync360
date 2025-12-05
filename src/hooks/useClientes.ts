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
import { calcularEstadoCliente } from '../lib/calculos';
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
 * Property 9: Client Search Completeness
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function useClientes(tenantId: string = 'tenant-1'): UseClientesReturn {
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [error, setError] = useState<Error | null>(null);

  // Cargar todos los clientes del tenant
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

  // Cargar todos los créditos
  const creditos = useLiveQuery(async () => {
    try {
      return await db.creditos
        .where('tenantId')
        .equals(tenantId)
        .toArray();
    } catch (err) {
      console.error('[useClientes] Error loading creditos:', err);
      return [];
    }
  }, [tenantId]);

  // Cargar todas las cuotas
  const cuotas = useLiveQuery(async () => {
    try {
      return await db.cuotas
        .where('tenantId')
        .equals(tenantId)
        .toArray();
    } catch (err) {
      console.error('[useClientes] Error loading cuotas:', err);
      return [];
    }
  }, [tenantId]);

  // Cargar todos los pagos
  const pagos = useLiveQuery(async () => {
    try {
      return await db.pagos
        .where('tenantId')
        .equals(tenantId)
        .toArray();
    } catch (err) {
      console.error('[useClientes] Error loading pagos:', err);
      return [];
    }
  }, [tenantId]);

  /**
   * Calcular estado de cada cliente
   * 
   * Validates: Requirements 3.3, 3.4, 3.5
   */
  const clientesConEstado = useMemo((): ClienteConEstado[] => {
    if (!clientesBase || !creditos || !cuotas || !pagos) {
      return [];
    }

    return clientesBase.map((cliente) => {
      // Obtener créditos del cliente
      const creditosCliente = creditos.filter((c) => c.clienteId === cliente.id);
      
      // Obtener cuotas del cliente
      const cuotasCliente = cuotas.filter((c) => c.clienteId === cliente.id);
      
      // Obtener pagos del cliente
      const pagosCliente = pagos.filter((p) => p.clienteId === cliente.id);

      // Calcular estado del cliente
      const estadoCliente = calcularEstadoCliente(
        cliente,
        creditosCliente,
        cuotasCliente,
        pagosCliente
      );

      return {
        ...cliente,
        estado: estadoCliente.estado,
        saldoTotal: estadoCliente.saldoTotal,
        creditosActivos: estadoCliente.creditosActivos,
        diasAtrasoMax: estadoCliente.diasAtrasoMax,
      };
    });
  }, [clientesBase, creditos, cuotas, pagos]);

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
    loading: !clientesBase || !creditos || !cuotas || !pagos,
    error,
    buscar,
    queryBusqueda,
  };
}
