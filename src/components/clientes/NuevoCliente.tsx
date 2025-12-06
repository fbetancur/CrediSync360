/**
 * CrediSync360 V2 - NuevoCliente Component
 * 
 * Formulario para crear un nuevo cliente.
 * Captura información personal y ubicación GPS.
 * 
 * Validates: Requirements 3.6, 3.7, 3.8
 */

import { useState } from 'react';
import { db } from '../../lib/db';
import { addToSyncQueue } from '../../lib/sync';
import type { Cliente } from '../../types';

interface NuevoClienteProps {
  onClose: () => void;
  onSuccess: (clienteId: string) => void;
}

export function NuevoCliente({ onClose, onSuccess }: NuevoClienteProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturandoUbicacion, setCapturandoUbicacion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    barrio: '',
    referencia: '',
    latitud: undefined as number | undefined,
    longitud: undefined as number | undefined,
  });

  // Validar formulario
  const validarFormulario = (): string | null => {
    if (!formData.nombre.trim()) {
      return 'El nombre es requerido';
    }
    if (!formData.documento.trim()) {
      return 'El documento es requerido';
    }
    if (!formData.telefono.trim()) {
      return 'El teléfono es requerido';
    }
    if (!formData.direccion.trim()) {
      return 'La dirección es requerida';
    }
    if (!formData.barrio.trim()) {
      return 'El barrio es requerido';
    }
    if (!formData.referencia.trim()) {
      return 'La referencia es requerida';
    }

    // Validar formato de teléfono (10 dígitos)
    if (!/^\d{10}$/.test(formData.telefono.replace(/\s/g, ''))) {
      return 'El teléfono debe tener 10 dígitos';
    }

    return null;
  };

  // Capturar ubicación GPS
  const capturarUbicacion = async () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setCapturandoUbicacion(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        }
      );

      setFormData({
        ...formData,
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
      });

      console.log('✅ Ubicación capturada:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (err) {
      console.error('[NuevoCliente] Error capturando ubicación:', err);
      setError('No se pudo obtener la ubicación. Puedes continuar sin ella.');
    } finally {
      setCapturandoUbicacion(false);
    }
  };

  // Guardar cliente
  const handleGuardar = async () => {
    // Validar formulario
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generar ID único
      const clienteId = `cliente-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Crear objeto cliente con campos calculados inicializados
      const cliente: Cliente = {
        id: clienteId,
        tenantId: 'tenant-1', // TODO: Obtener del contexto de autenticación
        nombre: formData.nombre.trim(),
        documento: formData.documento.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        barrio: formData.barrio.trim(),
        referencia: formData.referencia.trim(),
        latitud: formData.latitud,
        longitud: formData.longitud,
        // Campos calculados (inicializados para cliente nuevo sin créditos)
        creditosActivos: 0,
        saldoTotal: 0,
        diasAtrasoMax: 0,
        estado: 'SIN_CREDITOS',
        score: 'REGULAR',
        ultimaActualizacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user-1', // TODO: Obtener del contexto de autenticación
      };

      // Guardar en Dexie
      await db.clientes.add(cliente);

      console.log('✅ Cliente creado:', cliente);

      // Agregar a sync queue
      await addToSyncQueue('CREATE_CLIENTE', cliente);

      // Notificar éxito
      onSuccess(clienteId);
      onClose();
    } catch (err) {
      const errorObj = err as Error;
      console.error('[NuevoCliente] Error al crear cliente:', errorObj);
      setError(errorObj.message || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg sticky top-0">
          <h2 className="text-xl font-bold">Nuevo Cliente</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez García"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documento de Identidad *
            </label>
            <input
              type="text"
              value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              placeholder="Ej: 1234567890"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej: 3001234567"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">10 dígitos</p>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Ej: Calle 123 #45-67"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Barrio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barrio *
            </label>
            <input
              type="text"
              value={formData.barrio}
              onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
              placeholder="Ej: Centro"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia *
            </label>
            <input
              type="text"
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Ej: Frente al parque principal"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Ubicación GPS */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-blue-900">
                Ubicación GPS (opcional)
              </label>
              {formData.latitud && formData.longitud && (
                <span className="text-xs text-green-600 font-medium">✓ Capturada</span>
              )}
            </div>

            {formData.latitud && formData.longitud ? (
              <div className="text-xs text-blue-700 mb-2">
                📍 Lat: {formData.latitud.toFixed(6)}, Lng: {formData.longitud.toFixed(6)}
              </div>
            ) : (
              <p className="text-xs text-blue-700 mb-2">
                Captura la ubicación para facilitar la navegación
              </p>
            )}

            <button
              onClick={capturarUbicacion}
              disabled={loading || capturandoUbicacion}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {capturandoUbicacion ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Capturando...
                </>
              ) : (
                <>
                  📍 {formData.latitud ? 'Actualizar' : 'Capturar'} Ubicación
                </>
              )}
            </button>
          </div>

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
            onClick={handleGuardar}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cliente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
