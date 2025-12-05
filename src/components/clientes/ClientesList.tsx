/**
 * CrediSync360 V2 - ClientesList Component
 * 
 * Pantalla de lista de clientes con búsqueda en tiempo real.
 * Muestra todos los clientes del tenant con su estado.
 * 
 * Validates: Requirements 3.1, 3.2, 3.6, 3.7, 3.8
 */

import { useState } from 'react';
import { useClientes } from '../../hooks/useClientes';
import { ClienteCard } from './ClienteCard';

export function ClientesList() {
  const { clientes, loading, error, buscar, queryBusqueda } = useClientes();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error al cargar clientes</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          
          {/* Botón Nuevo Cliente */}
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Nuevo Cliente
          </button>
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative">
          <input
            type="text"
            value={queryBusqueda}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar por nombre, documento o teléfono..."
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            🔍
          </span>
          {queryBusqueda && (
            <button
              onClick={() => buscar('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-2 text-sm text-gray-600">
          {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
          {queryBusqueda && ' encontrados'}
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="flex-1 overflow-auto">
        {clientes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">
                {queryBusqueda ? '🔍 No se encontraron clientes' : '📋 No hay clientes'}
              </p>
              <p className="text-sm">
                {queryBusqueda
                  ? 'Intenta con otro término de búsqueda'
                  : 'Crea tu primer cliente para comenzar'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {clientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onClick={() => {
                  // TODO: Navegar a detalle del cliente
                  console.log('Navegar a detalle:', cliente.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Nuevo Cliente (placeholder) */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nuevo Cliente</h2>
            <p className="text-gray-600 mb-4">
              Formulario de creación de cliente (próximamente)
            </p>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
