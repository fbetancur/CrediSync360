/**
 * CrediSync360 V2 - RutaDelDia Component
 * 
 * Pantalla principal de la ruta del día del cobrador.
 * Muestra lista de clientes con cuotas pendientes, ordenados por prioridad.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.9
 */

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useRuta } from '../../hooks/useRuta';
import { ClienteCard } from './ClienteCard';
import { RegistrarPago } from './RegistrarPago';
import type { ClienteRuta } from '../../types';

export function RutaDelDia() {
  const { rutaDelDia, estadisticas, isLoading, error, reordenarRuta } = useRuta();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRuta | null>(null);

  // Manejar drag & drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // Si no cambió de posición, no hacer nada
    if (result.destination.index === result.source.index) return;

    const items = Array.from(rutaDelDia);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar orden
    const nuevoOrden = items.map((item) => item.cliente.id);
    reordenarRuta(nuevoOrden);
    
    console.log('✅ Ruta reordenada:', nuevoOrden);
  };

  // Formatear montos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ruta del día...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error al cargar la ruta</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rutaDelDia.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👋 ¡Bienvenido a CrediSync360!
            </h1>
            <p className="text-gray-600">
              No hay datos en la base de datos local
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">
              📝 Para agregar datos de prueba:
            </h2>
            <ol className="space-y-2 text-sm text-blue-800">
              <li>1. Abre las DevTools (presiona F12)</li>
              <li>2. Ve a la pestaña <strong>Console</strong></li>
              <li>3. Ejecuta este comando:</li>
            </ol>
            <div className="bg-blue-900 text-blue-100 p-3 rounded mt-3 font-mono text-sm">
              await window.seedData.resetAndSeed()
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Luego presiona Enter y recarga la página (F5)
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <h2 className="font-semibold text-green-900 mb-2">
              ✅ Esto creará:
            </h2>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• 5 clientes de prueba</li>
              <li>• 5 créditos activos</li>
              <li>• 50 cuotas (algunas atrasadas, algunas de hoy)</li>
            </ul>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              💡 Tip: Lee el archivo <strong>TESTING.md</strong> para más información
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header: Resumen del Día */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Ruta del Día
        </h1>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Cobrado Hoy */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium mb-1">
              COBRADO HOY
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatMonto(estadisticas.totalCobradoHoy)}
            </p>
          </div>

          {/* Cuotas Cobradas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">
              COBRADAS
            </p>
            <p className="text-xl font-bold text-blue-700">
              {estadisticas.cuotasCobradas}
            </p>
          </div>

          {/* Cuotas Pendientes */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium mb-1">
              PENDIENTES
            </p>
            <p className="text-xl font-bold text-orange-700">
              {estadisticas.cuotasPendientes}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ruta-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-4 space-y-3"
              >
                {rutaDelDia.map((clienteRuta, index) => (
                  <Draggable
                    key={clienteRuta.cliente.id}
                    draggableId={clienteRuta.cliente.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          transform: snapshot.isDragging 
                            ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
                            : provided.draggableProps.style?.transform,
                        }}
                      >
                        <ClienteCard
                          clienteRuta={clienteRuta}
                          onClick={() => {
                            // Prevenir click durante drag
                            if (!snapshot.isDragging) {
                              setClienteSeleccionado(clienteRuta);
                            }
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modal de Registro de Pago */}
      {clienteSeleccionado && (
        <RegistrarPago
          clienteRuta={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
          onSuccess={() => {
            console.log('✅ Pago registrado exitosamente');
            // La UI se actualizará automáticamente gracias a useLiveQuery
          }}
        />
      )}
    </div>
  );
}
