/**
 * CrediSync360 V2 - ClienteDetail Component
 * 
 * Pantalla de detalle de un cliente.
 * Muestra información completa, historial de créditos y score.
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.9, 4.10
 */

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { calcularEstadoCliente, calcularEstadoCredito } from '../../lib/calculos';
import { OtorgarCredito } from '../creditos/OtorgarCredito';

interface ClienteDetailProps {
  clienteId: string;
  onClose: () => void;
}

export function ClienteDetail({ clienteId, onClose }: ClienteDetailProps) {
  const [mostrarOtorgarCredito, setMostrarOtorgarCredito] = useState(false);
  // Cargar cliente
  const cliente = useLiveQuery(
    () => db.clientes.get(clienteId),
    [clienteId]
  );

  // Cargar créditos del cliente
  const creditos = useLiveQuery(
    () => db.creditos.where('clienteId').equals(clienteId).toArray(),
    [clienteId]
  );

  // Cargar cuotas del cliente
  const cuotas = useLiveQuery(
    () => db.cuotas.where('clienteId').equals(clienteId).toArray(),
    [clienteId]
  );

  // Cargar pagos del cliente
  const pagos = useLiveQuery(
    () => db.pagos.where('clienteId').equals(clienteId).toArray(),
    [clienteId]
  );

  // Calcular estado del cliente
  const estadoCliente = useMemo(() => {
    if (!cliente || !creditos || !cuotas || !pagos) return null;
    return calcularEstadoCliente(cliente, creditos, cuotas, pagos);
  }, [cliente, creditos, cuotas, pagos]);

  // Calcular estado de cada crédito
  const creditosConEstado = useMemo(() => {
    if (!creditos || !cuotas || !pagos) return [];

    return creditos.map((credito) => {
      const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
      const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
      const estado = calcularEstadoCredito(credito, cuotasCredito, pagosCredito);

      return {
        ...credito,
        ...estado,
      };
    });
  }, [creditos, cuotas, pagos]);

  // Formatear montos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (!cliente || !estadoCliente) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  // Determinar color del score
  const getScoreColor = () => {
    switch (estadoCliente.score) {
      case 'CONFIABLE':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'REGULAR':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'RIESGOSO':
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  // Determinar color del estado
  const getEstadoColor = () => {
    switch (estadoCliente.estado) {
      case 'MORA':
        return 'text-red-600';
      case 'AL_DIA':
        return 'text-green-600';
      case 'SIN_CREDITOS':
        return 'text-gray-600';
    }
  };

  const getEstadoTexto = () => {
    switch (estadoCliente.estado) {
      case 'MORA':
        return 'EN MORA';
      case 'AL_DIA':
        return 'AL DÍA';
      case 'SIN_CREDITOS':
        return 'SIN CRÉDITOS';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Volver
          </button>

          <button
            onClick={() => setMostrarOtorgarCredito(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Otorgar Crédito
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{cliente.nombre}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>📄 {cliente.documento}</span>
          <span>📞 {cliente.telefono}</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Información Personal</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <p className="text-sm font-medium text-gray-900">{cliente.direccion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Barrio</p>
              <p className="text-sm font-medium text-gray-900">{cliente.barrio}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">Referencia</p>
              <p className="text-sm font-medium text-gray-900">{cliente.referencia}</p>
            </div>
          </div>
        </div>

        {/* Estado Financiero */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Estado Financiero</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Créditos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{estadoCliente.creditosActivos}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMonto(estadoCliente.saldoTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <p className={`text-lg font-bold ${getEstadoColor()}`}>
                {getEstadoTexto()}
              </p>
              {estadoCliente.diasAtrasoMax > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {estadoCliente.diasAtrasoMax} {estadoCliente.diasAtrasoMax === 1 ? 'día' : 'días'} de atraso
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Score</p>
              <span className={`${getScoreColor()} px-4 py-2 rounded-full text-sm font-bold border-2`}>
                {estadoCliente.score}
              </span>
            </div>
          </div>
        </div>

        {/* Créditos Activos */}
        {creditosConEstado.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Créditos Activos ({creditosConEstado.filter((c) => c.estado === 'ACTIVO').length})
            </h2>
            
            <div className="space-y-3">
              {creditosConEstado
                .filter((c) => c.estado === 'ACTIVO')
                .map((credito) => (
                  <div
                    key={credito.id}
                    className={`border-2 rounded-lg p-4 ${
                      credito.estadoCalculado === 'MORA'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">
                          {formatMonto(credito.montoOriginal)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {credito.frecuencia} • {credito.numeroCuotas} cuotas
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          credito.estadoCalculado === 'MORA'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {credito.estadoCalculado === 'MORA' ? 'MORA' : 'AL DÍA'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Saldo</p>
                        <p className="font-semibold text-gray-900">
                          {formatMonto(credito.saldoPendiente)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pagadas</p>
                        <p className="font-semibold text-gray-900">
                          {credito.cuotasPagadas}/{credito.numeroCuotas}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Desembolso</p>
                        <p className="font-semibold text-gray-900">
                          {formatFecha(credito.fechaDesembolso)}
                        </p>
                      </div>
                    </div>

                    {credito.diasAtraso > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ {credito.diasAtraso} {credito.diasAtraso === 1 ? 'día' : 'días'} de atraso
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Historial de Créditos */}
        {creditosConEstado.filter((c) => c.estado !== 'ACTIVO').length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Historial de Créditos ({creditosConEstado.filter((c) => c.estado !== 'ACTIVO').length})
            </h2>
            
            <div className="space-y-2">
              {creditosConEstado
                .filter((c) => c.estado !== 'ACTIVO')
                .map((credito) => (
                  <div
                    key={credito.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatMonto(credito.montoOriginal)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatFecha(credito.fechaDesembolso)} • {credito.estado}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {credito.cuotasPagadas}/{credito.numeroCuotas} cuotas
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Otorgar Crédito */}
      {mostrarOtorgarCredito && (
        <OtorgarCredito
          clienteId={clienteId}
          clienteNombre={cliente.nombre}
          onClose={() => setMostrarOtorgarCredito(false)}
          onSuccess={() => {
            setMostrarOtorgarCredito(false);
            console.log('✅ Crédito otorgado exitosamente');
          }}
        />
      )}
    </div>
  );
}
