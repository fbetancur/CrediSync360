# CrediSync360 V2 - Plan de Implementación

## 🎯 Objetivo

Construir la app de microcréditos más simple y eficiente del mundo en 2 semanas.

---

## 📅 Cronograma (10 días hábiles)

### SEMANA 1: Setup + MVP

#### Día 1: Setup del Proyecto (4 horas)
**Objetivo:** Proyecto base funcionando

**Tareas:**
1. Crear proyecto con Vite + React + TypeScript
   ```bash
   npm create vite@latest credisync-v2 -- --template react-ts
   cd credisync-v2
   npm install
   ```

2. Instalar dependencias
   ```bash
   npm install dexie date-fns react-window react-beautiful-dnd
   npm install -D tailwindcss postcss autoprefixer
   npm install @aws-amplify/ui-react aws-amplify
   ```

3. Configurar Tailwind CSS
   ```bash
   npx tailwindcss init -p
   ```

4. Configurar AWS Amplify Gen2
   ```bash
   npm create amplify@latest
   ```

**Entregable:** Proyecto base con Amplify configurado

---

#### Día 2: Base de Datos Local (6 horas)
**Objetivo:** IndexedDB funcionando con Dexie

**Tareas:**
1. Crear `src/lib/db.ts` con schema completo
2. Crear funciones puras en `src/lib/calculos.ts`
3. Crear tipos en `src/types/index.ts`
4. Tests unitarios para funciones puras

**Archivos a crear:**
- `src/lib/db.ts` (150 líneas)
- `src/lib/calculos.ts` (300 líneas)
- `src/types/index.ts` (100 líneas)
- `src/lib/calculos.test.ts` (200 líneas)

**Entregable:** Base de datos local funcionando con tests

---

#### Día 3: Hook de Ruta (6 horas)
**Objetivo:** Hook que carga ruta del día

**Tareas:**
1. Crear `src/hooks/useRuta.ts`
2. Implementar lógica de carga
3. Implementar cálculos de estado
4. Implementar ordenamiento

**Archivo a crear:**
- `src/hooks/useRuta.ts` (200 líneas)

**Entregable:** Hook funcionando con datos de prueba

---

#### Día 4: Pantalla Principal - Cobros (8 horas)
**Objetivo:** Pantalla de ruta del día funcionando

**Tareas:**
1. Crear `src/components/cobros/RutaDelDia.tsx`
2. Crear `src/components/cobros/ClienteCard.tsx`
3. Implementar resumen (total, cuotas cobradas, pendientes)
4. Implementar lista de tarjetas
5. Implementar drag & drop para reordenar

**Archivos a crear:**
- `src/components/cobros/RutaDelDia.tsx` (250 líneas)
- `src/components/cobros/ClienteCard.tsx` (150 líneas)

**Entregable:** Pantalla principal funcionando

---

#### Día 5: Registrar Pago (8 horas)
**Objetivo:** Flujo completo de cobro funcionando

**Tareas:**
1. Crear `src/components/cobros/RegistrarPago.tsx`
2. Crear `src/hooks/useCobro.ts`
3. Implementar distribución de pagos
4. Implementar captura de ubicación
5. Implementar transacción atómica

**Archivos a crear:**
- `src/components/cobros/RegistrarPago.tsx` (200 líneas)
- `src/hooks/useCobro.ts` (150 líneas)

**Entregable:** Flujo de cobro completo funcionando

---

### SEMANA 2: Features + Polish

#### Día 6: Pantalla de Clientes (6 horas)
**Objetivo:** Buscar y ver clientes

**Tareas:**
1. Crear `src/components/clientes/ClientesList.tsx`
2. Crear `src/components/clientes/ClienteCard.tsx`
3. Implementar buscador
4. Implementar lista con virtualización

**Archivos a crear:**
- `src/components/clientes/ClientesList.tsx` (200 líneas)
- `src/components/clientes/ClienteCard.tsx` (100 líneas)
- `src/hooks/useClientes.ts` (100 líneas)

**Entregable:** Pantalla de clientes funcionando

---

