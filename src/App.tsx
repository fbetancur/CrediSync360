import { useState } from 'react';
import { RutaDelDia } from './components/cobros/RutaDelDia';
import { ClientesList } from './components/clientes/ClientesList';
import './lib/seedData'; // Importar para que esté disponible en window

type Screen = 'cobros' | 'clientes';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cobros');

  return (
    <div className="h-screen flex flex-col">
      {/* Navegación Simple */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="flex">
          <button
            onClick={() => setCurrentScreen('cobros')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              currentScreen === 'cobros'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            💰 Cobros
          </button>
          <button
            onClick={() => setCurrentScreen('clientes')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              currentScreen === 'clientes'
                ? 'bg-blue-700 border-b-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            👥 Clientes
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'cobros' && <RutaDelDia />}
        {currentScreen === 'clientes' && <ClientesList />}
      </div>
    </div>
  );
}

export default App;
