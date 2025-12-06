# Correcciones Pendientes para rutaId

## Archivos que necesitan corrección:

### 1. src/components/cobros/RegistrarPago.tsx (línea 75)
Agregar: `rutaId: cliente.rutaId,`

### 2. src/hooks/useBalance.ts (línea 123)
Agregar: `rutaId: 'ruta-default',`

### 3. src/hooks/useBalance.ts (línea 212)
Agregar: `rutaId: 'ruta-default',` al objeto cierre

### 4. src/hooks/useCredito.ts (línea 115)
Agregar: `rutaId: 'ruta-default',` al objeto credito

### 5. src/hooks/useCredito.ts (línea 141)
Agregar: `rutaId: 'ruta-default',` y `cobradorId: 'user-1',` a cada cuota

### 6. src/lib/calculos.test.ts (línea 21)
Agregar: `rutaId: 'test-ruta',` y `cobradorId: 'test-cobrador',`

### 7. src/lib/calculos.test.ts (línea 41)
Agregar: `rutaId: 'test-ruta',`

### 8. src/lib/seedData.ts
Agregar `rutaId: 'ruta-default',` a todos los clientes (5 lugares)
Agregar `rutaId: 'ruta-default',` a todos los créditos
Agregar `rutaId: 'ruta-default',` y `cobradorId` a todas las cuotas

## Valor por defecto temporal:
- rutaId: 'ruta-default'
- cobradorId: 'cobrador-demo' o 'user-1'

Estos valores se reemplazarán en Fase 9 con valores reales del contexto de autenticación.
