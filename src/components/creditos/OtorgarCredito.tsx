/**
 * CrediSync360 V2 - OtorgarCredito Component
 * 
 * Formulario para otorgar un nuevo crédito a un cliente.
 * Calcula automáticamente intereses, total y valor de cuotas.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.13
 */

import { useState, useEffect, useMemo } from 'react';
import { useCredito, calcularPreviewCredito } from '../../hooks/useCredito';
import { generarFechasCuotas } from '../../lib/calculos';
import { format, addDays } from 'date-fns';

interface OtorgarCreditoProps {
  clienteId: string;
  clienteNombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OtorgarCredito({
  clienteId,
  clienteNombre,
  onClose,
  onSuccess,
}: OtorgarCreditoProps) {
  const { productos, loading: loadingProductos, otorgarCredito } = useCredito();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarTabla, setMostrarTabla] = useState(false);

  // Estado del formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [fechaDesembolso, setFechaDesembolso] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [fechaPrimeraCuota, setFechaPrimeraCuota] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );

  // Obtener producto seleccionado
  const producto = useMemo(() => {
    return productos.find((p) => p.id === productoSeleccionado);
  }, [productos, productoSeleccionado]);

  // Calcular preview del crédito
  const preview = useMemo(() => {
    const montoNum = parseFloat(monto);
    if (!producto || !montoNum || isNaN(montoNum)) {
      return null;
    }

    return calcularPreviewCredito(
      montoNum,
      producto.interesPorcentaje,
      producto.numeroCuotas
    );
  }, [monto, producto]);

  // Generar tabla de cuotas
  const tablaCuotas = useMemo(() => {
    if (!producto || !fechaPrimeraCuota || !preview) {
      return [];
    }

    try {
      // Parsear fecha correctamente para evitar problemas de timezone
      const [year, month, day] = fechaPrimeraCuota.split('-').map(Number);
      const fechaInicio = new Date(year, month - 1, day);
      
      const fechas = generarFechasCuotas(
        fechaInicio,
        producto.numeroCuotas,
        producto.frecuencia,
        producto.excluirDomingos
      );

      return fechas.map((fecha, index) => ({
        numero: index + 1,
        fecha,
        monto: preview.valorCuota,
      }));
    } catch (err) {
      console.error('Error generando tabla de cuotas:', err);
      return [];
    }
  }, [producto, fechaPrimeraCuota, preview]);

  // Auto-seleccionar primer producto si solo hay uno
  useEffect(() => {
    if (productos.length === 1 && !productoSeleccionado) {
      setProductoSeleccionado(productos[0].id);
    }
  }, [productos, productoSeleccionado]);

  // Formatear montos
  const formatMonto = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    // Parsear fecha correctamente para evitar problemas de timezone
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Validar formulario
  const validarFormulario = (): string | null => {
    if (!productoSeleccionado) {
      return 'Selecciona un producto de crédito';
    }

    const montoNum = parseFloat(monto);
    if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
      return 'Ingresa un monto válido';
    }

    if (producto?.montoMinimo && montoNum < producto.montoMinimo) {
      return `El monto mínimo es ${formatMonto(producto.montoMinimo)}`;
    }

    if (producto?.montoMaximo && montoNum > producto.montoMaximo) {
      return `El monto máximo es ${formatMonto(producto.montoMaximo)}`;
    }

    if (!fechaDesembolso) {
      return 'Selecciona la fecha de desembolso';
    }

    if (!fechaPrimeraCuota) {
      return 'Selecciona la fecha de la primera cuota';
    }

    return null;
  };

  // Confirmar crédito
  const handleConfirmar = async () => {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parsear fechas correctamente para evitar problemas de timezone
      const [yearDesembolso, monthDesembolso, dayDesembolso] = fechaDesembolso.split('-').map(Number);
      const [yearPrimera, monthPrimera, dayPrimera] = fechaPrimeraCuota.split('-').map(Number);
      
      await otorgarCredito({
        clienteId,
        productoId: productoSeleccionado,
        montoOriginal: parseFloat(monto),
        fechaDesembolso: new Date(yearDesembolso, monthDesembolso - 1, dayDesembolso),
        fechaPrimeraCuota: new Date(yearPrimera, monthPrimera - 1, dayPrimera),
      });

      console.log('✅ Crédito otorgado exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al otorgar el crédito');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingProductos) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg sticky top-0">
          <h2 className="text-xl font-bold">Otorgar Crédito</h2>
          <p className="text-sm text-blue-100 mt-1">Cliente: {clienteNombre}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Selector de Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto de Crédito *
            </label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            >
              <option value="">Selecciona un producto</option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre} - {prod.numeroCuotas} cuotas {prod.frecuencia.toLowerCase()}
                  {prod.interesPorcentaje > 0 && ` (${prod.interesPorcentaje}% interés)`}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Crédito *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={monto}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (/^\d*\.?\d*$/.test(valor) || valor === '') {
                    setMonto(valor);
                    setError(null);
                  }
                }}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                disabled={loading}
              />
            </div>
            {producto && (
              <p className="text-xs text-gray-500 mt-1">
                {producto.montoMinimo && producto.montoMaximo
                  ? `Rango: ${formatMonto(producto.montoMinimo)} - ${formatMonto(producto.montoMaximo)}`
                  : producto.montoMinimo
                  ? `Mínimo: ${formatMonto(producto.montoMinimo)}`
                  : producto.montoMaximo
                  ? `Máximo: ${formatMonto(producto.montoMaximo)}`
                  : ''}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fecha de Desembolso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Desembolso *
              </label>
              <input
                type="date"
                value={fechaDesembolso}
                onChange={(e) => setFechaDesembolso(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Fecha Primera Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primera Cuota * (editable)
              </label>
              <input
                type="date"
                value={fechaPrimeraCuota}
                onChange={(e) => setFechaPrimeraCuota(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Preview de Cálculos */}
          {preview && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-3">
                Resumen del Crédito
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Monto Original</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatMonto(parseFloat(monto))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Interés</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatMonto(preview.interesTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Total a Pagar</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatMonto(preview.totalAPagar)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Valor Cuota</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatMonto(preview.valorCuota)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón Ver Tabla de Cuotas */}
          {preview && tablaCuotas.length > 0 && (
            <button
              onClick={() => setMostrarTabla(!mostrarTabla)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              {mostrarTabla ? '▼ Ocultar' : '▶'} Ver Tabla de Cuotas ({tablaCuotas.length})
            </button>
          )}

          {/* Tabla de Cuotas */}
          {mostrarTabla && tablaCuotas.length > 0 && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        #
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaCuotas.map((cuota) => (
                      <tr key={cuota.numero} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-gray-900">{cuota.numero}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {formatFecha(cuota.fecha)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {formatMonto(cuota.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer: Botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || !preview}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              'Confirmar Crédito'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
