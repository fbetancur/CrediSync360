function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-600 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🚀 CrediSync360 V2
        </h1>
        
        <div className="space-y-4 text-gray-700">
          <p className="text-lg">
            Aplicación PWA para cobradores de microcréditos
          </p>
          
          <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
            <h2 className="font-semibold text-purple-900 mb-2">
              ✅ Fase 1 Completada
            </h2>
            <ul className="space-y-1 text-sm">
              <li>✅ Tailwind CSS v4 configurado</li>
              <li>✅ Amplify Backend con 6 modelos</li>
              <li>✅ Auth con custom attributes (tenantId, role)</li>
              <li>✅ Authorization con userPool</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <h2 className="font-semibold text-blue-900 mb-2">
              🔄 En Progreso
            </h2>
            <p className="text-sm">
              Fase 2: Base de Datos Local (Dexie) y Funciones Puras
            </p>
          </div>
          
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
            <h2 className="font-semibold text-gray-900 mb-2">
              📋 Próximas Funcionalidades
            </h2>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Ruta del día con 200+ clientes</li>
              <li>• Registro de pagos offline-first</li>
              <li>• Gestión de clientes y créditos</li>
              <li>• Cierre de caja</li>
              <li>• Sincronización automática</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
          <p>
            🎯 <span className="font-semibold">Objetivo:</span> 200 clientes/día, 
            &lt;100ms respuesta UI, sincronización perfecta
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;
