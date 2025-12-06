/**
 * Script para verificar el estado de sincronización
 * 
 * Ejecutar en la consola del navegador (DevTools):
 * 1. Abre la app en el navegador
 * 2. Presiona F12 para abrir DevTools
 * 3. Ve a la pestaña Console
 * 4. Copia y pega este script completo
 */

console.log('🔍 VERIFICANDO ESTADO DE SINCRONIZACIÓN...\n');

// Importar funciones de sync
const { getSyncStats, getFailedItems, forceSyncNow, retryFailedItems } = await import('./src/lib/sync.ts');

// 1. Obtener estadísticas de la cola
console.log('📊 ESTADÍSTICAS DE LA COLA:');
const stats = await getSyncStats();
console.table(stats);

// 2. Verificar items fallidos
console.log('\n❌ ITEMS FALLIDOS:');
const failedItems = await getFailedItems();
if (failedItems.length > 0) {
  console.log(`Encontrados ${failedItems.length} items fallidos:`);
  failedItems.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.type}`);
    console.log(`   Reintentos: ${item.retries}`);
    console.log(`   Error: ${item.lastError}`);
    console.log(`   Datos:`, item.data);
  });
} else {
  console.log('✅ No hay items fallidos');
}

// 3. Verificar datos locales
console.log('\n💾 DATOS LOCALES (IndexedDB):');
const { db } = await import('./src/lib/db.ts');

const [clientes, creditos, cuotas, pagos] = await Promise.all([
  db.clientes.count(),
  db.creditos.count(),
  db.cuotas.count(),
  db.pagos.count()
]);

console.table({
  'Clientes': clientes,
  'Créditos': creditos,
  'Cuotas': cuotas,
  'Pagos': pagos
});

// 4. Preguntar si quiere forzar sincronización
console.log('\n🔄 OPCIONES:');
console.log('1. Para FORZAR sincronización inmediata, ejecuta:');
console.log('   await forceSyncNow()');
console.log('\n2. Para REINTENTAR items fallidos, ejecuta:');
console.log('   await retryFailedItems()');
console.log('\n3. Para ver un cliente de ejemplo, ejecuta:');
console.log('   const cliente = await db.clientes.toCollection().first()');
console.log('   console.log(cliente)');

console.log('\n✅ Verificación completa');
