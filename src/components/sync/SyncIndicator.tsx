/**
 * CrediSync360 V2 - SyncIndicator Component
 * 
 * Indicador visual del estado de sincronización.
 * Muestra estadísticas en tiempo real y permite forzar sincronización.
 */

import { useState, useEffect } from 'react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { getFailedItems, retryFailedItems } from '../../lib/sync';
import type { SyncQueueItem } from '../../types';

export function SyncIndicator() {
  const { status, forceSync, hasUnsyncedData, allSynced } = useSyncStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  // Cargar items fallidos cuando se abre el modal
  useEffect(() => {
    if (showDetails && status.failed > 0) {
      getFailedItems().then(setFailedItems).catch(console.error);
    }
  }, [showDetails, status.failed]);

  // Determinar color y mensaje según estado
  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-gray-500';
    if (status.failed > 0) return 'bg-red-500';
    if (status.pending > 0) return 'bg-yellow-500';
    if (allSynced) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return '📡';
    if (status.isSyncing) return '🔄';
    if (status.failed > 0) return '⚠️';
    if (status.pending > 0) return '⏳';
    if (allSynced) return '✅';
    return '💾';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Sin conexión';
    if (status.isSyncing) return 'Sincronizando...';
    if (status.failed > 0) return `${status.failed} errores`;
    if (status.pending > 0) return `${status.pending} pendientes`;
    if (allSynced) return 'Todo sincronizado';
    return 'Sin datos';
  };

  return (
    <>
      {/* Botón flotante del indicador */}
      <button
        onClick={() => setShowDetails(true)}
        className={`fixed bottom-4 right-4 ${getStatusColor()} text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 font-medium z-40 transition-all hover:scale-105 active:scale-95`}
      >
        <span className={status.isSyncing ? 'animate-spin' : ''}>
          {getStatusIcon()}
        </span>
        <span className="text-sm">{getStatusText()}</span>
      </button>

      {/* Modal de detalles */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Estado de Sincronización</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Estado de conexión */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Conexión</span>
                <span className={`font-bold ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {status.isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
                </span>
              </div>

              {/* Estadísticas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <span className="font-medium text-yellow-900">⏳ Pendientes</span>
                  <span className="text-2xl font-bold text-yellow-700">{status.pending}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-medium text-green-900">✅ Sincronizados</span>
                  <span className="text-2xl font-bold text-green-700">{status.synced}</span>
                </div>

                {status.failed > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-200">
                    <span className="font-medium text-red-900">❌ Errores</span>
                    <span className="text-2xl font-bold text-red-700">{status.failed}</span>
                  </div>
                )}
              </div>

              {/* Mensaje de estado */}
              {allSynced && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Todos los datos están sincronizados correctamente
                  </p>
                </div>
              )}

              {hasUnsyncedData && status.isOnline && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p className="text-sm text-yellow-700 font-medium">
                    ⏳ Hay datos pendientes de sincronizar. La sincronización automática se ejecuta cada 30 segundos.
                  </p>
                </div>
              )}

              {hasUnsyncedData && !status.isOnline && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Sin conexión a internet. Los datos se sincronizarán automáticamente cuando te conectes.
                  </p>
                </div>
              )}

              {status.failed > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ❌ {status.failed} registro(s) fallaron al sincronizar
                  </p>
                  {failedItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {failedItems.slice(0, 3).map((item, index) => (
                        <div key={item.id || index} className="text-xs text-red-600 bg-white p-2 rounded">
                          <div className="font-medium">{item.type}</div>
                          <div className="text-red-500 truncate">{item.lastError || 'Error desconocido'}</div>
                        </div>
                      ))}
                      {failedItems.length > 3 && (
                        <div className="text-xs text-red-600">
                          ... y {failedItems.length - 3} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-2">
                {/* Botón de sincronización forzada */}
                {status.isOnline && hasUnsyncedData && status.failed === 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await forceSync();
                      } catch (error) {
                        console.error('[SyncIndicator] Error en forceSync:', error);
                      }
                    }}
                    disabled={status.isSyncing}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status.isSyncing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        🔄 Forzar Sincronización Ahora
                      </>
                    )}
                  </button>
                )}

                {/* Botón para reintentar items fallidos */}
                {status.failed > 0 && (
                  <button
                    onClick={async () => {
                      setIsRetrying(true);
                      try {
                        const count = await retryFailedItems();
                        alert(`✅ Se reintentarán ${count} registro(s)`);
                        setShowDetails(false);
                      } catch (error) {
                        console.error('[SyncIndicator] Error al reintentar:', error);
                        alert('❌ Error al reintentar. Revisa la consola.');
                      } finally {
                        setIsRetrying(false);
                      }
                    }}
                    disabled={isRetrying || !status.isOnline}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRetrying ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Reintentando...
                      </>
                    ) : (
                      <>
                        🔄 Reintentar Items Fallidos
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
