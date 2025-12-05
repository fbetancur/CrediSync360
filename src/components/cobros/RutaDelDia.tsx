/**
 * CrediSync360 V2 - RutaDelDia Component
 * 
 * Pantalla principal de la ruta del día del cobrador.
 * Muestra lista de clientes con cuotas pendientes, ordenados por prioridad.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.9
 */

import { useState } from 'react';
import { FixedSizeList } from 'react-window';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useRuta } from '../../hooks/useRuta';
import { ClienteCard } from './ClienteCard';
import type { ClienteRuta } from '../../types';

export function RutaDelDia() {
  const { rutaDelDia, estadisticas, isLoading, error, reordenarRuta } = useRuta();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRuta | null>(null);

  // Manejar drag & drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(rutaDelDia);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar orden
    const nuevoOrden = items.map((item) => item.cliente.id);
    reordenarRuta(nuevoOrden);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-600">
          <p className="text-xl font-semibold mb-2">🎉 ¡No hay cobros pendientes!</p>
          <p className="text-sm">Todos los clientes están al día</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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
      <div className="flex-1 overflow-hidden">
        {rutaDelDia.length > 50 ? (
          // Virtualización para listas grandes (> 50 items)
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="ruta-list"
              mode="virtual"
              renderClone={(provided, _snapshot, rubric) => (
                <div
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                  className="p-2"
                >
                  <ClienteCard
                    clienteRuta={rutaDelDia[rubric.source.index]}
                    onClick={() => setClienteSeleccionado(rutaDelDia[rubric.source.index])}
                  />
                </div>
              )}
            >
              {(provided) => (
                <FixedSizeList
                  height={window.innerHeight - 200}
                  itemCount={rutaDelDia.length}
                  itemSize={180}
                  width="100%"
                  outerRef={provided.innerRef}
                >
                  {({ index, style }: { index: number; style: React.CSSProperties }) => {
                    const clienteRuta = rutaDelDia[index];
                    return (
                      <Draggable
                        draggableId={clienteRuta.cliente.id}
                        index={index}
                        key={clienteRuta.cliente.id}
                      >
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            style={{ ...style, ...provided.draggableProps.style }}
                            className="p-2"
                          >
                            <ClienteCard
                              clienteRuta={clienteRuta}
                              onClick={() => setClienteSeleccionado(clienteRuta)}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  }}
                </FixedSizeList>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          // Lista simple para listas pequeñas (<= 50 items)
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
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ClienteCard
                            clienteRuta={clienteRuta}
                            onClick={() => setClienteSeleccionado(clienteRuta)}
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
        )}
      </div>

      {/* TODO: Modal de Registro de Pago */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Registrar Pago</h2>
            <p className="text-gray-600 mb-4">
              Cliente: {clienteSeleccionado.cliente.nombre}
            </p>
            <button
              onClick={() => setClienteSeleccionado(null)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
