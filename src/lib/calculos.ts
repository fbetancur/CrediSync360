/**
 * CrediSync360 V2 - Funciones Puras de Cálculo
 * 
 * Todas las funciones son puras (sin side effects) para facilitar testing.
 * Los valores calculados nunca se guardan en la base de datos.
 */

import { addDays, isSunday, differenceInDays, parseISO, format } from 'date-fns';
import type {
  Cuota,
  Pago,
  Credito,
  Cliente,
  EstadoCuotaCalculado,
  EstadoCreditoCalculado,
  EstadoClienteCalculado,
  DistribucionPago,
  Frecuencia,
  Score,
} from '../types';

// ============================================================================
// Cálculos de Cuotas
// ============================================================================

/**
 * Calcular el estado de una cuota específica
 * 
 * @param cuota - La cuota a evaluar
 * @param pagos - Todos los pagos relacionados con esta cuota
 * @returns Estado calculado de la cuota
 * 
 * Validates: Requirements 2.2, 2.9, 2.10
 */
export function calcularEstadoCuota(
  cuota: Cuota,
  pagos: Pago[]
): EstadoCuotaCalculado {
  // Filtrar pagos de esta cuota
  const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);

  // Sumar monto pagado
  const montoPagado = pagosCuota.reduce((sum, p) => sum + p.monto, 0);

  // Calcular saldo pendiente
  const saldoPendiente = Math.max(0, cuota.montoProgramado - montoPagado);

  // Determinar estado
  let estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  if (montoPagado === 0) {
    estado = 'PENDIENTE';
  } else if (montoPagado < cuota.montoProgramado) {
    estado = 'PARCIAL';
  } else {
    estado = 'PAGADA';
  }

  // Calcular días de atraso
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaCuota = parseISO(cuota.fechaProgramada);
  fechaCuota.setHours(0, 0, 0, 0);

  let diasAtraso = 0;
  if (estado !== 'PAGADA' && hoy > fechaCuota) {
    diasAtraso = differenceInDays(hoy, fechaCuota);
  }

  return {
    montoPagado,
    saldoPendiente,
    estado,
    diasAtraso,
  };
}

// ============================================================================
// Cálculos de Créditos
// ============================================================================

/**
 * Calcular saldo pendiente de un crédito
 * 
 * @param cuotas - Todas las cuotas del crédito
 * @param pagos - Todos los pagos del crédito
 * @returns Saldo pendiente total
 * 
 * Property 7: Balance Calculation Consistency
 * Validates: Requirements 2.2, 4.9
 */
export function calcularSaldoPendiente(cuotas: Cuota[], pagos: Pago[]): number {
  const totalCuotas = cuotas.reduce((sum, c) => sum + c.montoProgramado, 0);
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
  return Math.max(0, totalCuotas - totalPagos);
}

/**
 * Calcular días de atraso de un crédito
 * 
 * @param cuotas - Todas las cuotas del crédito
 * @param pagos - Todos los pagos del crédito
 * @returns Días de atraso (0 si está al día)
 * 
 * Property 8: Days Overdue Monotonicity
 * Validates: Requirements 1.6, 4.9
 */
export function calcularDiasAtraso(cuotas: Cuota[], pagos: Pago[]): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Encontrar cuotas pendientes
  const cuotasPendientes = cuotas.filter((cuota) => {
    const estado = calcularEstadoCuota(cuota, pagos);
    return estado.estado !== 'PAGADA';
  });

  if (cuotasPendientes.length === 0) return 0;

  // Ordenar por fecha
  cuotasPendientes.sort(
    (a, b) =>
      parseISO(a.fechaProgramada).getTime() -
      parseISO(b.fechaProgramada).getTime()
  );

  const cuotaMasAntigua = cuotasPendientes[0];
  const fechaCuota = parseISO(cuotaMasAntigua.fechaProgramada);
  fechaCuota.setHours(0, 0, 0, 0);

  if (hoy > fechaCuota) {
    return differenceInDays(hoy, fechaCuota);
  }

  return 0;
}

