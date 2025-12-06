# ✅ VERIFICAR DEPLOY Y SINCRONIZACIÓN

## 🎯 OBJETIVO

Verificar que el deploy del schema corregido se completó en AWS y forzar la sincronización de datos.

---

## 📋 PASO 1: VERIFICAR DEPLOY EN AWS AMPLIFY

### 1.1 Abrir AWS Amplify Console

1. Ve a: https://console.aws.amazon.com/amplify/
2. Inicia sesión con tus credenciales de AWS
3. Selecciona tu app: **CrediSync360**

### 1.2 Verificar Estado del Deploy

1. Ve a la pestaña **"Hosting"** (si tienes deploy automático desde GitHub)
   - O ve a **"Backend"** si usas Amplify Sandbox

2. Busca la **Implementación más reciente**:
   - Debería mostrar el commit: "fix: corregir tipo de campo ultimaActualizacion en schema de Amplify"
   - Estado esperado: **"Implementación realizada"** ✅

3. Si el estado es **"En curso"** o **"Pendiente"**:
   - ⏳ Espera 5-10 minutos más
   - 🔄 Refresca la página cada minuto

4. Si el estado es **"Fallido"** ❌:
   - Haz clic en el deploy fallido
   - Revisa los logs de error
   - Busca mensajes como "Schema validation failed"
   - Anota el error y pide ayuda

### 1.3 Verificar Schema Actualizado

1. En Amplify Console, ve a: **Data → Data manager**

2. Selecciona la tabla **"Cliente"**

3. Verifica que existen estos campos:
   - ✅ `ultimaActualizacion` (tipo: **String**, no DateTime)
   - ✅ `creditosActivos` (tipo: Int)
   - ✅ `saldoTotal` (tipo: Float)
   - ✅ `diasAtrasoMax` (tipo: Int)
   - ✅ `estado` (tipo: Enum)
   - ✅ `score` (tipo: Enum)

4. Repite para las tablas **"Credito"** y **"Cuota"**

---

## 📋 PASO 2: VERIFICAR ESTADO DE SINCRONIZACIÓN

### 2.1 Abrir la App

1. Abre tu app en el navegador: https://tu-app.amplifyapp.com
   - O en localhost si estás en desarrollo: http://localhost:5173

2. Presiona **F12** para abrir DevTools

3. Ve a la pestaña **"Console"**

### 2.2 Ejecutar Script de Verificación

1. En la consola, copia y pega este comando:

```javascript
// Importar funciones de sync
const { getSyncStats, getFailedItems } = await import('./src/lib/sync.ts');

// Ver estadísticas
const stats = await getSyncStats();
console.log('📊 ESTADÍSTICAS DE SINCRONIZACIÓN:');
console.table(stats);

// Ver items fallidos
const failedItems = await getFailedItems();
console.log(`\n❌ Items fallidos: ${failedItems.length}`);
if (failedItems.length > 0) {
  failedItems.forEach((item, i) => {
    console.log(`${i+1}. ${item.type} - Error: ${item.lastError}`);
  });
}
```

2. Presiona **Enter**

3. Verás algo como:

```
📊 ESTADÍSTICAS DE SINCRONIZACIÓN:
┌─────────┬────────┐
│ pending │   15   │
│ synced  │    0   │
│ failed  │    0   │
│ total   │   15   │
└─────────┴────────┘

❌ Items fallidos: 0
```

### 2.3 Interpretar Resultados

**Caso A: `pending > 0` y `failed = 0`**
- ✅ Buena señal: Los items están esperando sincronización
- ➡️ Continúa al PASO 3 para forzar sync

**Caso B: `failed > 0`**
- ⚠️ Hay items que fallaron
- Revisa los errores mostrados
- Si el error menciona "Schema" o "Field", el deploy aún no terminó
- ➡️ Vuelve al PASO 1 y espera más tiempo

**Caso C: `pending = 0` y `synced > 0`**
- 🎉 ¡Excelente! La sincronización ya funcionó
- ➡️ Salta al PASO 4 para verificar en AWS

---

## 📋 PASO 3: FORZAR SINCRONIZACIÓN

### 3.1 Forzar Sync Inmediato

En la consola del navegador, ejecuta:

```javascript
// Importar función
const { forceSyncNow } = await import('./src/lib/sync.ts');

// Forzar sincronización
console.log('🔄 Forzando sincronización...');
await forceSyncNow();
console.log('✅ Sincronización completada');
```

