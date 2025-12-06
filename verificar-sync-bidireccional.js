/**
 * Script de Verificación de Sincronización Bidireccional
 * 
 * Ejecutar en la consola del navegador para verificar que la sincronización
 * bidireccional funciona correctamente.
 * 
 * INSTRUCCIONES:
 * 1. Abrir la app en el navegador
 * 2. Abrir DevTools (F12)
 * 3. Ir a la pestaña Console
 * 4. Copiar y pegar este script completo
 * 5. Presionar Enter
 */

console.log('🔍 VERIFICACIÓN DE SINCRONIZACIÓN BIDIRECCIONAL');
console.log('================================================\n');

async function verificarSyncBidireccional() {
  try {
    // 1. Verificar módulos disponibles
    console.log('📦 Paso 1: Verificando módulos...');
    const { db } = await import('./src/lib/db.ts');
    const { downloadFromAWS, getSyncStats } = await import('./src/lib/sync.ts');
    const { generateClient } = await import('aws-amplify/data');
    console.log('✅ Módulos cargados correctamente\n');

    // 2. Verificar datos locales
    console.log('💾 Paso 2: Verificando datos locales...');
    const [clientes, creditos, cuotas, pagos, productos, rutas] = await Promise.all([
      db.clientes.count(),
      db.creditos.count(),
      db.cuotas.count(),
      db.pagos.count(),
      db.productos.count(),
      db.rutas.count(),
    ]);

    console.log('Datos en IndexedDB:');
    console.table({
      Rutas: rutas,
      Productos: productos,
      Clientes: clientes,
      Créditos: creditos,
      Cuotas: cuotas,
      Pagos: pagos,
    });
    console.log('');

    // 3. Verificar cola de sincronización
    console.log('📋 Paso 3: Verificando cola de sincronización...');
    const stats = await getSyncStats();
    console.log('Estado de la cola:');
    console.table(stats);
    console.log('');

    // 4. Verificar datos en AWS
    console.log('☁️ Paso 4: Verificando datos en AWS...');
    const client = generateClient();

    const [
      { data: rutasAWS },
      { data: productosAWS },
      { data: clientesAWS },
      { data: creditosAWS },
      { data: cuotasAWS },
      { data: pagosAWS },
    ] = await Promise.all([
      client.models.Ruta.list(),
      client.models.ProductoCredito.list(),
      client.models.Cliente.list(),
      client.models.Credito.list(),
      client.models.Cuota.list(),
      client.models.Pago.list(),
    ]);

    console.log('Datos en AWS:');
    console.table({
      Rutas: rutasAWS?.length || 0,
      Productos: productosAWS?.length || 0,
      Clientes: clientesAWS?.length || 0,
      Créditos: creditosAWS?.length || 0,
      Cuotas: cuotasAWS?.length || 0,
      Pagos: pagosAWS?.length || 0,
    });
    console.log('');

    // 5. Comparar datos
    console.log('🔄 Paso 5: Comparando datos locales vs AWS...');
    const diferencias = {
      Rutas: Math.abs(rutas - (rutasAWS?.length || 0)),
      Productos: Math.abs(productos - (productosAWS?.length || 0)),
      Clientes: Math.abs(clientes - (clientesAWS?.length || 0)),
      Créditos: Math.abs(creditos - (creditosAWS?.length || 0)),
      Cuotas: Math.abs(cuotas - (cuotasAWS?.length || 0)),
      Pagos: Math.abs(pagos - (pagosAWS?.length || 0)),
    };

    console.log('Diferencias (Local - AWS):');
    console.table(diferencias);
    console.log('');

    // 6. Verificar campo createdBy
    console.log('🔍 Paso 6: Verificando campo createdBy...');
    const clientesLocales = await db.clientes.limit(5).toArray();
    if (clientesLocales.length > 0) {
      console.log('Primeros 5 clientes locales:');
      console.table(clientesLocales.map(c => ({
        id: c.id,
        nombre: c.nombre,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
      })));
      console.log('');

      const descargados = clientesLocales.filter(c => c.createdBy === 'aws-sync').length;
      const locales = clientesLocales.filter(c => c.createdBy !== 'aws-sync').length;

      console.log(`📊 De ${clientesLocales.length} clientes:`);
      console.log(`   - ${descargados} descargados de AWS (createdBy: 'aws-sync')`);
      console.log(`   - ${locales} creados localmente`);
      console.log('');
    } else {
      console.log('⚠️ No hay clientes locales para verificar');
      console.log('');
    }

    // 7. Resumen final
    console.log('📊 RESUMEN FINAL');
    console.log('================\n');

    const totalLocal = rutas + productos + clientes + creditos + cuotas + pagos;
    const totalAWS = (rutasAWS?.length || 0) + (productosAWS?.length || 0) + 
                     (clientesAWS?.length || 0) + (creditosAWS?.length || 0) + 
                     (cuotasAWS?.length || 0) + (pagosAWS?.length || 0);

    console.log(`Total registros locales: ${totalLocal}`);
    console.log(`Total registros en AWS: ${totalAWS}`);
    console.log(`Diferencia: ${Math.abs(totalLocal - totalAWS)}`);
    console.log('');

    if (stats.pending > 0) {
      console.log(`⏳ Hay ${stats.pending} items pendientes de sincronizar`);
      console.log('   Espera 30 segundos para que se sincronicen automáticamente');
      console.log('   O ejecuta: forceSyncNow() para sincronizar inmediatamente');
    } else if (stats.failed > 0) {
      console.log(`❌ Hay ${stats.failed} items fallidos`);
      console.log('   Ejecuta: retryFailedItems() para reintentarlos');
    } else {
      console.log('✅ No hay items pendientes de sincronizar');
    }
    console.log('');

    if (totalLocal === totalAWS && stats.pending === 0 && stats.failed === 0) {
      console.log('🎉 ¡SINCRONIZACIÓN BIDIRECCIONAL FUNCIONANDO PERFECTAMENTE!');
    } else if (stats.pending > 0) {
      console.log('⏳ Sincronización en progreso...');
    } else {
      console.log('⚠️ Hay diferencias entre local y AWS');
      console.log('   Esto puede ser normal si:');
      console.log('   - Acabas de crear datos localmente (esperando sincronización)');
      console.log('   - Hay filtros por ruta (cobradores solo ven su ruta)');
      console.log('   - Hay datos en AWS que no pertenecen a tu tenant/ruta');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    console.log('\n💡 Posibles causas:');
    console.log('   - La app no está corriendo');
    console.log('   - No hay conexión a internet');
    console.log('   - La API Key de AWS expiró');
    console.log('   - Hay un error en el código');
  }
}

// Ejecutar verificación
verificarSyncBidireccional();

// Exportar funciones útiles para uso manual
console.log('\n🛠️ FUNCIONES DISPONIBLES:');
console.log('========================\n');
console.log('verificarSyncBidireccional()  - Ejecutar verificación completa');
console.log('');
console.log('// Importar funciones de sync:');
console.log('const { downloadFromAWS, forceSyncNow, getSyncStats, retryFailedItems } = await import("./src/lib/sync.ts");');
console.log('');
console.log('// Forzar sincronización inmediata:');
console.log('await forceSyncNow();');
console.log('');
console.log('// Descargar datos de AWS:');
console.log('await downloadFromAWS("tenant-1", "ruta-default");');
console.log('');
console.log('// Ver estadísticas:');
console.log('await getSyncStats();');
console.log('');
console.log('// Reintentar items fallidos:');
console.log('await retryFailedItems();');
console.log('');
