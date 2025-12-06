import { useState } from 'react';
import { RutaDelDia } from './components/cobros/RutaDelDia';
import { ClientesList } from './components/clientes/ClientesList';
import { Balance } from './components/balance/Balance';
import { ProductosList } from './components/productos/ProductosList';
import './lib/seedData'; // Importar para que esté disponible en window

type Screen = 'cobros' | 'clientes' | 'balance' | 'productos';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cobros');

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
    </div>
  );
}

export default App;
