/**
 * CrediSync360 V2 - useCobro Hook
 * 
 * Hook para gestionar el registro de pagos.
 * Guarda pagos en Dexie, agrega a sync queue y distribuye entre cuotas.
 * 
 * Validates: Requirements 2.1, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { useState } from 'react';
import { db } from '../lib/db';
import { distribuirPago } from '../lib/calculos';
import { addToSyncQueue } from '../lib/sync';
import type { Pago, Cuota } from '../types';

interface UseCobroReturn {
  registrarPago: (pago: Omit<Pago, 'id' | 'createdAt'>) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para registrar pagos
 * 
 * Property 6: Payment Idempotency
 * Validates: Requirements 2.6, 2.7
 */
export function useCobro(): UseCobroReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Registrar un pago
   * 
   * Validates: Requirements 2.1, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
   */
  const registrarPago = async (
    pagoData: Omit<Pago, 'id' | 'createdAt'>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Generar ID único
      const pagoId = `pago-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      // Crear objeto de pago completo
      const pago: Pago = {
        ...pagoData,
        id: pagoId,
        createdAt: new Date().toISOString(),
      };

      // Validar que el monto sea mayor a 0
      if (pago.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      // Capturar ubicación GPS si está disponible
      if (navigator.geolocation && !pago.latitud && !pago.longitud) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false,
              });
            }
          );
          
          pago.latitud = position.coords.latitude;
          pago.longitud = position.coords.longitude;
        } catch (gpsError) {
          // Si falla la ubicación, continuar sin ella
          console.warn('[useCobro] No se pudo obtener ubicación GPS:', gpsError);
        }
      }

      // Guardar pago en Dexie (Requirements 2.6)
      await db.pagos.add(pago);
      
      console.log('✅ Pago registrado:', pago);

      // Agregar a sync queue (Requirements 2.7)
      await addToSyncQueue('CREATE_PAGO', pago);

      // La UI se actualizará automáticamente gracias a useLiveQuery (Requirements 2.8)
      
    } catch (err) {
      const errorObj = err as Error;
      console.error('[useCobro] Error al registrar pago:', errorObj);
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return {
    registrarPago,
    loading,
    error,
  };
}

/**
 * Calcular distribución de pago entre cuotas
 * 
 * Esta función es un wrapper de la función pura distribuirPago
 * para facilitar su uso en componentes.
 * 
 * Validates: Requirements 2.9, 2.10
 */
export function calcularDistribucionPago(
  monto: number,
  cuotas: Cuota[],
  pagosExistentes: Pago[]
): Array<{ cuotaId: string; montoPagar: number }> {
  return distribuirPago(monto, cuotas, pagosExistentes);
}
