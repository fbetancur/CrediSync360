/**
 * CrediSync360 V2 - useCredito Hook
 * 
 * Hook para gestionar el otorgamiento de créditos.
 * Carga productos, calcula cuotas y crea créditos.
 * 
 * Validates: Requirements 5.1, 5.4, 5.10, 5.11, 5.12
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { generarFechasCuotas } from '../lib/calculos';
import { addToSyncQueue } from '../lib/sync';
import type { Credito, Cuota, ProductoCredito } from '../types';

interface UseCreditoReturn {
  productos: ProductoCredito[];
  loading: boolean;
  error: Error | null;
  otorgarCredito: (params: OtorgarCreditoParams) => Promise<string>;
}

interface OtorgarCreditoParams {
  clienteId: string;
  productoId: string;
  montoOriginal: number;
  fechaDesembolso: Date;
  fechaPrimeraCuota: Date;
}

/**
 * Hook para otorgar créditos
 * 
 * Property 12: Credit Calculation Accuracy
 * Validates: Requirements 5.1, 5.4, 5.10, 5.11, 5.12
 */
export function useCredito(): UseCreditoReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cargar productos de crédito activos
  const productos = useLiveQuery(async () => {
    try {
      const allProductos = await db.productos.toArray();
      return allProductos.filter((p) => p.activo === true);
    } catch (err) {
      console.error('[useCredito] Error loading productos:', err);
      setError(err as Error);
      return [];
    }
  }, []);

  /**
   * Calcular valores del crédito
   * 
   * Property 12: Credit Calculation Accuracy
   * Validates: Requirements 5.4
   */
  const calcularCredito = (
    montoOriginal: number,
    interesPorcentaje: number,
    numeroCuotas: number
  ) => {
    // Calcular total a pagar
    const totalAPagar = montoOriginal * (1 + interesPorcentaje / 100);
    
    // Calcular valor de cada cuota
    const valorCuota = totalAPagar / numeroCuotas;

    return {
      totalAPagar: Math.round(totalAPagar),
      valorCuota: Math.round(valorCuota),
    };
  };

  /**
   * Otorgar un crédito
   * 
   * Property 11: Installment Date Generation Correctness
   * Validates: Requirements 5.10, 5.11, 5.12
   */
  const otorgarCredito = async (params: OtorgarCreditoParams): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // Buscar el producto
      const producto = await db.productos.get(params.productoId);
      if (!producto) {
        throw new Error('Producto de crédito no encontrado');
      }

      // Calcular valores del crédito
      const { totalAPagar, valorCuota } = calcularCredito(
        params.montoOriginal,
        producto.interesPorcentaje,
        producto.numeroCuotas
      );

      // Generar ID único para el crédito
      const creditoId = `credito-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Generar fechas de cuotas
      const fechasCuotas = generarFechasCuotas(
        params.fechaPrimeraCuota,
        producto.numeroCuotas,
        producto.frecuencia,
        producto.excluirDomingos
      );

      const fechaUltimaCuota = fechasCuotas[fechasCuotas.length - 1];

      // Crear objeto crédito con campos calculados inicializados
      const credito: Credito = {
        id: creditoId,
        tenantId: 'tenant-1', // TODO: Obtener del contexto de autenticación
        clienteId: params.clienteId,
        productoId: params.productoId,
        cobradorId: 'user-1', // TODO: Obtener del contexto de autenticación
        montoOriginal: params.montoOriginal,
        interesPorcentaje: producto.interesPorcentaje,
        totalAPagar,
        numeroCuotas: producto.numeroCuotas,
        valorCuota,
        frecuencia: producto.frecuencia,
        fechaDesembolso: params.fechaDesembolso.toISOString().split('T')[0],
        fechaPrimeraCuota: params.fechaPrimeraCuota.toISOString().split('T')[0],
        fechaUltimaCuota,
        estado: 'ACTIVO',
        // Campos calculados (inicializados para crédito nuevo)
        saldoPendiente: totalAPagar,
        cuotasPagadas: 0,
        diasAtraso: 0,
        ultimaActualizacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user-1', // TODO: Obtener del contexto de autenticación
      };

      // Crear cuotas con campos calculados inicializados
      const cuotas: Cuota[] = fechasCuotas.map((fecha, index) => ({
        id: `cuota-${creditoId}-${index + 1}`,
        tenantId: 'tenant-1',
        creditoId,
        clienteId: params.clienteId,
        numero: index + 1,
        fechaProgramada: fecha,
        montoProgramado: valorCuota,
        // Campos calculados (inicializados para cuota nueva sin pagos)
        montoPagado: 0,
        saldoPendiente: valorCuota,
        estado: 'PENDIENTE',
        diasAtraso: 0,
        ultimaActualizacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user-1',
      }));

      // Guardar crédito en Dexie
      await db.creditos.add(credito);
      console.log('✅ Crédito creado:', credito);

      // Guardar cuotas en Dexie
      await db.cuotas.bulkAdd(cuotas);
      console.log(`✅ ${cuotas.length} cuotas creadas`);

      // Actualizar campos calculados del cliente
      const { actualizarCamposCliente } = await import('../lib/actualizarCampos');
      await actualizarCamposCliente(params.clienteId);

      // Agregar a sync queue
      await addToSyncQueue('CREATE_CREDITO', {
        credito,
        cuotas,
      });

      return creditoId;
    } catch (err) {
      const errorObj = err as Error;
      console.error('[useCredito] Error al otorgar crédito:', errorObj);
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return {
    productos: productos || [],
    loading,
    error,
    otorgarCredito,
  };
}

/**
 * Calcular preview de un crédito sin guardarlo
 * 
 * Útil para mostrar cálculos en tiempo real en el formulario
 */
export function calcularPreviewCredito(
  montoOriginal: number,
  interesPorcentaje: number,
  numeroCuotas: number
) {
  const totalAPagar = montoOriginal * (1 + interesPorcentaje / 100);
  const valorCuota = totalAPagar / numeroCuotas;

  return {
    totalAPagar: Math.round(totalAPagar),
    valorCuota: Math.round(valorCuota),
    interesTotal: Math.round(totalAPagar - montoOriginal),
  };
}
