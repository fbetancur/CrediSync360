# 🚀 INSTRUCCIONES PARA REDEPLOY DEL BACKEND

## ⚠️ PROBLEMA ACTUAL

**Síntoma:** Los datos aparecen en la app (IndexedDB local) pero NO en el administrador de datos de AWS Amplify.

**Causa:** El schema de Amplify en AWS está desactualizado. No tiene los campos calculados que agregamos en Sesión 13 y 15.

**Solución:** Redeplegar el backend para actualizar el schema en AWS.

---

## 📋 PASOS PARA REDEPLOY

### Opción 1: Redeploy Automático desde GitHub (RECOMENDADO)

Si tienes configurado Amplify Hosting con deploy automático:

1. **Los cambios ya están en GitHub** ✅
   - Commit: "perf: implementar todas las optimizaciones críticas - Sesión 16"
   - Push exitoso a main branch

2. **Amplify detectará los cambios automáticamente**
   - Ve a: https://console.aws.amazon.com/amplify/
   - Selecciona tu app: CrediSync360
   - Ve a la pestaña "Hosting"
   - Verás un nuevo build iniciándose automáticamente

3. **Espera a que termine el deploy** (~5-10 minutos)
   - Backend: Actualización del schema
   - Frontend: Nueva versión de la app

4. **Verifica que el schema se actualizó**
   - Ve a: Amplify Console → Data → Data manager
   - Verifica que las tablas tienen los nuevos campos calculados

---

### Opción 2: Redeploy Manual con Amplify Sandbox

Si prefieres hacerlo manualmente desde tu máquina local:

```bash
# 1. Asegúrate de estar en la rama main con los últimos cambios
git status
git pull origin main

# 2. Inicia el sandbox de Amplify
npx amplify sandbox

# 3. Espera a que termine el deploy
# Verás mensajes como:
# ✓ Deploying resources...
# ✓ Schema updated successfully
# ✓ All resources deployed

# 4. El sandbox quedará corriendo
# Presiona Ctrl+C cuando quieras detenerlo
```

**Nota:** El sandbox es para desarrollo. Para producción, usa la Opción 1.

---

### Opción 3: Deploy a Producción (Solo si ya tienes ambiente de producción)

```bash
# 1. Asegúrate de tener configurado el perfil de producción
npx amplify configure

# 2. Deploy a producción
npx amplify sandbox deploy --profile production

# 3. Espera a que termine el deploy
```

---

## ✅ VERIFICACIÓN POST-DEPLOY

### 1. Verificar Schema en AWS

1. Ve a: https://console.aws.amazon.com/amplify/
2. Selecciona tu app: CrediSync360
3. Ve a: Data → Data manager
4. Verifica que las tablas tienen los nuevos campos:

**Cliente:**
- ✅ creditosActivos (integer)
- ✅ saldoTotal (float)
- ✅ diasAtrasoMax (integer)
- ✅ estado (enum)
- ✅ score (enum)
- ✅ ultimaActualizacion (string)

**Credito:**
- ✅ saldoPendiente (float)
- ✅ cuotasPagadas (integer)
- ✅ diasAtraso (integer)
- ✅ ultimaActualizacion (string)

**Cuota:**
- ✅ montoPagado (float)
- ✅ saldoPendiente (float)
- ✅ estado (enum)
- ✅ diasAtraso (integer)
- ✅ ultimaActualizacion (string)

### 2. Forzar Sincronización en la App

Una vez que el backend esté actualizado:

1. **Abre la app en el navegador**
2. **Abre DevTools** (F12)
3. **Ve a la pestaña Console**
4. **Ejecuta:**
   ```javascript
   // Importar función de sync
   const { forceSyncNow } = await import('./src/lib/sync.ts');
   
   // Forzar sincronización inmediata
   await forceSyncNow();
   ```

5. **Verifica los logs en la consola:**
   ```
   [Sync] Processing X items in parallel batches...
   [Sync] Processing: CREATE_CLIENTE
   [Sync] Success: CREATE_CLIENTE
   [Sync] Queue processing complete: X succeeded, 0 failed
   ```

### 3. Verificar Datos en AWS

1. Ve a: Amplify Console → Data → Data manager
2. Selecciona la tabla "Cliente"
3. **Deberías ver tus clientes sincronizados** ✅
4. Verifica que tienen los campos calculados con valores

---

## 🐛 TROUBLESHOOTING

### Problema: "Schema validation failed"

**Causa:** El schema local y remoto no coinciden.

**Solución:**
```bash
# Limpiar cache de Amplify
rm -rf .amplify/artifacts
rm -rf node_modules/.amplify

# Reinstalar dependencias
npm install

# Redeploy
npx amplify sandbox
```

### Problema: "Sync failed with error: GraphQL error"

**Causa:** El backend aún no está actualizado.

**Solución:**
1. Espera a que termine el deploy en AWS
2. Refresca la app (Ctrl+R)
3. Intenta sincronizar de nuevo

### Problema: "Items stuck in PENDING status"

**Causa:** Errores de sincronización anteriores.

**Solución:**
```javascript
// En la consola del navegador
const { retryFailedItems } = await import('./src/lib/sync.ts');
await retryFailedItems();
```

---

## 📊 VERIFICAR SINCRONIZACIÓN FUNCIONA

### Test Completo:

1. **Crear un cliente nuevo en la app**
   - Ve a: Clientes → Nuevo Cliente
   - Llena el formulario
   - Guarda

2. **Verificar en IndexedDB (local)**
   - DevTools → Application → IndexedDB → credisync-v2 → clientes
   - Deberías ver el cliente

3. **Esperar 30 segundos** (intervalo de sync automático)

4. **Verificar en AWS**
   - Amplify Console → Data → Data manager → Cliente
   - Deberías ver el cliente sincronizado ✅

5. **Verificar logs de sync**
   - DevTools → Console
   - Busca: `[Sync] Success: CREATE_CLIENTE`

---

## 🎯 RESULTADO ESPERADO

Después del redeploy:

- ✅ Schema de AWS actualizado con campos calculados
- ✅ Sincronización funcionando correctamente
- ✅ Datos visibles en Amplify Data Manager
- ✅ Logs de sync sin errores
- ✅ Items en estado SYNCED (no PENDING)

---

## 📝 NOTAS IMPORTANTES

1. **El redeploy NO afecta los datos locales**
   - Tus datos en IndexedDB están seguros
   - Solo actualiza el schema en AWS

2. **La sincronización es automática**
   - Cada 30 segundos
   - También al reconectar a internet

3. **Los datos se sincronizan en orden FIFO**
   - Primero los más antiguos
   - En batches de 10 items paralelos

4. **Puedes verificar el estado de la cola**
   ```javascript
   const { getSyncStats } = await import('./src/lib/sync.ts');
   const stats = await getSyncStats();
   console.log(stats);
   // { pending: X, synced: Y, failed: Z, total: N }
   ```

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DEL REDEPLOY

1. ✅ Verificar sincronización funciona
2. ✅ Testing completo con datos reales
3. ✅ Verificar que no hay items FAILED
4. ⏳ Fase 9: Implementar autenticación
5. ⏳ Fase 10: PWA con Service Worker

---

**Última actualización:** 6 de diciembre de 2025 - Sesión 16
