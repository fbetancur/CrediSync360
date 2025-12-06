/**
 * Componente de Balance/Caja
 * 
 * Muestra el estado de la caja del cobrador con:
 * - Caja base
 * - Cobrado vs Créditos otorgados
 * - Entradas/Inversiones
 * - Gastos/Salidas
 * - Total de caja calculado
 * - Botón para cerrar caja
 */

import { useState } from 'react';
import { useBalance } from '../../hooks/useBalance';

export function Balance() {
  const {
    estadoCaja,
    movimientos,
    loading,
    agregarMovimiento,
    eliminarMovimiento,
    cerrarCaja,
    reabrirCaja,
  } = useBalance();

  const [showAgregarEntrada, setShowAgregarEntrada] = useState(false);
  const [showAgregarGasto, setShowAgregarGasto] = useState(false);
  const [detalleEntrada, setDetalleEntrada] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
  const [detalleGasto, setDetalleGasto] = useState('');
  const [valorGasto, setValorGasto] = useState('');

  const handleAgregarEntrada = async () => {
    if (!detalleEntrada || !valorEntrada) return;

    try {
      await agregarMovimiento('ENTRADA', detalleEntrada, parseFloat(valorEntrada));
      setDetalleEntrada('');
      setValorEntrada('');
      setShowAgregarEntrada(false);
    } catch (err) {
      alert('Error al agregar entrada');
    }
  };

  const handleAgregarGasto = async () => {
    if (!detalleGasto || !valorGasto) return;

    try {
      await agregarMovimiento('GASTO', detalleGasto, parseFloat(valorGasto));
      setDetalleGasto('');
      setValorGasto('');
      setShowAgregarGasto(false);
    } catch (err) {
      alert('Error al agregar gasto');
    }
  };

  const handleCerrarCaja = async () => {
    if (!confirm('¿Estás seguro de cerrar la caja del día?')) return;

    try {
      await cerrarCaja();
      alert('Caja cerrada exitosamente');
    } catch (err) {
      alert('Error al cerrar caja');
    }
  };

  const handleEliminarMovimiento = async (movimientoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;

    try {
      await eliminarMovimiento(movimientoId);
    } catch (err) {
      alert('Error al eliminar movimiento');
    }
  };

  const handleReabrirCaja = async () => {
    if (
      !confirm(
        '¿Estás seguro de reabrir la caja? Esto permitirá agregar más movimientos.'
      )
    )
      return;

    try {
      await reabrirCaja();
      alert('Caja reabierta exitosamente');
    } catch (err) {
      alert('Error al reabrir caja');
    }
  };

  // Loading state
  if (!estadoCaja) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando balance...</p>
        </div>
      </div>
    );
  }

  const entradas = movimientos.filter((m) => m.tipo === 'ENTRADA');
  const gastos = movimientos.filter((m) => m.tipo === 'GASTO');

  return (
    <div className="w-full max-w-full bg-gray-50 p-3 pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold text-gray-900">BALANCE</h1>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Recargar</span>
          </button>
        </div>
      </div>

      {/* Estado de Caja */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div
          className={`p-3 rounded-lg text-center font-bold text-base ${
            estadoCaja.estado === 'ABIERTA'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          🔓 CAJA {estadoCaja.estado}
        </div>
      </div>

      {/* Caja Base */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-700 mb-2">Caja Base</h2>
          <p className="text-2xl font-bold text-gray-900">
            ${estadoCaja.cajaBase.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Cobrado vs Créditos */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-gray-200">
              <h3 className="text-xs font-medium text-gray-600 mb-1">Cobrado</h3>
              <p className="text-xl font-bold text-green-600 break-words">
                ${estadoCaja.totalCobrado.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-600 mb-1">Créditos</h3>
              <p className="text-xl font-bold text-red-600 break-words">
                ${estadoCaja.totalCreditosOtorgados.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entradas/Inversión */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Entradas / Inversión
          </h2>

          {/* Tabla de Entradas */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-700">
                    Detalle
                  </th>
                  <th className="px-2 py-2 text-right text-sm font-semibold text-gray-700">
                    Valor
                  </th>
                  {estadoCaja.estado === 'ABIERTA' && (
                    <th className="px-2 py-2 text-center text-sm font-semibold text-gray-700 w-16">
                      
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={estadoCaja.estado === 'ABIERTA' ? 3 : 2}
                      className="px-2 py-3 text-center text-gray-500"
                    >
                      -
                    </td>
                  </tr>
                ) : (
                  entradas.map((entrada) => (
                    <tr key={entrada.id} className="border-t border-gray-200">
                      <td className="px-2 py-2 text-gray-900 text-sm">
                        {entrada.detalle}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900 text-sm whitespace-nowrap">
                        ${entrada.valor.toLocaleString('es-CO')}
                      </td>
                      {estadoCaja.estado === 'ABIERTA' && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleEliminarMovimiento(entrada.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
                <tr className="bg-blue-100 font-semibold">
                  <td className="px-2 py-2 text-sm">Tot.Ingr.(Σ)</td>
                  <td
                    className="px-2 py-2 text-right text-sm whitespace-nowrap"
                    colSpan={estadoCaja.estado === 'ABIERTA' ? 2 : 1}
                  >
                    ${estadoCaja.totalEntradas.toLocaleString('es-CO')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formulario Agregar Entrada */}
          {showAgregarEntrada ? (
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={detalleEntrada}
                onChange={(e) => setDetalleEntrada(e.target.value)}
                placeholder="Detalle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={valorEntrada}
                onChange={(e) => setValorEntrada(e.target.value)}
                placeholder="Valor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAgregarEntrada}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowAgregarEntrada(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAgregarEntrada(true)}
              disabled={estadoCaja.estado === 'CERRADA'}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>➕</span>
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Gastos/Salidas */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Gastos / Salidas
          </h2>

          {/* Tabla de Gastos */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-700">
                    Detalle
                  </th>
                  <th className="px-2 py-2 text-right text-sm font-semibold text-gray-700">
                    Valor
                  </th>
                  {estadoCaja.estado === 'ABIERTA' && (
                    <th className="px-2 py-2 text-center text-sm font-semibold text-gray-700 w-16">
                      
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {gastos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={estadoCaja.estado === 'ABIERTA' ? 3 : 2}
                      className="px-2 py-3 text-center text-gray-500"
                    >
                      -
                    </td>
                  </tr>
                ) : (
                  gastos.map((gasto) => (
                    <tr key={gasto.id} className="border-t border-gray-200">
                      <td className="px-2 py-2 text-gray-900 text-sm">
                        {gasto.detalle}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-900 text-sm whitespace-nowrap">
                        ${gasto.valor.toLocaleString('es-CO')}
                      </td>
                      {estadoCaja.estado === 'ABIERTA' && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleEliminarMovimiento(gasto.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
                <tr className="bg-blue-100 font-semibold">
                  <td className="px-2 py-2 text-sm">Tot.Egr.(Σ)</td>
                  <td
                    className="px-2 py-2 text-right text-sm whitespace-nowrap"
                    colSpan={estadoCaja.estado === 'ABIERTA' ? 2 : 1}
                  >
                    ${estadoCaja.totalGastos.toLocaleString('es-CO')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formulario Agregar Gasto */}
          {showAgregarGasto ? (
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={detalleGasto}
                onChange={(e) => setDetalleGasto(e.target.value)}
                placeholder="Detalle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                placeholder="Valor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAgregarGasto}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowAgregarGasto(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAgregarGasto(true)}
              disabled={estadoCaja.estado === 'CERRADA'}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>➕</span>
              Agregar gasto
            </button>
          )}
        </div>
      </div>

      {/* Total Caja */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Total caja</h2>
          <div
            className={`p-4 rounded-lg text-center ${
              estadoCaja.totalCaja >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p
              className={`text-3xl font-bold break-words ${
                estadoCaja.totalCaja >= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              ${estadoCaja.totalCaja.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Botones Cerrar/Reabrir Caja */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        {estadoCaja.estado === 'ABIERTA' ? (
          <button
            onClick={handleCerrarCaja}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-bold text-base hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span>🔒</span>
            Cerrar Caja
          </button>
        ) : (
          <button
            onClick={handleReabrirCaja}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold text-base hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span>🔓</span>
            Reabrir Caja
          </button>
        )}
      </div>

      {/* Cálculo Detallado */}
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>📊</span>
            Cálculo:
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Caja Base:</span>
              <span className="font-medium">
                ${estadoCaja.cajaBase.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>+ Cobrado:</span>
              <span className="font-medium">
                ${estadoCaja.totalCobrado.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>- Créditos:</span>
              <span className="font-medium">
                ${estadoCaja.totalCreditosOtorgados.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>+ Entradas:</span>
              <span className="font-medium">
                ${estadoCaja.totalEntradas.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>- Gastos:</span>
              <span className="font-medium">
                ${estadoCaja.totalGastos.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="border-t-2 border-gray-300 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>= Total:</span>
                <span
                  className={
                    estadoCaja.totalCaja >= 0 ? 'text-green-700' : 'text-red-700'
                  }
                >
                  ${estadoCaja.totalCaja.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
