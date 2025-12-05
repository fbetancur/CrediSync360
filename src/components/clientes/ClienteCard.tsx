/**
 * CrediSync360 V2 - ClienteCard Component (Lista)
 * 
 * Tarjeta de cliente para la lista de clientes.
 * Muestra información resumida y estado del cliente.
 * 
 * Validates: Requirements 3.3, 3.4, 3.5
 */

export interface ClienteCardProps {
  cliente: {
    id: string;
    nombre: string;
    documento: string;
    telefono: string;
    estado: 'MORA' | 'AL_DIA' | 'SIN_CREDITOS';
    saldoTotal: number;
    creditosActivos: number;
    diasAtrasoMax: number;
  };
  onClick: () => void;
}

export function ClienteCard({ cliente, onClick }: ClienteCardProps) {
  // Formatear montos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  // Determinar color según estado
  const getEstadoColor = () => {
    switch (cliente.estado) {
      case 'MORA':
        return 'bg-red-50 border-red-200';
      case 'AL_DIA':
        return 'bg-green-50 border-green-200';
      case 'SIN_CREDITOS':
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getEstadoBadgeColor = () => {
    switch (cliente.estado) {
      case 'MORA':
        return 'bg-red-100 text-red-700';
      case 'AL_DIA':
        return 'bg-green-100 text-green-700';
      case 'SIN_CREDITOS':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEstadoTexto = () => {
    switch (cliente.estado) {
      case 'MORA':
        return 'MORA';
      case 'AL_DIA':
        return 'AL DÍA';
      case 'SIN_CREDITOS':
        return 'SIN CRÉDITOS';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${getEstadoColor()} border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      {/* Header: Nombre y Estado */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {cliente.nombre}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📄 {cliente.documento}</span>
            <span>•</span>
            <span>📞 {cliente.telefono}</span>
          </div>
        </div>

        {/* Badge de Estado */}
        <span
          className={`${getEstadoBadgeColor()} px-3 py-1 rounded-full text-xs font-bold`}
        >
          {getEstadoTexto()}
        </span>
      </div>

      {/* Información Financiera */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
        {/* Saldo Pendiente */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Saldo Pendiente</p>
          <p className="text-lg font-bold text-gray-900">
            {formatMonto(cliente.saldoTotal)}
          </p>
        </div>

        {/* Créditos Activos */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Créditos Activos</p>
          <p className="text-lg font-bold text-gray-900">
            {cliente.creditosActivos}
          </p>
        </div>
      </div>

      {/* Días de Atraso (solo si está en mora) */}
      {cliente.estado === 'MORA' && cliente.diasAtrasoMax > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ {cliente.diasAtrasoMax} {cliente.diasAtrasoMax === 1 ? 'día' : 'días'} de atraso
          </p>
        </div>
      )}
    </div>
  );
}
