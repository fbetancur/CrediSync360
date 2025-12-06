/**
 * CrediSync360 V2 - Actualización de Campos Calculados
 * 
 * Funciones para mantener sincronizados los campos calculados (cache)
 * cuando se registran pagos o se crean créditos.
 * 
 * IMPORTANTE: Estas funciones actualizan el cache, pero los datos fuente
 * (cuotas, pagos) NUNCA se modifican. Si hay inconsistencias, se recalcula.
 */

import { db } from './db';
import {
  calcularEstadoCredito,
  calcularEstadoCliente,
  calcularEstadoCuota,
} from './calculos';
import type { Credito, Cliente } from '../types';

/**
 * Actualizar campos calculados de una cuota
 * 
 * Se llama después de:
 * - Registrar un pago
 * 
 * @param cuotaId - ID de la cuota a actualizar
 */
export async function actualizarCamposCuota(cuotaId: string): Promise<void> {
  try {
    // Obtener cuota
    const cuota = await db.cuotas.get(cuotaId);
    if (!cuota) {
      console.warn(`[actualizarCamposCuota] Cuota ${cuotaId} no encontrada`);
      return;
    }

    // Obtener pagos de la cuota
    const pagos = await db.pagos.where('cuotaId').equals(cuotaId).toArray();

    // Calcular estado
    const estado = calcularEstadoCuota(cuota, pagos);

    // Actualizar campos calculados
    await db.cuotas.update(cuotaId, {
      montoPagado: estado.montoPagado,
      saldoPendiente: estado.saldoPendiente,
      estado: estado.estado,
      diasAtraso: estado.diasAtraso,
      ultimaActualizacion: new Date().toISOString(),
    });

    console.log(`[actualizarCamposCuota] Cuota ${cuotaId} actualizada:`, estado);
  } catch (error) {
    console.error(
      `[actualizarCamposCuota] Error actualizando cuota ${cuotaId}:`,
      error
    );
    throw error;
  }
}

/**
 * Actualizar campos calculados de todas las cuotas de un crédito
 * 
 * @param creditoId - ID del crédito
 */
export async function actualizarCamposCuotasCredito(
  creditoId: string
): Promise<void> {
  try {
    const cuotas = await db.cuotas.where('creditoId').equals(creditoId).toArray();
    const pagos = await db.pagos.where('creditoId').equals(creditoId).toArray();

    for (const cuota of cuotas) {
      const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
      const estado = calcularEstadoCuota(cuota, pagosCuota);

      await db.cuotas.update(cuota.id, {
        montoPagado: estado.montoPagado,
        saldoPendiente: estado.saldoPendiente,
        estado: estado.estado,
        diasAtraso: estado.diasAtraso,
        ultimaActualizacion: new Date().toISOString(),
      });
    }

    console.log(
      `[actualizarCamposCuotasCredito] ${cuotas.length} cuotas actualizadas para crédito ${creditoId}`
    );
  } catch (error) {
    console.error(
      `[actualizarCamposCuotasCredito] Error actualizando cuotas del crédito ${creditoId}:`,
      error
    );
    throw error;
  }
}

/**
 * Actualizar campos calculados de un crédito
 * 
 * Se llama después de:
 * - Registrar un pago
 * - Crear un crédito nuevo
 * 
 * @param creditoId - ID del crédito a actualizar
 */
export async function actualizarCamposCredito(creditoId: string): Promise<void> {
  try {
    // Obtener crédito
    const credito = await db.creditos.get(creditoId);
    if (!credito) {
      console.warn(
        `[actualizarCamposCredito] Crédito ${creditoId} no encontrado`
      );
      return;
    }

    // Obtener cuotas y pagos del crédito
    const cuotas = await db.cuotas.where('creditoId').equals(creditoId).toArray();
    const pagos = await db.pagos.where('creditoId').equals(creditoId).toArray();

    // Calcular estado
    const estadoCalculado = calcularEstadoCredito(credito, cuotas, pagos);

    // Actualizar campos calculados (NO actualizar campo 'estado' del modelo)
    await db.creditos.update(creditoId, {
      saldoPendiente: estadoCalculado.saldoPendiente,
      cuotasPagadas: estadoCalculado.cuotasPagadas,
      diasAtraso: estadoCalculado.diasAtraso,
      ultimaActualizacion: new Date().toISOString(),
    });

    console.log(
      `[actualizarCamposCredito] Crédito ${creditoId} actualizado:`,
      estadoCalculado
    );
  } catch (error) {
    console.error(
      `[actualizarCamposCredito] Error actualizando crédito ${creditoId}:`,
      error
    );
    throw error;
  }
}

/**
 * Actualizar campos calculados de un cliente
 * 
 * Se llama después de:
 * - Registrar un pago (afecta saldo y atraso)
 * - Crear un crédito nuevo (afecta créditos activos)
 * - Cancelar un crédito (afecta score)
 * 
 * @param clienteId - ID del cliente a actualizar
 */