/**
 * Calcular estado completo de un crédito
 * 
 * @param credito - El crédito a evaluar
 * @param cuotas - Todas las cuotas del crédito
 * @param pagos - Todos los pagos del crédito
 * @returns Estado calculado del crédito
 * 
 * Validates: Requirements 4.9
 */
export function calcularEstadoCredito(
  credito: Credito,
  cuotas: Cuota[],
  pagos: Pago[]
): EstadoCreditoCalculado {
  // Calcular saldo pendiente
  const saldoPendiente = calcularSaldoPendiente(cuotas, pagos);

  // Contar cuotas pagadas
  let cuotasPagadas = 0;
  let diasAtrasoMax = 0;

  for (const cuota of cuotas) {
    const estado = calcularEstadoCuota(cuota, pagos);
    if (estado.estado === 'PAGADA') {
      cuotasPagadas++;
    }
    diasAtrasoMax = Math.max(diasAtrasoMax, estado.diasAtraso);
  }

  const cuotasPendientes = credito.numeroCuotas - cuotasPagadas;

  // Determinar estado
  let estadoCalculado: 'AL_DIA' | 'MORA' | 'CANCELADO';
  if (saldoPendiente === 0) {
    estadoCalculado = 'CANCELADO';
  } else if (diasAtrasoMax > 0) {
    estadoCalculado = 'MORA';
  } else {
    estadoCalculado = 'AL_DIA';
  }

  return {
    saldoPendiente,
    cuotasPagadas,
    cuotasPendientes,
    diasAtraso: diasAtrasoMax,
    estadoCalculado,
  };
}

// ============================================================================
// Distribución de Pagos
// ============================================================================

/**
 * Distribuir un pago entre múltiples cuotas
 * 
 * El pago se distribuye en orden cronológico, pagando primero las cuotas
 * más antiguas. Si el pago no alcanza para cubrir una cuota completa,
 * se hace un pago parcial.
 * 
 * @param monto - Monto total del pago
 * @param cuotas - Cuotas a las que se puede aplicar el pago
 * @param pagos - Pagos existentes para calcular saldos
 * @returns Array con la distribución del pago
 * 
 * Property 5: Payment Distribution Correctness
 * Validates: Requirements 2.9, 2.10
 */
export function distribuirPago(
  monto: number,
  cuotas: Cuota[],
  pagos: Pago[]
): DistribucionPago[] {
  const distribucion: DistribucionPago[] = [];
  let montoRestante = monto;

  // Ordenar cuotas por número (cronológico)
  const cuotasOrdenadas = [...cuotas].sort((a, b) => a.numero - b.numero);

  for (const cuota of cuotasOrdenadas) {
    if (montoRestante <= 0) break;

    // Calcular cuánto falta por pagar de esta cuota
    const estado = calcularEstadoCuota(cuota, pagos);
    const saldoCuota = estado.saldoPendiente;

    if (saldoCuota <= 0) continue;

    if (montoRestante >= saldoCuota) {
      // Pagar cuota completa
      distribucion.push({
        cuotaId: cuota.id,
        montoPagar: saldoCuota,
      });
      montoRestante -= saldoCuota;
    } else {
      // Pago parcial
      distribucion.push({
        cuotaId: cuota.id,
        montoPagar: montoRestante,
      });
      montoRestante = 0;
    }
  }

  return distribucion;
}

// ============================================================================
// Generación de Fechas de Cuotas
// ============================================================================

/**
 * Generar fechas de cuotas para un crédito
 * 
 * @param fechaPrimeraCuota - Fecha de la primera cuota (editable)
 * @param numeroCuotas - Número total de cuotas
 * @param frecuencia - Frecuencia de pago
 * @param excluirDomingos - Si true, mueve domingos a lunes
 * @returns Array de fechas en formato YYYY-MM-DD
 * 
 * Property 11: Installment Date Generation Correctness
 * Validates: Requirements 5.8, 5.11
 */
