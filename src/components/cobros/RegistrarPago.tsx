/**
 * CrediSync360 V2 - RegistrarPago Component
 * 
 * Modal para registrar pagos de clientes.
 * Muestra información del cliente, crédito y permite registrar el pago.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.11, 2.12
 */

import { useState, useEffect } from 'react';
import { useCobro, calcularDistribucionPago } from '../../hooks/useCobro';
import type { ClienteRuta } from '../../types';

interface RegistrarPagoProps {
  clienteRuta: ClienteRuta;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrarPago({ clienteRuta, onClose, onSuccess }: RegistrarPagoProps) {
  const { cliente, credito, cuotas, totalPendiente } = clienteRuta;
  const { registrarPago, loading } = useCobro();

  // Estado del formulario
  const [monto, setMonto] = useState(totalPendiente.toString());
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pre-llenar el monto con el total pendiente (Requirements 2.3)
  useEffect(() => {
    setMonto(totalPendiente.toString());
  }, [totalPendiente]);

  // Formatear montos
  const formatMonto = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Manejar cambio de monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Permitir solo números y punto decimal
    if (/^\d*\.?\d*$/.test(valor) || valor === '') {
      setMonto(valor);
      setError(null);
    }
  };

  // Validar y registrar pago
  const handleConfirmar = async () => {
    const montoNumerico = parseFloat(monto);

    // Validar que el monto sea mayor a 0 (Requirements 2.4)
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    // Validar que las observaciones no excedan 500 caracteres (Requirements 2.11)
    if (observaciones.length > 500) {
      setError('Las observaciones no pueden exceder 500 caracteres');
      return;
    }

    try {
      // Calcular distribución del pago
      const distribucion = calcularDistribucionPago(montoNumerico, cuotas, []);

      // Registrar un pago por cada cuota en la distribución
      for (const dist of distribucion) {
        await registrarPago({
          tenantId: cliente.tenantId,
          creditoId: credito.id,
          cuotaId: dist.cuotaId,
          clienteId: cliente.id,
          cobradorId: credito.cobradorId,
          monto: dist.montoPagar,
          fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          observaciones: observaciones || undefined,
          createdBy: credito.cobradorId,
        });
      }

      // Cerrar modal y notificar éxito (Requirements 2.12)
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Registrar Pago</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Información del Cliente (Requirements 2.2) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{cliente.nombre}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📄 {cliente.documento}</p>
              <p>📞 {cliente.telefono}</p>
              <p>📍 {cliente.direccion}</p>
            </div>
          </div>

          {/* Información del Crédito (Requirements 2.2) */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-600 font-medium">Crédito</span>
              <span className="text-xs text-blue-500">{credito.frecuencia}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cuotas pendientes:</span>
                <span className="text-sm font-semibold">{cuotas.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Saldo pendiente:</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatMonto(totalPendiente)}
                </span>
              </div>
            </div>
          </div>

          {/* Input de Monto (Requirements 2.3, 2.4) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a Pagar *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                value={monto}
                onChange={handleMontoChange}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                placeholder="0"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Saldo pendiente: {formatMonto(totalPendiente)}
            </p>
          </div>

          {/* Observaciones (Requirements 2.11) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Agregar notas sobre el pago..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {observaciones.length}/500 caracteres
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Ubicación GPS Info (Requirements 2.5) */}
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-xs text-green-700">
              📍 La ubicación GPS se capturará automáticamente al confirmar el pago
            </p>
          </div>
        </div>

        {/* Footer: Botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              'Confirmar Pago'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