export async function actualizarCamposCliente(clienteId: string): Promise<void> {
  try {
    // Obtener cliente
    const cliente = await db.clientes.get(clienteId);
    if (!cliente) {
      console.warn(`[actualizarCamposCliente] Cliente ${clienteId} no encontrado`);
      return;
    }

    // Obtener todos los créditos del cliente
    const creditos = await db.creditos.where('clienteId').equals(clienteId).toArray();
    
    // Obtener todas las cuotas del cliente
    const cuotas = await db.cuotas.where('clienteId').equals(clienteId).toArray();
    
    // Obtener todos los pagos del cliente
    const pagos = await db.pagos.where('clienteId').equals(clienteId).toArray();

    // Calcular estado
    const estado = calcularEstadoCliente(cliente, creditos, cuotas, pagos);

    // Actualizar campos calculados
    await db.clientes.update(clienteId, {
      creditosActivos: estado.creditosActivos,
      saldoTotal: estado.saldoTotal,
      diasAtrasoMax: estado.diasAtrasoMax,
      estado: estado.estado,
      score: estado.score,
      ultimaActualizacion: new Date().toISOString(),
    });

    console.log(`[actualizarCamposCliente] Cliente ${clienteId} actualizado:`, estado);
  } catch (error) {
    console.error(`[actualizarCamposCliente] Error actualizando cliente ${clienteId}:`, error);
    throw error;
  }
}

/**
 * Actualizar campos calculados después de registrar un pago
 * 
 * Actualiza la cuota, el crédito y el cliente afectados.
 * 
 * @param cuotaId - ID de la cuota
 * @param creditoId - ID del crédito
 * @param clienteId - ID del cliente
 */
export async function actualizarDespuesDePago(
  cuotaId: string,
  creditoId: string,
  clienteId: string
): Promise<void> {
  try {
    // Actualizar en secuencia: cuota → crédito → cliente
    // (el crédito depende de las cuotas, el cliente depende de los créditos)
    await actualizarCamposCuota(cuotaId);
    await actualizarCamposCredito(creditoId);
    await actualizarCamposCliente(clienteId);

    console.log(
      `[actualizarDespuesDePago] Actualización completada para cuota ${cuotaId}, crédito ${creditoId} y cliente ${clienteId}`
    );
  } catch (error) {
    console.error('[actualizarDespuesDePago] Error:', error);
    throw error;
  }
}

/**
 * Recalcular todos los campos calculados
 * 
 * Útil para:
 * - Recuperación de errores
 * - Validación de integridad
 * - Migración de datos
 * 
 * @param tenantId - ID del tenant (opcional, si no se pasa recalcula todo)
 */
export async function recalcularTodosCampos(tenantId?: string): Promise<void> {
  try {
    console.log('[recalcularTodosCampos] Iniciando recálculo completo...');

    // Obtener todos los datos
    let creditos: Credito[];
    let clientes: Cliente[];

    if (tenantId) {
      creditos = await db.creditos.where('tenantId').equals(tenantId).toArray();
      clientes = await db.clientes.where('tenantId').equals(tenantId).toArray();
    } else {
      creditos = await db.creditos.toArray();
      clientes = await db.clientes.toArray();
    }

    const cuotas = await db.cuotas.toArray();
    const pagos = await db.pagos.toArray();

    // Actualizar cuotas (primero porque créditos dependen de ellas)
    console.log(
      `[recalcularTodosCampos] Actualizando ${cuotas.length} cuotas...`
    );
    for (const cuota of cuotas) {
      const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
      const estado = calcularEstadoCuota(cuota, pagosCuota);

      await db.cuotas.update(cuota.id, {
        montoPagado: estado.montoPagado,
        saldoPendiente: estado.saldoPendiente,
        estado: estado.estado,
        diasAtraso: estado.diasAtraso,
        ultimaActualizacion: new Date().toISOString(),
      });
    }

    // Actualizar créditos
    console.log(
      `[recalcularTodosCampos] Actualizando ${creditos.length} créditos...`
    );
    for (const credito of creditos) {
      const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
      const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
      const estadoCalculado = calcularEstadoCredito(credito, cuotasCredito, pagosCredito);

      await db.creditos.update(credito.id, {
        saldoPendiente: estadoCalculado.saldoPendiente,
        cuotasPagadas: estadoCalculado.cuotasPagadas,
        diasAtraso: estadoCalculado.diasAtraso,
        ultimaActualizacion: new Date().toISOString(),
      });
    }

    // Actualizar clientes
    console.log(`[recalcularTodosCampos] Actualizando ${clientes.length} clientes...`);
    for (const cliente of clientes) {
      const creditosCliente = creditos.filter((c) => c.clienteId === cliente.id);
      const cuotasCliente = cuotas.filter((c) => c.clienteId === cliente.id);
      const pagosCliente = pagos.filter((p) => p.clienteId === cliente.id);
      const estado = calcularEstadoCliente(cliente, creditosCliente, cuotasCliente, pagosCliente);

      await db.clientes.update(cliente.id, {
        creditosActivos: estado.creditosActivos,
        saldoTotal: estado.saldoTotal,
        diasAtrasoMax: estado.diasAtrasoMax,
        estado: estado.estado,
        score: estado.score,
        ultimaActualizacion: new Date().toISOString(),
      });
    }

    console.log('[recalcularTodosCampos] Recálculo completado exitosamente');
  } catch (error) {
    console.error('[recalcularTodosCampos] Error:', error);
    throw error;
  }
}

