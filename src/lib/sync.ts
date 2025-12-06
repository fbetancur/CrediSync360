/**
 * CrediSync360 V2 - Sync Manager
 * 
 * Maneja la sincronización offline-first entre IndexedDB y AWS AppSync.
 * Todas las operaciones se guardan localmente primero y se sincronizan en background.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { db } from './db';
import type { SyncQueueItem, SyncOperationType } from '../types';

const client = generateClient<Schema>();

// ============================================================================
// Configuración
// ============================================================================

const SYNC_INTERVAL = 30000; // 30 segundos
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; // 1 segundo
const MAX_BACKOFF = 60000; // 1 minuto

// ============================================================================
// Estado del Sync Manager
// ============================================================================

let syncIntervalId: number | null = null;
let isSyncing = false;

// ============================================================================
// Agregar Operaciones a la Cola
// ============================================================================

/**
 * Agregar una operación a la cola de sincronización
 * 
 * @param type - Tipo de operación
 * @param data - Datos de la operación
 * 
 * Property 14: Sync Queue FIFO Ordering
 * Validates: Requirements 7.1, 7.2
 */
export async function addToSyncQueue(
  type: SyncOperationType,
  data: any
): Promise<void> {
  await db.syncQueue.add({
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
    status: 'PENDING',
  });

  console.log(`[Sync] Added to queue: ${type}`, data);
}

// ============================================================================
// Procesar Cola de Sincronización
// ============================================================================

/**
 * Procesar un item de la cola de sincronización
 * 
 * @param item - Item a sincronizar
 * @returns true si se sincronizó exitosamente
 * 
 * Validates: Requirements 7.3, 7.4, 7.5
 */
