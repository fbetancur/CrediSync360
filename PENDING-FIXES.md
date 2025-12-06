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

### 2. OPTIMIZACIONES CRÍTICAS

#### A. Optimizar useRuta.ts - Filtrar por cobrador
```typescript
// ANTES (carga TODO)
const cuotas = useLiveQuery(async () => {
  return await db.cuotas
    .where('fechaProgramada')
    .belowOrEqual(hoy)
    .toArray();
}, [hoy]);

// DESPUÉS (solo del cobrador)
const cuotas = useLiveQuery(async () => {
  return await db.cuotas
    .where('[tenantId+cobradorId+fechaProgramada]')
    .between(
      [TENANT_ID, COBRADOR_ID, '2000-01-01'],
      [TENANT_ID, COBRADOR_ID, hoy]
    )
    .toArray();
}, [hoy]);
```

#### B. Cambiar estadisticas() de useCallback a useMemo
```typescript
// ANTES
const estadisticas = useCallback(() => {
  // cálculos...
}, [pagos, cuotas, hoy]);

// DESPUÉS
const estadisticas = useMemo(() => {
  // cálculos...
  return { totalCobradoHoy, cuotasCobradas, cuotasPendientes };
}, [pagos, cuotas, hoy]);
```

#### C. Usar campos calculados en procesarRuta
```typescript
// ANTES
const estadoCuota = calcularEstadoCuota(cuota, pagosCuota);
if (estadoCuota.estado === 'PAGADA') continue;

// DESPUÉS
if (cuota.estado === 'PAGADA') continue;
clienteExistente.totalPendiente += cuota.saldoPendiente;
clienteExistente.diasAtrasoMax = Math.max(
  clienteExistente.diasAtrasoMax,
  cuota.diasAtraso
);
```

#### D. Sync en batches paralelos
```typescript
// En sync.ts, línea 150
const BATCH_SIZE = 10;
for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
  const batch = pendingItems.slice(i, i + BATCH_SIZE);
  const results = await Promise.allSettled(
    batch.map(item => processSyncItem(item))
  );
  
  // Procesar resultados...
}
```

### 3. INPUTS NUMÉRICOS EN MÓVIL

Agregar `inputMode="numeric"` a TODOS los inputs de valores:

**Archivos a modificar:**
- src/components/clientes/NuevoCliente.tsx (teléfono) ✅ YA TIENE
- src/components/cobros/RegistrarPago.tsx (monto)
- src/components/balance/Balance.tsx (valor entrada/gasto)
- src/components/creditos/OtorgarCredito.tsx (monto)
- src/components/productos/NuevoProducto.tsx (todos los números)

```tsx
<input
  type="number"
  inputMode="numeric"
  pattern="[0-9]*"
  // ...
/>
```

### 4. SERVICE WORKER PARA PWA

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

1. **CRÍTICO** - Corregir seedData.ts (para que compile)
2. **CRÍTICO** - Optimizar useRuta (filtrar por cobrador)
3. **ALTA** - Inputs numéricos en móvil
4. **ALTA** - Estadísticas con useMemo
5. **MEDIA** - Usar campos calculados en procesarRuta
6. **MEDIA** - Sync en batches paralelos
7. **BAJA** - Service Worker (Fase 10)

## 📝 NOTAS:
- Todos los `rutaId: 'ruta-default'` son temporales
- En Fase 9 se reemplazarán con valores del AuthContext
- El schema de Amplify ya está actualizado y listo
- Dexie v4 ya tiene los índices optimizados
