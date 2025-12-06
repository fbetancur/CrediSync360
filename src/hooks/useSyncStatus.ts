/**
 * CrediSync360 V2 - useSyncStatus Hook
 * 
 * Hook para monitorear el estado de sincronización en tiempo real.
 * Muestra estadísticas de la cola y permite forzar sincronización.
 */

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { forceSyncNow } from '../lib/sync';

interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  total: number;
  isOnline: boolean;
  isSyncing: boolean;
}

interface UseSyncStatusReturn {
  status: SyncStatus;
  forceSync: () => Promise<void>;
  hasUnsyncedData: boolean;
  allSynced: boolean;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Obtener estadísticas de la cola en tiempo real
  const stats = useLiveQuery(async () => {
    const [pending, synced, failed, total] = await Promise.all([
      db.syncQueue.where('status').equals('PENDING').count(),
      db.syncQueue.where('status').equals('SYNCED').count(),
      db.syncQueue.where('status').equals('FAILED').count(),
      db.syncQueue.count(),
    ]);

    return { pending, synced, failed, total };
  }, []);

  // Forzar sincronización manual
  const forceSync = async () => {
    if (!isOnline) {
      alert('⚠️ No hay conexión a internet. Conéctate para sincronizar.');
      return;
    }

    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      await forceSyncNow();
      console.log('[useSyncStatus] Sincronización forzada completada');
    } catch (error) {
      console.error('[useSyncStatus] Error en sincronización forzada:', error);
      alert('❌ Error al sincronizar. Intenta de nuevo.');
    } finally {
      setIsSyncing(false);
    }
  };

  const status: SyncStatus = {
    pending: stats?.pending || 0,
    synced: stats?.synced || 0,
    failed: stats?.failed || 0,
    total: stats?.total || 0,
    isOnline,
    isSyncing,
  };

  const hasUnsyncedData = status.pending > 0 || status.failed > 0;
  const allSynced = status.total > 0 && status.pending === 0 && status.failed === 0;

  return {
    status,
    forceSync,
    hasUnsyncedData,
    allSynced,
  };
}