export function generarFechasCuotas(
  fechaPrimeraCuota: Date,
  numeroCuotas: number,
  frecuencia: Frecuencia,
  excluirDomingos: boolean = true
): string[] {
  const fechas: string[] = [];
  let fecha = new Date(fechaPrimeraCuota);

  for (let i = 0; i < numeroCuotas; i++) {
    // Agregar fecha actual
    fechas.push(format(fecha, 'yyyy-MM-dd'));

    // Calcular siguiente fecha (si no es la última cuota)
    if (i < numeroCuotas - 1) {
      switch (frecuencia) {
        case 'DIARIO':
          fecha = addDays(fecha, 1);
          // Excluir domingos
          if (excluirDomingos) {
            while (isSunday(fecha)) {
              fecha = addDays(fecha, 1);
            }
          }
          break;
        case 'SEMANAL':
          fecha = addDays(fecha, 7);
          break;
        case 'QUINCENAL':
          fecha = addDays(fecha, 15);
          break;
        case 'MENSUAL':
          fecha = addDays(fecha, 30);
          break;
      }
    }
  }

  return fechas;
}

// ============================================================================
// Cálculos de Cliente
// ============================================================================

/**
 * Calcular score de un cliente basado en su historial
 * 
 * @param creditos - Todos los créditos del cliente
 * @param cuotas - Todas las cuotas de los créditos
 * @param pagos - Todos los pagos del cliente
 * @returns Score del cliente
 * 
 * Property 10: Client Score Determinism
 * Validates: Requirements 4.5, 4.6, 4.7, 4.8
 */
export function calcularScore(
  creditos: Credito[],
  cuotas: Cuota[],
  pagos: Pago[]
): Score {
  const creditosCancelados = creditos.filter((c) => c.estado === 'CANCELADO');

  // Contar créditos pagados sin mora
  let creditosSinMora = 0;
  let creditosConMora = 0;

  for (const credito of creditosCancelados) {
    const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
    const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
    const diasAtraso = calcularDiasAtraso(cuotasCredito, pagosCredito);

    if (diasAtraso === 0) {
      creditosSinMora++;
    } else {
      creditosConMora++;
    }
  }

  // Determinar score
  if (creditosSinMora >= 3 && creditosConMora === 0) {
    return 'CONFIABLE';
  } else if (creditosConMora > creditosSinMora) {
    return 'RIESGOSO';
  } else {
    return 'REGULAR';
  }
}

/**
 * Calcular estado completo de un cliente
 * 
 * @param cliente - El cliente a evaluar
 * @param creditos - Todos los créditos del cliente
 * @param cuotas - Todas las cuotas de los créditos
 * @param pagos - Todos los pagos del cliente
 * @returns Estado calculado del cliente
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */
export function calcularEstadoCliente(
  cliente: Cliente,
  creditos: Credito[],
  cuotas: Cuota[],
  pagos: Pago[]
): EstadoClienteCalculado {
  const creditosActivos = creditos.filter((c) => c.estado === 'ACTIVO');

  if (creditosActivos.length === 0) {
    return {
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: calcularScore(cliente, creditos, cuotas, pagos),
    };
  }

  let saldoTotal = 0;
  let diasAtrasoMax = 0;

  for (const credito of creditosActivos) {
    const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
    const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
    const estado = calcularEstadoCredito(credito, cuotasCredito, pagosCredito);

    saldoTotal += estado.saldoPendiente;
    diasAtrasoMax = Math.max(diasAtrasoMax, estado.diasAtraso);
  }

  const estado = diasAtrasoMax > 0 ? 'MORA' : 'AL_DIA';

  return {
    creditosActivos: creditosActivos.length,
    saldoTotal,
    diasAtrasoMax,
    estado,
    score: calcularScore(cliente, creditos, cuotas, pagos),
  };
}