### 3.2 Observar Logs

Verás logs como:

```
[Sync] Forcing immediate sync...
[Sync] Processing 15 items in parallel batches...
[Sync] Processing batch 1/2 (10 items)
[Sync] Processing: CREATE_CLIENTE
[Sync] Success: CREATE_CLIENTE
[Sync] Processing: CREATE_CREDITO
[Sync] Success: CREATE_CREDITO
...
[Sync] Queue processing complete
✅ Sincronización completada
```

### 3.3 Si Hay Errores

Si ves errores como:

```
[Sync] Error processing CREATE_CLIENTE: GraphQL error: Field 'ultimaActualizacion' expected type DateTime
```

**Significa que el deploy aún no terminó en AWS**
- ➡️ Vuelve al PASO 1
- Espera a que el deploy termine
- Intenta de nuevo

---

## 📋 PASO 4: VERIFICAR DATOS EN AWS

### 4.1 Abrir Data Manager

1. Ve a: Amplify Console → Data → Data manager
2. Selecciona la tabla **"Cliente"**

### 4.2 Verificar Datos Sincronizados

1. Deberías ver una lista de clientes ✅
2. Haz clic en un cliente para ver sus detalles
3. Verifica que los campos calculados tienen valores:
   - `ultimaActualizacion`: "2025-12-06T..."
   - `creditosActivos`: 1
   - `saldoTotal`: 1500.00
   - `diasAtrasoMax`: 0
   - `estado`: "AL_DIA"
   - `score`: "CONFIABLE"

### 4.3 Verificar Otras Tablas

Repite para:
- **Credito**: Verifica `saldoPendiente`, `cuotasPagadas`, `diasAtraso`
- **Cuota**: Verifica `montoPagado`, `saldoPendiente`, `estado`
- **Pago**: Verifica que los pagos están registrados

---

## 📋 PASO 5: VERIFICAR ESTADÍSTICAS FINALES

En la consola del navegador:

```javascript
// Ver estadísticas finales
const { getSyncStats } = await import('./src/lib/sync.ts');
const finalStats = await getSyncStats();
console.log('📊 ESTADÍSTICAS FINALES:');
console.table(finalStats);
```

**Resultado esperado:**

```
┌─────────┬────────┐
│ pending │    0   │  ← Todos sincronizados
│ synced  │   15   │  ← Todos exitosos
│ failed  │    0   │  ← Sin errores
│ total   │   15   │
└─────────┴────────┘
```

---

## 🎉 ÉXITO

Si llegaste aquí y:
- ✅ Deploy completado en AWS
- ✅ Schema actualizado con campos correctos
- ✅ Datos sincronizados (pending = 0, synced > 0)
- ✅ Datos visibles en AWS Data Manager
- ✅ Sin items fallidos

**¡La sincronización está funcionando correctamente!** 🚀

---

## 🐛 TROUBLESHOOTING

### Problema: Deploy tarda más de 15 minutos

**Solución:**
1. Verifica que el commit se hizo push a GitHub
2. Verifica que Amplify está configurado para deploy automático
3. Revisa los logs del deploy en Amplify Console

### Problema: Items siguen en PENDING después de forzar sync

**Solución:**
```javascript
// Reintentar items fallidos
const { retryFailedItems } = await import('./src/lib/sync.ts');
await retryFailedItems();
```

### Problema: Error "GraphQL error: Unauthorized"

**Solución:**
1. Verifica que la API Key no expiró
2. En `amplify/data/resource.ts`, verifica:
   ```typescript
   apiKeyAuthorizationMode: {
     expiresInDays: 30,
   }
   ```
3. Redeploy si es necesario

### Problema: Datos en IndexedDB pero no en AWS

**Causa:** El schema aún no está actualizado en AWS

**Solución:**
1. Espera a que termine el deploy
2. Verifica el schema en Data Manager
3. Fuerza sync de nuevo

---

## 📞 PEDIR AYUDA

Si después de seguir todos los pasos aún tienes problemas:

1. **Captura de pantalla del estado del deploy en Amplify Console**
2. **Logs de error de la consola del navegador**
3. **Estadísticas de sync** (output de `getSyncStats()`)
4. **Items fallidos** (output de `getFailedItems()`)

Con esta información podré ayudarte mejor.

---

**Última actualización:** 6 de diciembre de 2025