async function processSyncItem(item: SyncQueueItem): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Sync] Processing: ${item.type}`, item.data);

    switch (item.type) {
      case 'CREATE_RUTA':
        await client.models.Ruta.create(item.data);
        break;

      case 'CREATE_CLIENTE':
        await client.models.Cliente.create(item.data);
        break;

      case 'CREATE_CREDITO':
        // Crear crédito y sus cuotas
        await client.models.Credito.create(item.data.credito);
        
        // Crear cuotas en batch
        for (const cuota of item.data.cuotas) {
          await client.models.Cuota.create(cuota);
        }
        break;

      case 'CREATE_PAGO':
        await client.models.Pago.create(item.data);
        break;

      case 'CREATE_CIERRE':
        await client.models.CierreCaja.create(item.data);
        break;

      case 'CREATE_MOVIMIENTO':
        await client.models.MovimientoCaja.create(item.data);
        break;

      default:
        const unknownError = `Unknown operation type: ${item.type}`;
        console.error(`[Sync] ${unknownError}`);
        return { success: false, error: unknownError };
    }

    console.log(`[Sync] Success: ${item.type}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Error processing ${item.type}:`, error);
    console.error(`[Sync] Error details:`, JSON.stringify(error, null, 2));
    return { success: false, error: errorMessage };
  }
}

/**
 * Calcular tiempo de espera con exponential backoff
 * 
 * @param retries - Número de reintentos
 * @returns Tiempo de espera en milisegundos
 * 
 * Property 16: Sync Retry Exponential Backoff
 * Validates: Requirements 7.5
 */
function calculateBackoff(retries: number): number {
  const backoff = INITIAL_BACKOFF * Math.pow(2, retries);
  return Math.min(backoff, MAX_BACKOFF);
}

/**
 * Procesar toda la cola de sincronización
 * OPTIMIZADO: Procesa items en batches paralelos para mayor velocidad
 * 
 * Property 14: Sync Queue FIFO Ordering
 * Validates: Requirements 7.3, 7.4, 7.5, 7.6
 */
async function processSyncQueue(): Promise<void> {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping...');
    return;
  }

  if (!navigator.onLine) {
    console.log('[Sync] Offline, skipping sync...');
    return;
  }

  isSyncing = true;

  try {
    // Obtener items pendientes ordenados por timestamp (FIFO)
    const pendingItems = await db.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('timestamp');

    if (pendingItems.length === 0) {
      console.log('[Sync] No pending items');
      return;
    }

    console.log(`[Sync] Processing ${pendingItems.length} items in parallel batches...`);

    // OPTIMIZACIÓN: Procesar en batches paralelos de 10 items
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
      const batch = pendingItems.slice(i, i + BATCH_SIZE);
      
      console.log(`[Sync] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pendingItems.length / BATCH_SIZE)} (${batch.length} items)`);

      // Procesar batch en paralelo con Promise.allSettled
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          // Verificar si debe esperar por backoff
          if (item.retries > 0) {
            const backoff = calculateBackoff(item.retries);
            const timeSinceLastRetry = Date.now() - (item.timestamp || 0);
            
            if (timeSinceLastRetry < backoff) {
              console.log(
                `[Sync] Waiting for backoff: ${item.type} (${backoff - timeSinceLastRetry}ms remaining)`
              );
              return { item, result: { success: false, error: 'Waiting for backoff' }, skip: true };
            }
          }

          // Intentar sincronizar
          const result = await processSyncItem(item);
          return { item, result, skip: false };
        })
      );

      // Procesar resultados de cada item en el batch
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const promiseResult = results[j];

        // Si la promesa fue rechazada (error inesperado)
        if (promiseResult.status === 'rejected') {
          console.error(`[Sync] Unexpected error for ${item.type}:`, promiseResult.reason);
          
          const newRetries = item.retries + 1;
          await db.syncQueue.update(item.id!, {
            retries: newRetries,
            lastError: String(promiseResult.reason),
            status: newRetries >= MAX_RETRIES ? 'FAILED' : 'PENDING',
          });
          continue;
        }

        // Si la promesa fue resuelta
        const { result, skip } = promiseResult.value;

        // Si se debe saltar (esperando backoff)
        if (skip) {
          continue;
        }

        if (result.success) {
          // Marcar como sincronizado
          await db.syncQueue.update(item.id!, {
            status: 'SYNCED',
            syncedAt: Date.now(),
          });
        } else {
          // Incrementar reintentos
          const newRetries = item.retries + 1;

          if (newRetries >= MAX_RETRIES) {
            // Marcar como fallido después de MAX_RETRIES
            await db.syncQueue.update(item.id!, {
              status: 'FAILED',
              retries: newRetries,
              lastError: result.error || 'Max retries exceeded',
            });

            console.error(`[Sync] Failed after ${MAX_RETRIES} retries: ${item.type}`);
            console.error(`[Sync] Last error: ${result.error}`);
            
            // TODO: Notificar al usuario
          } else {
            // Incrementar contador de reintentos
            await db.syncQueue.update(item.id!, {
              retries: newRetries,
              lastError: result.error || 'Sync failed, will retry',
            });

            console.log(`[Sync] Retry ${newRetries}/${MAX_RETRIES}: ${item.type}`);
            console.log(`[Sync] Error: ${result.error}`);
          }
        }
      }
    }

    console.log('[Sync] Queue processing complete');
  } catch (error) {
    console.error('[Sync] Error processing queue:', error);
  } finally {
    isSyncing = false;
  }
}

// ============================================================================
// Control del Sync Manager
// ============================================================================

/**
 * Iniciar sincronización automática en background
 * 
 * Validates: Requirements 7.3, 7.10
 */
export function startSync(): void {
  if (syncIntervalId !== null) {
    console.log('[Sync] Already running');
    return;
  }

  console.log(`[Sync] Starting background sync (every ${SYNC_INTERVAL}ms)`);

  // Sincronizar inmediatamente
  processSyncQueue();

  // Configurar intervalo
  syncIntervalId = window.setInterval(() => {
    processSyncQueue();
  }, SYNC_INTERVAL);

  // Escuchar eventos de conexión
  window.addEventListener('online', () => {
    console.log('[Sync] Connection restored, syncing...');
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[Sync] Connection lost');
  });
}

/**
 * Detener sincronización automática
 */
export function stopSync(): void {
  if (syncIntervalId !== null) {
    console.log('[Sync] Stopping background sync');
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Forzar sincronización inmediata
 * 
 * @returns Promise que se resuelve cuando termina la sincronización
 */
export async function forceSyncNow(): Promise<void> {
  console.log('[Sync] Forcing immediate sync...');
  await processSyncQueue();
}

/**
 * Obtener estadísticas de la cola de sincronización
 * 
 * @returns Estadísticas de la cola
 */
export async function getSyncStats(): Promise<{
  pending: number;
  synced: number;
  failed: number;
  total: number;
}> {
  const [pending, synced, failed, total] = await Promise.all([
    db.syncQueue.where('status').equals('PENDING').count(),
    db.syncQueue.where('status').equals('SYNCED').count(),
    db.syncQueue.where('status').equals('FAILED').count(),
    db.syncQueue.count(),
  ]);

  return { pending, synced, failed, total };
}

/**
 * Obtener items fallidos con detalles de error
 * 
 * @returns Array de items fallidos con sus errores
 */
export async function getFailedItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue
    .where('status')
    .equals('FAILED')
    .toArray();
}

/**
 * Reintentar items fallidos (resetear a PENDING)
 * 
 * @returns Número de items reseteados
 */
export async function retryFailedItems(): Promise<number> {
  const failedItems = await getFailedItems();
  
  for (const item of failedItems) {
    await db.syncQueue.update(item.id!, {
      status: 'PENDING',
      retries: 0,
      lastError: undefined,
    });
  }

  console.log(`[Sync] Reset ${failedItems.length} failed items to retry`);
  
  // Forzar sincronización inmediata
  await processSyncQueue();
  
  return failedItems.length;
}

/**
 * Limpiar items sincronizados antiguos (más de 7 días)
 * 
 * @returns Número de items eliminados
 */
export async function cleanupSyncedItems(): Promise<number> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const oldItems = await db.syncQueue
    .where('status')
    .equals('SYNCED')
    .and((item) => (item.syncedAt || 0) < sevenDaysAgo)
    .toArray();

  if (oldItems.length > 0) {
    await db.syncQueue.bulkDelete(oldItems.map((item) => item.id!));
    console.log(`[Sync] Cleaned up ${oldItems.length} old synced items`);
  }

  return oldItems.length;
}

// ============================================================================
// Resolución de Conflictos
// ============================================================================

/**
 * Resolver conflicto entre datos locales y del servidor
 * 
 * Regla simple: El servidor siempre gana
 * 
 * @param _localData - Datos locales (no usado, el servidor siempre gana)
 * @param serverData - Datos del servidor
 * @returns Datos resueltos (siempre del servidor)
 * 
 * Validates: Requirements 7.7, 7.8
 */
export function resolveConflict<T>(_localData: T, serverData: T): T {
  console.log('[Sync] Conflict detected, server wins');
  return serverData;
}

// ============================================================================
// Exportar para uso en la aplicación
// ============================================================================

export default {
  addToSyncQueue,
  startSync,
  stopSync,
  forceSyncNow,
  getSyncStats,
  getFailedItems,
  retryFailedItems,
  cleanupSyncedItems,
  resolveConflict,
};