#### Día 7: Detalle Cliente + Otorgar Crédito (8 horas)
**Objetivo:** Ver detalle y otorgar créditos

**Tareas:**
1. Crear `src/components/clientes/ClienteDetail.tsx`
2. Crear `src/components/creditos/OtorgarCredito.tsx`
3. Implementar cálculo de cuotas
4. Implementar fecha primera cuota editable
5. Implementar tabla de cuotas

**Archivos a crear:**
- `src/components/clientes/ClienteDetail.tsx` (250 líneas)
- `src/components/creditos/OtorgarCredito.tsx` (300 líneas)
- `src/hooks/useCredito.ts` (150 líneas)

**Entregable:** Flujo completo de otorgar crédito

---

#### Día 8: Cierre de Caja + Sincronización (8 horas)
**Objetivo:** Cierre de caja y sync con AWS

**Tareas:**
1. Crear `src/components/cierre/CierreCaja.tsx`
2. Crear `src/lib/sync.ts`
3. Implementar cola de sincronización
4. Implementar background sync
5. Configurar AppSync + DynamoDB

**Archivos a crear:**
- `src/components/cierre/CierreCaja.tsx` (200 líneas)
- `src/lib/sync.ts` (250 líneas)
- `amplify/data/resource.ts` (150 líneas)

**Entregable:** Sincronización funcionando

---

#### Día 9: PWA + Testing (8 horas)
**Objetivo:** App instalable y testeada

**Tareas:**
1. Configurar service worker con Workbox
2. Crear manifest.json
3. Tests de integración
4. Tests E2E con Playwright
5. Optimizaciones de performance

**Archivos a crear:**
- `public/manifest.json`
- `src/sw.ts` (service worker)
- Tests de integración

**Entregable:** PWA funcionando offline

---

#### Día 10: Polish + Deploy (8 horas)
**Objetivo:** App en producción

**Tareas:**
1. Animaciones y transiciones
2. Loading states
3. Error handling
4. Documentación
5. Deploy a AWS Amplify Hosting

**Entregable:** App en producción

---

## 📦 Estructura Final del Proyecto

