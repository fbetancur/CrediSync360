# 🔍 DIAGNÓSTICO DE SINCRONIZACIÓN

**Fecha:** 6 de diciembre de 2025  
**Problema:** Cliente creado localmente, sincronización exitosa, pero no aparece en AWS Data Manager

---

## ✅ LO QUE FUNCIONA

Según los logs:
```
✅ Cliente creado: {id: 'cliente-1765032180398-r75ty3bc4', ...}
✅ [Sync] Added to queue: CREATE_CLIENTE
✅ [Sync] Processing 1 items in parallel batches...
✅ [Sync] Success: CREATE_CLIENTE
✅ [Sync] Queue processing complete
```

**Conclusión:** La sincronización se ejecutó SIN ERRORES ✅

---

## 🔍 POSIBLES CAUSAS

### 1. Cache del Data Manager (MÁS PROBABLE)

**Síntoma:** Los datos están en AWS pero el Data Manager no los muestra por cache.

**Solución:**
1. En AWS Amplify Console → Data → Data manager
2. Presiona **Ctrl + F5** (o Cmd + Shift + R en Mac) para refrescar sin cache
3. O cierra y vuelve a abrir la pestaña del Data Manager

---

### 2. Ambiente Incorrecto

**Síntoma:** Estás viendo un ambiente diferente al que está conectada tu app.

**Verificación:**
1. En tu app, abre DevTools → Console
2. Ejecuta:
   ```javascript
   const config = await import('./src/amplifyconfiguration.json');
   console.log('API Endpoint:', config.default.aws_appsync_graphqlEndpoint);
   ```
3. En AWS Console, verifica que el endpoint coincida con el ambiente que estás viendo

---

### 3. API Key Expirada

**Síntoma:** La sincronización dice "Success" pero AWS rechaza la petición silenciosamente.

**Verificación:**
1. En AWS Amplify Console → Data → Settings
2. Verifica la fecha de expiración de la API Key
3. Si está expirada o cerca de expirar, genera una nueva

---

### 4. Filtro en Data Manager

**Síntoma:** Los datos están en AWS pero hay un filtro activo que los oculta.

**Verificación:**
1. En Data Manager, verifica que no haya filtros activos
2. Busca un botón "Clear filters" o similar
3. Intenta buscar por el ID específico: `cliente-1765032180398-r75ty3bc4`

---

## 🔬 DIAGNÓSTICO PASO A PASO

### Paso 1: Verificar que el dato llegó a AWS

En la consola del navegador, ejecuta:

```javascript
// Importar cliente de Amplify
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

// Consultar directamente a AWS
const { data, errors } = await client.models.Cliente.list();

if (errors) {
  console.error('❌ ERRORES:', errors);
} else {
  console.log(`✅ Total clientes en AWS: ${data.length}`);
  console.table(data.map(c => ({
    id: c.id,
    nombre: c.nombre,
    documento: c.documento
  })));
}
```

**Resultado esperado:**
- Si muestra el cliente → El dato SÍ está en AWS (problema de cache en Data Manager)
- Si NO muestra el cliente → El dato NO llegó a AWS (problema de sincronización)

---

### Paso 2: Verificar estadísticas de sync

```javascript
const { getSyncStats } = await import('./src/lib/sync.ts');
const stats = await getSyncStats();
console.table(stats);
```

**Resultado esperado:**
```
┌─────────┬────────┐
│ pending │    0   │  ← Debe ser 0
│ synced  │    1   │  ← Debe ser > 0
│ failed  │    0   │  ← Debe ser 0
└─────────┴────────┘
```

---

### Paso 3: Verificar items en la cola

```javascript
const { db } = await import('./src/lib/db.ts');
const queue = await db.syncQueue.toArray();

console.log(`Total items en cola: ${queue.length}`);
console.table(queue.map(item => ({
  type: item.type,
  status: item.status,
  retries: item.retries,
  error: item.lastError || 'N/A'
})));
```

**Resultado esperado:**
- El item CREATE_CLIENTE debe tener `status: 'SYNCED'`
- `retries: 0`
- `error: N/A`

---

### Paso 4: Buscar por ID específico en AWS

```javascript
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

const { data, errors } = await client.models.Cliente.get({
  id: 'cliente-1765032180398-r75ty3bc4'
});

if (errors) {
  console.error('❌ ERRORES:', errors);
} else if (data) {
  console.log('✅ CLIENTE ENCONTRADO EN AWS:');
  console.log(data);
} else {
  console.log('❌ CLIENTE NO ENCONTRADO EN AWS');
}
```

---

## 🎯 SOLUCIONES SEGÚN DIAGNÓSTICO

### Si el cliente SÍ está en AWS (Paso 1 lo encuentra)

**Problema:** Cache del Data Manager

**Solución:**
1. Refresca el Data Manager con Ctrl + F5
2. O usa la query directa desde la consola para verificar datos

---

### Si el cliente NO está en AWS (Paso 1 NO lo encuentra)

**Problema:** La sincronización no está guardando en AWS

**Posibles causas:**
1. **API Key expirada** - Verifica en AWS Console
2. **Permisos incorrectos** - Verifica que la API Key tenga permisos de escritura
3. **Error silencioso** - Revisa los logs completos de la consola

**Solución:**
1. Verifica la API Key en AWS Console
2. Revisa los logs de la consola en busca de errores
3. Intenta crear otro cliente y observa los logs completos

---

### Si hay items FAILED en la cola (Paso 3)

**Problema:** Errores de sincronización

**Solución:**
```javascript
const { getFailedItems } = await import('./src/lib/sync.ts');
const failed = await getFailedItems();

console.log('Items fallidos:');
failed.forEach(item => {
  console.log(`Tipo: ${item.type}`);
  console.log(`Error: ${item.lastError}`);
  console.log(`Datos:`, item.data);
});
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Refrescar Data Manager con Ctrl + F5
- [ ] Ejecutar Paso 1: Verificar que el dato llegó a AWS
- [ ] Ejecutar Paso 2: Verificar estadísticas de sync
- [ ] Ejecutar Paso 3: Verificar items en la cola
- [ ] Ejecutar Paso 4: Buscar por ID específico
- [ ] Verificar API Key no expirada
- [ ] Verificar ambiente correcto
- [ ] Verificar sin filtros en Data Manager

---

## 🚨 SI NADA FUNCIONA

Si después de todos los pasos el cliente NO aparece en AWS:

1. **Captura de pantalla de:**
   - Output del Paso 1 (query directa a AWS)
   - Output del Paso 2 (estadísticas)
   - Output del Paso 3 (cola de sync)
   - Logs completos de la consola

2. **Información adicional:**
   - ¿La API Key está expirada?
   - ¿Hay errores en la consola que no mencionaste?
   - ¿El ambiente en AWS Console es el correcto?

Con esta información podré ayudarte mejor.

---

## 💡 NOTA IMPORTANTE

El log `[Sync] Success: CREATE_CLIENTE` significa que:
- ✅ La petición GraphQL se ejecutó sin errores
- ✅ AWS respondió con éxito (status 200)
- ✅ No hubo errores de validación

**Pero NO garantiza que el dato se guardó correctamente.**

Puede haber casos donde AWS acepta la petición pero no guarda el dato por:
- Permisos insuficientes
- Validaciones del schema
- Problemas de red intermitentes

Por eso es importante ejecutar el **Paso 1** para verificar directamente en AWS.

---

**Última actualización:** 6 de diciembre de 2025 - 17:00
