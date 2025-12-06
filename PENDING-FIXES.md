# 🚧 CORRECCIONES PENDIENTES

## ✅ COMPLETADO:
1. ✅ Agregado entidad Ruta a types.ts
2. ✅ Agregado rutaId a Cliente, Credito, Cuota, Pago, CierreCaja, MovimientoCaja
3. ✅ Actualizado schema de Amplify con Ruta y campos calculados
4. ✅ Actualizado Dexie a versión 4 con índices optimizados
5. ✅ Agregado rutaId en NuevoCliente.tsx
6. ✅ Agregado rutaId en RegistrarPago.tsx
7. ✅ Agregado rutaId en useBalance.ts (movimiento y cierre)
8. ✅ Agregado rutaId en useCredito.ts (crédito y cuotas)
9. ✅ Agregado rutaId en calculos.test.ts
10. ✅ Optimizaciones críticas implementadas (Sesión 16)
11. ✅ Inputs numéricos en móvil (Sesión 16)
12. ✅ Schema corregido: ultimaActualizacion como string (Sesión 16)

## ⚠️ EN PROGRESO:

### 1. PROBLEMA DE SINCRONIZACIÓN
**Estado:** Esperando deploy en AWS

**Problema:** Los datos aparecen en IndexedDB (local) pero NO en AWS Amplify Data Manager

**Causa:** Schema de Amplify tenía campos `ultimaActualizacion` como `a.datetime()` pero el código los guarda como strings ISO

**Solución aplicada:**
- ✅ Corregido schema: cambió `a.datetime()` por `a.string()` en 3 campos
- ✅ Commit realizado: "fix: corregir tipo de campo ultimaActualizacion en schema de Amplify"
- ✅ Push exitoso a GitHub
- ⏳ Esperando deploy automático en AWS (5-10 minutos)

**Próximos pasos:**
1. Verificar deploy completado en AWS Amplify Console
2. Forzar sincronización en la app
3. Verificar datos en AWS Data Manager

**Documentación:**
- Ver: `VERIFICAR-DEPLOY.md` (guía paso a paso)
- Ver: `INSTRUCCIONES-REDEPLOY.md` (troubleshooting completo)

## ⏳ PENDIENTE:

### 1. Corregir seedData.ts
Agregar a TODOS los clientes (5 lugares):
```typescript
rutaId: 'ruta-default',
```

Agregar a TODOS los créditos:
```typescript
rutaId: 'ruta-default',
```

Agregar a TODAS las cuotas:
```typescript
rutaId: 'ruta-default',
cobradorId: userId,
```

### 2. Corregir seedData.ts
Agregar a TODOS los clientes (5 lugares):
```typescript
rutaId: 'ruta-default',
```

Agregar a TODOS los créditos:
```typescript
rutaId: 'ruta-default',
```

Agregar a TODAS las cuotas:
```typescript
rutaId: 'ruta-default',
cobradorId: userId,
```

### 3. SERVICE WORKER PARA PWA

Instalar Vite PWA Plugin:
```bash
npm install -D vite-plugin-pwa
```

Configurar en vite.config.ts:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CrediSync360',
        short_name: 'CrediSync',
        description: 'Sistema de gestión de microcréditos',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aws-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    })
  ]
})
```

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN:

1. **CRÍTICO** - Verificar deploy en AWS y forzar sincronización
2. **CRÍTICO** - Corregir seedData.ts (para que compile)
3. **BAJA** - Service Worker (Fase 10)

## 📝 NOTAS:
- Todos los `rutaId: 'ruta-default'` son temporales
- En Fase 9 se reemplazarán con valores del AuthContext
- El schema de Amplify ya está actualizado y listo
- Dexie v4 ya tiene los índices optimizados