```
credisync-v2/
├── amplify/
│   ├── auth/
│   │   └── resource.ts              # Cognito
│   ├── data/
│   │   └── resource.ts              # AppSync + DynamoDB
│   ├── functions/
│   │   ├── sync/
│   │   │   └── handler.ts           # Lambda sync
│   │   └── reports/
│   │       └── handler.ts           # Lambda reports
│   └── backend.ts
│
├── public/
│   ├── manifest.json
│   └── icons/
│
├── src/
│   ├── components/
│   │   ├── cobros/
│   │   │   ├── RutaDelDia.tsx       # Pantalla principal
│   │   │   ├── ClienteCard.tsx      # Tarjeta de cliente
│   │   │   └── RegistrarPago.tsx    # Modal de pago
│   │   ├── clientes/
│   │   │   ├── ClientesList.tsx     # Lista de clientes
│   │   │   ├── ClienteCard.tsx      # Tarjeta de cliente
│   │   │   └── ClienteDetail.tsx    # Detalle del cliente
│   │   ├── creditos/
│   │   │   └── OtorgarCredito.tsx   # Formulario de crédito
│   │   ├── cierre/
│   │   │   └── CierreCaja.tsx       # Cierre de caja
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/
│   │   ├── useRuta.ts               # Hook ruta del día
│   │   ├── useCobro.ts              # Hook registrar pago
│   │   ├── useClientes.ts           # Hook lista clientes
│   │   ├── useCliente.ts            # Hook detalle cliente
│   │   └── useCredito.ts            # Hook otorgar crédito
│   │
│   ├── lib/
│   │   ├── db.ts                    # Dexie setup
│   │   ├── calculos.ts              # Funciones puras
│   │   ├── sync.ts                  # Sync manager
│   │   └── utils.ts                 # Utilidades
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   │
│   ├── App.tsx                      # App principal
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Estilos globales
│   └── sw.ts                        # Service worker
│
├── tests/
│   ├── unit/
│   │   └── calculos.test.ts
│   ├── integration/
│   │   └── cobro.test.ts
│   └── e2e/
│       └── flujo-completo.spec.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest):
```typescript
// tests/unit/calculos.test.ts
describe('calcularSaldoPendiente', () => {
  it('debe calcular correctamente', () => {
    const cuotas = [
      { id: '1', montoProgramado: 60 },
      { id: '2', montoProgramado: 60 }
    ];
    const pagos = [
      { id: 'p1', cuotaId: '1', monto: 60 }
    ];
    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(60);
  });
});
```

### Integration Tests:
```typescript
// tests/integration/cobro.test.ts
describe('Flujo de cobro', () => {
  it('debe registrar pago y actualizar estado', async () => {
    // Setup
    await db.clientes.add(clienteTest);
    await db.creditos.add(creditoTest);
    await db.cuotas.bulkAdd(cuotasTest);
    
    // Registrar pago
    await registrarPago({ monto: 60, cuotaId: 'cuota-1' });
    
    // Verificar
    const pagos = await db.pagos.toArray();
    expect(pagos).toHaveLength(1);
    expect(pagos[0].monto).toBe(60);
  });
});
```

### E2E Tests (Playwright):
```typescript
// tests/e2e/flujo-completo.spec.ts
test('flujo completo: crear cliente → otorgar crédito → cobrar', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('[name="email"]', 'test@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Crear cliente
  await page.click('text=Clientes');
  await page.click('text=Nuevo Cliente');
  await page.fill('[name="nombre"]', 'Juan Pérez');
  await page.fill('[name="documento"]', '12345678');
  await page.click('text=Guardar');
  
  // Otorgar crédito
  await page.click('text=Juan Pérez');
  await page.click('text=Otorgar Crédito');
  await page.fill('[name="monto"]', '1000');
  await page.click('text=Confirmar');
  
  // Cobrar
  await page.click('text=Cobros');
  await page.click('text=Juan Pérez');
  await page.fill('[name="monto"]', '60');
  await page.click('text=Confirmar Pago');
  
  // Verificar
  await expect(page.locator('text=Pago registrado')).toBeVisible();
});
```

---

## 🚀 Deploy a Producción

### 1. Build:
```bash
npm run build
```

### 2. Deploy Amplify:
```bash
npx amplify sandbox deploy
```

### 3. Deploy Frontend:
```bash
npx amplify hosting deploy
```

### 4. Configurar Dominio:
```bash
# En AWS Console
# Amplify > App > Domain management
# Agregar dominio personalizado
```

---

## 📊 Métricas de Éxito

### Performance:
- ✅ Lighthouse Score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Smooth scroll con 200 items

### Funcionalidad:
- ✅ Todos los flujos funcionando
- ✅ Sincronización offline-first
- ✅ 0 bugs críticos
- ✅ Tests passing al 100%

### UX:
- ✅ Diseño hermoso y consistente
- ✅ Animaciones suaves
- ✅ Feedback visual claro
- ✅ Fácil de usar

---

## 🎯 Checklist Final

### Funcionalidad:
- [ ] Crear cliente
- [ ] Buscar cliente
- [ ] Ver detalle cliente
- [ ] Otorgar crédito
- [ ] Ver ruta del día
- [ ] Registrar pago
- [ ] Pago parcial
- [ ] Pago múltiples cuotas
- [ ] Cierre de caja
- [ ] Sincronización offline
- [ ] Resolución de conflictos

### UI/UX:
- [ ] Diseño responsive
- [ ] Animaciones suaves
- [ ] Loading states
- [ ] Error handling
- [ ] Feedback visual
- [ ] Drag & drop
- [ ] Búsqueda instantánea

### Performance:
- [ ] Virtualización de listas
- [ ] Lazy loading
- [ ] Memoización
- [ ] Service worker
- [ ] Cache estratégico

### Testing:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

### Deploy:
- [ ] Build exitoso
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Deploy a producción
- [ ] Monitoreo activo

---

## 💡 Próximos Pasos

1. **Revisar esta especificación completa**
2. **Aprobar el plan**
3. **Empezar Día 1: Setup del proyecto**

¿Listo para empezar?
