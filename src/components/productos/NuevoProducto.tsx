/**
 * Componente de Formulario para Crear/Editar Producto de Crédito
 * 
 * Permite crear o editar productos de crédito con cálculo en tiempo real
 */

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/db';
import type { ProductoCredito, Frecuencia } from '../../types';

// TODO: Reemplazar con valores reales del contexto de autenticación
const TENANT_ID = 'tenant-demo';
const USER_ID = 'user-demo';

interface NuevoProductoProps {
  producto?: ProductoCredito | null;
  onClose: () => void;
}

export function NuevoProducto({ producto, onClose }: NuevoProductoProps) {
  const [nombre, setNombre] = useState('');
  const [interes, setInteres] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('DIARIO');
  const [montoMinimo, setMontoMinimo] = useState('');
  const [montoMaximo, setMontoMaximo] = useState('');
  const [excluirDomingos, setExcluirDomingos] = useState(true);
  const [requiereAprobacion, setRequiereAprobacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos si es edición
  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setInteres(producto.interesPorcentaje.toString());
      setNumeroCuotas(producto.numeroCuotas.toString());
      setFrecuencia(producto.frecuencia);
      setMontoMinimo(producto.montoMinimo?.toString() || '');
      setMontoMaximo(producto.montoMaximo?.toString() || '');
      setExcluirDomingos(producto.excluirDomingos);
    }
  }, [producto]);

  // Cálculo de ejemplo en tiempo real
  const ejemploCalculo = useMemo(() => {
    const montoEjemplo = 100000;
    const interesNum = parseFloat(interes) || 0;
    const cuotasNum = parseInt(numeroCuotas) || 0;

    if (interesNum <= 0 || cuotasNum <= 0) {
      return null;
    }

    const interesTotal = montoEjemplo * (interesNum / 100);
    const totalAPagar = montoEjemplo + interesTotal;
    const valorCuota = totalAPagar / cuotasNum;

    return {
      interes: interesTotal,
      total: totalAPagar,
      valorCuota,
      cuotas: cuotasNum,
    };
  }, [interes, numeroCuotas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    const interesNum = parseFloat(interes);
    if (isNaN(interesNum) || interesNum <= 0) {
      setError('El interés debe ser mayor a 0');
      return;
    }

    const cuotasNum = parseInt(numeroCuotas);
    if (isNaN(cuotasNum) || cuotasNum <= 0) {
      setError('El número de cuotas debe ser mayor a 0');
      return;
    }

    const minimoNum = montoMinimo ? parseFloat(montoMinimo) : undefined;
    const maximoNum = montoMaximo ? parseFloat(montoMaximo) : undefined;

    if (minimoNum && maximoNum && minimoNum > maximoNum) {
      setError('El monto mínimo no puede ser mayor al máximo');
      return;
    }

    setLoading(true);

    try {
      if (producto) {
        // Editar producto existente
        await db.productos.update(producto.id, {
          nombre: nombre.trim(),
          interesPorcentaje: interesNum,
          numeroCuotas: cuotasNum,
          frecuencia,
          montoMinimo: minimoNum,
          montoMaximo: maximoNum,
          excluirDomingos,
        });
      } else {
        // Crear nuevo producto
        const nuevoProducto: ProductoCredito = {
          id: `producto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          tenantId: TENANT_ID,
          nombre: nombre.trim(),
          interesPorcentaje: interesNum,
          numeroCuotas: cuotasNum,
          frecuencia,
          excluirDomingos,
          montoMinimo: minimoNum,
          montoMaximo: maximoNum,
          activo: true,
          createdAt: new Date().toISOString(),
          createdBy: USER_ID,
        };

        await db.productos.add(nuevoProducto);
      }

      onClose();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setError('Error al guardar el producto');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre del Producto */}
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre del producto *
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Crédito Diario, Crédito Semanal"
              required
            />
          </div>

          {/* Interés, Cuotas y Frecuencia */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="interes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Interés (%) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                id="interes"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cuotas"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Número de cuotas *
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                id="cuotas"
                value={numeroCuotas}
                onChange={(e) => setNumeroCuotas(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                min="1"
                required
              />
            </div>

            <div>
              <label
                htmlFor="frecuencia"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Frecuencia *
              </label>
              <select
                id="frecuencia"
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>
          </div>

          {/* Monto Mínimo y Máximo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minimo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Monto mínimo
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                id="minimo"
                value={montoMinimo}
                onChange={(e) => setMontoMinimo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 50000"
                min="0"
              />
            </div>

            <div>
              <label
                htmlFor="maximo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Monto máximo
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                id="maximo"
                value={montoMaximo}
                onChange={(e) => setMontoMaximo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1000000"
                min="0"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excluirDomingos}
                onChange={(e) => setExcluirDomingos(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                Excluir domingos (solo para frecuencia diaria)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiereAprobacion}
                onChange={(e) => setRequiereAprobacion(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                Requiere aprobación de supervisor
              </span>
            </label>
          </div>

          {/* Ejemplo de Cálculo */}
          {ejemploCalculo && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>💡</span>
                Ejemplo de cálculo (préstamo de $100,000):
              </p>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Interés:</p>
                  <p className="font-bold text-gray-900">
                    ${ejemploCalculo.interes.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total a pagar:</p>
                  <p className="font-bold text-gray-900">
                    ${ejemploCalculo.total.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Valor cuota:</p>
                  <p className="font-bold text-gray-900">
                    ${ejemploCalculo.valorCuota.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Cuotas:</p>
                  <p className="font-bold text-gray-900">
                    {ejemploCalculo.cuotas}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span>✅</span>
                  {producto ? 'Actualizar Producto' : 'Crear Producto'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
