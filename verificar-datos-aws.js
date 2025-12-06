/**
 * Script para verificar si los datos llegaron a AWS
 * 
 * Ejecutar en la consola del navegador (DevTools):
 */

console.log('🔍 VERIFICANDO DATOS EN AWS...\n');

// 1. Verificar estadísticas de sync
const { getSyncStats } = await import('./src/lib/sync.ts');
const stats = await getSyncStats();
console.log('📊 ESTADÍSTICAS DE SYNC:');
console.table(stats);

// 2. Verificar datos locales
const { db } = await import('./src/lib/db.ts');
const clientesLocales = await db.clientes.toArray();
console.log(`\n💾 CLIENTES EN INDEXEDDB LOCAL: ${clientesLocales.length}`);
if (clientesLocales.length > 0) {
  console.log('Último cliente creado:');
  console.log(clientesLocales[clientesLocales.length - 1]);
}

// 3. Verificar datos en AWS directamente
console.log('\n☁️ VERIFICANDO DATOS EN AWS...');
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

try {
  const { data: clientesAWS, errors } = await client.models.Cliente.list();
  
  if (errors) {
    console.error('❌ ERRORES AL CONSULTAR AWS:', errors);
  } else {
    console.log(`✅ CLIENTES EN AWS: ${clientesAWS.length}`);
    if (clientesAWS.length > 0) {
      console.log('Clientes en AWS:');
      console.table(clientesAWS.map(c => ({
        id: c.id,
        nombre: c.nombre,
        documento: c.documento,
        tenantId: c.tenantId,
        rutaId: c.rutaId
      })));
    } else {
      console.log('⚠️ No hay clientes en AWS');
    }
  }
} catch (error) {
  console.error('❌ ERROR AL CONSULTAR AWS:', error);
}

// 4. Verificar items en la cola de sync
const itemsQueue = await db.syncQueue.toArray();
console.log(`\n📋 ITEMS EN COLA DE SYNC: ${itemsQueue.length}`);
if (itemsQueue.length > 0) {
  console.log('Últimos 5 items:');
  console.table(itemsQueue.slice(-5).map(item => ({
    type: item.type,
    status: item.status,
    retries: item.retries,
    error: item.lastError || 'N/A'
  })));
}

console.log('\n✅ Verificación completa');
