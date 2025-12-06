import { useState, useEffect } from 'react';
import { RutaDelDia } from './components/cobros/RutaDelDia';
import { ClientesList } from './components/clientes/ClientesList';
import { Balance } from './components/balance/Balance';
import { ProductosList } from './components/productos/ProductosList';
import { SyncIndicator } from './components/sync/SyncIndicator';
import { startSync, stopSync, downloadFromAWS } from './lib/sync';
import './lib/seedData'; // Importar para que esté disponible en window

type Screen = 'cobros' | 'clientes' | 'balance' | 'productos';

// TODO: Obtener del AuthContext en Fase 9
const TENANT_ID = 'tenant-1';
const RUTA_ID = 'ruta-default'; // Para cobradores

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cobros');
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);

  // Descarga inicial y sincronización automática
  useEffect(() => {
    async function initializeApp() {
      console.log('[App] Iniciando descarga inicial desde AWS...');
      
      // Descargar datos de AWS al iniciar
      const result = await downloadFromAWS(TENANT_ID, RUTA_ID);
      
      if (result.success) {
        console.log('[App] Descarga inicial completada:', result.downloaded);
      } else {
        console.error('[App] Error en descarga inicial:', result.error);
      }
      
      setIsInitialSyncComplete(true);

      // Iniciar sincronización automática (subida)
      console.log('[App] Iniciando sincronización automática...');
      startSync();
    }

    initializeApp();

    // Limpiar al desmontar
    return () => {
      console.log('[App] Deteniendo sincronización...');
      stopSync();
    };
  }, []);

  // Mostrar pantalla de carga durante la descarga inicial
  if (!isInitialSyncComplete) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Sincronizando datos...</p>
          <p className="text-sm text-gray-500 mt-2">Descargando información desde el servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Navegación Fija */}
      <nav className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg flex-shrink-0">
        <div className="flex w-full">
          <button
            onClick={() => setCurrentScreen('cobros')}
            className={`flex-1 px-3 py-4 font-medium transition-colors text-sm ${
              currentScreen === 'cobros'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            💰 Cobros
          </button>
          <button
            onClick={() => setCurrentScreen('clientes')}
            className={`flex-1 px-3 py-4 font-medium transition-colors text-sm ${
              currentScreen === 'clientes'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            👥 Clientes
          </button>
          <button
            onClick={() => setCurrentScreen('balance')}
            className={`flex-1 px-3 py-4 font-medium transition-colors text-sm ${
              currentScreen === 'balance'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            💰 Caja
          </button>
          <button
            onClick={() => setCurrentScreen('productos')}
            className={`flex-1 px-3 py-4 font-medium transition-colors text-sm ${
              currentScreen === 'productos'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            🏷️ Productos
          </button>
        </div>
      </nav>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {currentScreen === 'cobros' && <RutaDelDia />}
        {currentScreen === 'clientes' && <ClientesList />}
        {currentScreen === 'balance' && <Balance />}
        {currentScreen === 'productos' && <ProductosList />}
      </div>

      {/* Indicador de sincronización flotante */}
      <SyncIndicator />
    </div>
  );
}

export default App;