/**
 * Validar integridad de campos calculados
 * 
 * Compara los campos calculados guardados con los valores recalculados.
 * Si hay diferencias, retorna los IDs que necesitan actualización.
 * 
 * @param tenantId - ID del tenant (opcional)
 * @returns IDs de cuotas, créditos y clientes con inconsistencias
 */
export async function validarIntegridad(tenantId?: string): Promise<{
  cuotasInconsistentes: string[];
  creditosInconsistentes: string[];
  clientesInconsistentes: string[];
}> {
  try {
    console.log('[validarIntegridad] Validando integridad de campos calculados...');

    const creditosInconsistentes: string[] = [];
    const clientesInconsistentes: string[] = [];

    // Obtener datos
    let creditos: Credito[];
    let clientes: Cliente[];

    if (tenantId) {
      creditos = await db.creditos.where('tenantId').equals(tenantId).toArray();
      clientes = await db.clientes.where('tenantId').equals(tenantId).toArray();
    } else {
      creditos = await db.creditos.toArray();
      clientes = await db.clientes.toArray();
    }

    const cuotas = await db.cuotas.toArray();
    const pagos = await db.pagos.toArray();

    const cuotasInconsistentes: string[] = [];

    // Validar cuotas
    for (const cuota of cuotas) {
      const pagosCuota = pagos.filter((p) => p.cuotaId === cuota.id);
      const estadoCalculado = calcularEstadoCuota(cuota, pagosCuota);

      // Comparar con tolerancia de 0.01 para decimales
      if (
        Math.abs(cuota.montoPagado - estadoCalculado.montoPagado) > 0.01 ||
        Math.abs(cuota.saldoPendiente - estadoCalculado.saldoPendiente) > 0.01 ||
        cuota.estado !== estadoCalculado.estado ||
        cuota.diasAtraso !== estadoCalculado.diasAtraso
      ) {
        cuotasInconsistentes.push(cuota.id);
      }
    }

    // Validar créditos
    for (const credito of creditos) {
      const cuotasCredito = cuotas.filter((c) => c.creditoId === credito.id);
      const pagosCredito = pagos.filter((p) => p.creditoId === credito.id);
      const estadoCalculado = calcularEstadoCredito(
        credito,
        cuotasCredito,
        pagosCredito
      );

      // Comparar con tolerancia de 0.01 para decimales
      if (
        Math.abs(credito.saldoPendiente - estadoCalculado.saldoPendiente) >
          0.01 ||
        credito.cuotasPagadas !== estadoCalculado.cuotasPagadas ||
        credito.diasAtraso !== estadoCalculado.diasAtraso
      ) {
        creditosInconsistentes.push(credito.id);
      }
    }

    // Validar clientes
    for (const cliente of clientes) {
      const creditosCliente = creditos.filter((c) => c.clienteId === cliente.id);
      const cuotasCliente = cuotas.filter((c) => c.clienteId === cliente.id);
      const pagosCliente = pagos.filter((p) => p.clienteId === cliente.id);
      const estadoCalculado = calcularEstadoCliente(cliente, creditosCliente, cuotasCliente, pagosCliente);

      // Comparar
      if (
        cliente.creditosActivos !== estadoCalculado.creditosActivos ||
        Math.abs(cliente.saldoTotal - estadoCalculado.saldoTotal) > 0.01 ||
        cliente.diasAtrasoMax !== estadoCalculado.diasAtrasoMax ||
        cliente.estado !== estadoCalculado.estado ||
        cliente.score !== estadoCalculado.score
      ) {
        clientesInconsistentes.push(cliente.id);
      }
    }

    console.log('[validarIntegridad] Validación completada:', {
      cuotasInconsistentes: cuotasInconsistentes.length,
      creditosInconsistentes: creditosInconsistentes.length,
      clientesInconsistentes: clientesInconsistentes.length,
    });

    return {
      cuotasInconsistentes,
      creditosInconsistentes,
      clientesInconsistentes,
    };
  } catch (error) {
    console.error('[validarIntegridad] Error:', error);
    throw error;
  }
}
