/**
 * CrediSync360 V2 - ClienteCard Component
 * 
 * Tarjeta de cliente para la ruta del día.
 * Muestra información del cliente y sus cuotas pendientes.
 * 
 * Validates: Requirements 1.10
 */

import type { ClienteRuta } from '../../types';

interface ClienteCardProps {
  clienteRuta: ClienteRuta;
  onClick: () => void;
}

export function ClienteCard({ clienteRuta, onClick }: ClienteCardProps) {
  const { cliente, cuotas, totalPendiente, diasAtrasoMax } = clienteRuta;

  // Determinar estado visual
  const esMora = diasAtrasoMax > 0;
  const estadoColor = esMora ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300';
  const estadoBadge = esMora ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  const estadoTexto = esMora ? 'MORA' : 'AL DÍA';

  // Formatear monto
  const montoFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(totalPendiente);

  return (
    <div
      onClick={onClick}
      className={`
        ${estadoColor}
        border-2 rounded-lg p-4 cursor-pointer
        hover:shadow-md transition-shadow
        active:scale-98 transition-transform
      `}
    >
      {/* Header: Nombre y Estado */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">
          {cliente.nombre}
        </h3>
        <span className={`${estadoBadge} px-2 py-1 rounded text-xs font-medium`}>
          {estadoTexto}
        </span>
      </div>

      {/* Información de Cuotas */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">
          {cuotas.length} {cuotas.length === 1 ? 'cuota' : 'cuotas'}
        </span>
        {esMora && (
          <span className="text-sm text-red-600 font-medium">
            • {diasAtrasoMax} {diasAtrasoMax === 1 ? 'día' : 'días'} de atraso
          </span>
        )}
      </div>

      {/* Monto a Cobrar */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {montoFormateado}
        </span>
      </div>

      {/* Dirección */}
      <div className="text-sm text-gray-600">
        <p className="truncate">
          📍 {cliente.direccion}
          {cliente.barrio && ` - ${cliente.barrio}`}
        </p>
      </div>

      {/* Referencia (si existe) */}
      {cliente.referencia && (
        <div className="text-xs text-gray-500 mt-1">
          Ref: {cliente.referencia}
        </div>
      )}
    </div>
  );
}
