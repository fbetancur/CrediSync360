/**
 * Componente de Lista de Productos de Crédito
 * 
 * Permite ver, crear, editar y desactivar productos de crédito
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import type { ProductoCredito } from '../../types';
import { NuevoProducto } from './NuevoProducto';

// TODO: Reemplazar con valores reales del contexto de autenticación
const TENANT_ID = 'tenant-demo';

export function ProductosList() {
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<ProductoCredito | null>(
    null
  );

  // Cargar TODOS los productos (activos e inactivos)
  const productos = useLiveQuery(
    () =>
      db.productos
        .where('tenantId')
        .equals(TENANT_ID)
        .toArray(),
    []
  );

  const handleToggleActivo = async (producto: ProductoCredito) => {
    const accion = producto.activo ? 'desactivar' : 'activar';
    
    if (
      !confirm(
        `¿Estás seguro de ${accion} el producto "${producto.nombre}"?`
      )
    ) {
      return;
    }

    try {
      await db.productos.update(producto.id, { activo: !producto.activo });
    } catch (error) {
      console.error(`Error al ${accion} producto:`, error);
      alert(`Error al ${accion} el producto`);
    }
  };

  const handleEditar = (producto: ProductoCredito) => {
    setProductoEditar(producto);
    setShowNuevoProducto(true);
  };

  const handleCloseModal = () => {
    setShowNuevoProducto(false);
    setProductoEditar(null);
  };

  // Loading state
  if (!productos) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <h1 className="text-2xl font-bold text-gray-900">
              Productos de Crédito
            </h1>
          </div>
          <button
            onClick={() => setShowNuevoProducto(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="max-w-4xl mx-auto space-y-4">
        {productos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              No hay productos de crédito creados
            </p>
            <button
              onClick={() => setShowNuevoProducto(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Crear Primer Producto
            </button>
          </div>
        ) : (
          productos.map((producto) => (
            <div
              key={producto.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                producto.activo
                  ? 'border-green-200'
                  : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className={`text-xl font-bold ${
                  producto.activo ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {producto.nombre}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  producto.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">📊</span>
                  <span className="text-gray-700">
                    <span className="font-medium">Interés:</span>{' '}
                    {producto.interesPorcentaje}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📅</span>
                  <span className="text-gray-700">
                    <span className="font-medium">Cuotas:</span>{' '}
                    {producto.numeroCuotas}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-purple-600">🔄</span>
                  <span className="text-gray-700">
                    <span className="font-medium">Frecuencia:</span>{' '}
                    {producto.frecuencia}
                  </span>
                </div>

                {producto.excluirDomingos && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">📆</span>
                    <span className="text-gray-700">Excluye domingos</span>
                  </div>
                )}
              </div>

              {(producto.montoMinimo || producto.montoMaximo) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Rango de montos:</span>{' '}
                    {producto.montoMinimo
                      ? `$${producto.montoMinimo.toLocaleString('es-CO')}`
                      : 'Sin mínimo'}{' '}
                    -{' '}
                    {producto.montoMaximo
                      ? `$${producto.montoMaximo.toLocaleString('es-CO')}`
                      : 'Sin máximo'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleEditar(producto)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>✏️</span>
                  Editar
                </button>
                {producto.activo ? (
                  <button
                    onClick={() => handleToggleActivo(producto)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🚫</span>
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleActivo(producto)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    Activar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo/Editar Producto */}
      {showNuevoProducto && (
        <NuevoProducto
          producto={productoEditar}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
