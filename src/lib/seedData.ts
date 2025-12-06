/**
 * CrediSync360 V2 - Seed Data
 * 
 * Script para agregar datos de prueba a la base de datos local.
 * Útil para desarrollo y testing.
 */

import { db } from './db';
import { addDays, format } from 'date-fns';
import type { Cliente, ProductoCredito, Credito, Cuota } from '../types';

/**
 * Limpiar toda la base de datos
 */
export async function clearDatabase() {
  await db.clearAll();
  console.log('✅ Base de datos limpiada');
}

/**
 * Generar datos de prueba
 */
export async function seedDatabase() {
  console.log('🌱 Generando datos de prueba...');

  const tenantId = 'test-tenant';
  const userId = 'test-user';
  const hoy = new Date();

  // 1. Crear productos de crédito
  const productos: ProductoCredito[] = [
    {
      id: 'prod-1',
      tenantId,
      nombre: 'Crédito Diario',
      interesPorcentaje: 20,
      numeroCuotas: 20,
      frecuencia: 'DIARIO',
      excluirDomingos: true,
      montoMinimo: 50000,
      montoMaximo: 500000,
      activo: true,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'prod-2',
      tenantId,
      nombre: 'Crédito Semanal',
      interesPorcentaje: 45,
      numeroCuotas: 13,
      frecuencia: 'SEMANAL',
      excluirDomingos: false,
      montoMinimo: 100000,
      montoMaximo: 1000000,
      activo: true,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'prod-3',
      tenantId,
      nombre: 'Crédito Quincenal',
      interesPorcentaje: 30,
      numeroCuotas: 6,
      frecuencia: 'QUINCENAL',
      excluirDomingos: false,
      montoMinimo: 200000,
      montoMaximo: 2000000,
      activo: true,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
  ];
  
  for (const producto of productos) {
    await db.productos.add(producto);
  }
  
  const producto = productos[0]; // Usar el primer producto para los créditos de prueba

  // 2. Crear clientes de prueba con campos calculados inicializados
  const clientes: Cliente[] = [
    {
      id: 'cliente-1',
      tenantId,
      rutaId: 'ruta-default',
      nombre: 'María García',
      documento: '1234567890',
      telefono: '3001234567',
      direccion: 'Calle 10 #20-30',
      barrio: 'Centro',
      referencia: 'Casa azul',
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: 'REGULAR',
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'cliente-2',
      tenantId,
      rutaId: 'ruta-default',
      nombre: 'Juan Pérez',
      documento: '0987654321',
      telefono: '3009876543',
      direccion: 'Carrera 5 #15-25',
      barrio: 'Norte',
      referencia: 'Tienda esquina',
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: 'REGULAR',
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'cliente-3',
      tenantId,
      rutaId: 'ruta-default',
      nombre: 'Ana Rodríguez',
      documento: '1122334455',
      telefono: '3001122334',
      direccion: 'Avenida 8 #30-40',
      barrio: 'Sur',
      referencia: 'Edificio verde',
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: 'REGULAR',
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'cliente-4',
      tenantId,
      rutaId: 'ruta-default',
      nombre: 'Carlos López',
      documento: '5544332211',
      telefono: '3005544332',
      direccion: 'Calle 20 #10-15',
      barrio: 'Occidente',
      referencia: 'Casa blanca',
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: 'REGULAR',
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      id: 'cliente-5',
      tenantId,
      rutaId: 'ruta-default',
      nombre: 'Laura Martínez',
      documento: '6677889900',
      telefono: '3006677889',
      direccion: 'Carrera 15 #25-35',
      barrio: 'Oriente',
      referencia: 'Panadería',
      creditosActivos: 0,
      saldoTotal: 0,
      diasAtrasoMax: 0,
      estado: 'SIN_CREDITOS',
      score: 'REGULAR',
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
  ];

  await db.clientes.bulkAdd(clientes);

  // 3. Crear créditos y cuotas
  for (let i = 0; i < clientes.length; i++) {
    const cliente = clientes[i];
    const creditoId = `credito-${i + 1}`;

    // Crédito con campos calculados inicializados
    const credito: Credito = {
      id: creditoId,
      tenantId,
      rutaId: 'ruta-default',
      clienteId: cliente.id,
      productoId: producto.id,
      cobradorId: userId,
      montoOriginal: 300000,
      interesPorcentaje: 0,
      totalAPagar: 300000,
      numeroCuotas: 10,
      valorCuota: 30000,
      frecuencia: 'DIARIO',
      fechaDesembolso: format(addDays(hoy, -15), 'yyyy-MM-dd'),
      fechaPrimeraCuota: format(addDays(hoy, -14), 'yyyy-MM-dd'),
      fechaUltimaCuota: format(addDays(hoy, -5), 'yyyy-MM-dd'),
      estado: 'ACTIVO',
      saldoPendiente: 300000,
      cuotasPagadas: 0,
      diasAtraso: 0,
      ultimaActualizacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    await db.creditos.add(credito);

    // Cuotas con campos calculados inicializados
    const cuotas: Cuota[] = [];
    for (let j = 0; j < 10; j++) {
      // Algunas cuotas atrasadas, algunas del día, algunas futuras
      let fechaCuota: Date;
      if (i === 0 || i === 1) {
        // Clientes con atraso (3-5 días)
        fechaCuota = addDays(hoy, -5 + j);
      } else if (i === 2) {
        // Cliente con cuota de hoy
        fechaCuota = addDays(hoy, j);
      } else {
        // Clientes al día (cuotas futuras)
        fechaCuota = addDays(hoy, j + 1);
      }

      cuotas.push({
        id: `cuota-${i + 1}-${j + 1}`,
        tenantId,
        rutaId: 'ruta-default',
        creditoId,
        clienteId: cliente.id,
        cobradorId: userId,
        numero: j + 1,
        fechaProgramada: format(fechaCuota, 'yyyy-MM-dd'),
        montoProgramado: 30000,
        // Campos calculados (inicializados para cuota nueva sin pagos)
        montoPagado: 0,
        saldoPendiente: 30000,
        estado: 'PENDIENTE',
        diasAtraso: 0,
        ultimaActualizacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
    }
    await db.cuotas.bulkAdd(cuotas);
  }

  // 4. Recalcular campos calculados para todos los registros
  console.log('🔄 Recalculando campos calculados...');
  const { recalcularTodosCampos } = await import('./actualizarCampos');
  await recalcularTodosCampos(tenantId);

  console.log('✅ Datos de prueba generados:');
  console.log(`   - ${clientes.length} clientes`);
  console.log(`   - ${clientes.length} créditos`);
  console.log(`   - ${clientes.length * 10} cuotas`);
  console.log('');
  console.log('📊 Estado de los clientes:');
  console.log('   - María García: 5 días de atraso');
  console.log('   - Juan Pérez: 5 días de atraso');
  console.log('   - Ana Rodríguez: Cuota de hoy');
  console.log('   - Carlos López: Al día');
  console.log('   - Laura Martínez: Al día');
}

/**
 * Función helper para ejecutar desde la consola del navegador
 */
export async function resetAndSeed() {
  await clearDatabase();
  await seedDatabase();
  console.log('');
  console.log('🎉 ¡Listo! Recarga la página para ver los datos.');
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).seedData = {
    clearDatabase,
    seedDatabase,
    resetAndSeed,
  };
}
