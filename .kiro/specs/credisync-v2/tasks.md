# CrediSync360 V2 - Plan de Implementación

**Fecha:** 5 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** Listo para Ejecución

---

## Instrucciones

Este documento contiene la lista de tareas para implementar CrediSync360 V2. Cada tarea debe ejecutarse en orden, y algunas tienen sub-tareas que deben completarse primero.

**Convenciones:**
- `[ ]` - Tarea pendiente
- `[x]` - Tarea completada
- `*` - Tarea opcional (puede omitirse para MVP)
- Cada tarea referencia requisitos específicos del requirements.md

---

## Fase 1: Setup y Configuración

### [x] 1. Configurar Tailwind CSS
- Instalar Tailwind CSS y sus dependencias
- Configurar `tailwind.config.js`
- Agregar directivas de Tailwind a `index.css`
- Verificar que los estilos funcionen
- _Requirements: 9.1, 9.2_

### [x] 2. Configurar Amplify Backend con modelos reales
- [x] 2.1 Actualizar schema de datos en `amplify/data/resource.ts`
  - Reemplazar modelo Todo por Cliente, Credito, Cuota, Pago
  - Definir relaciones entre modelos
  - Configurar authorization rules con tenantId
  - _Requirements: 8.4, 8.5, 8.6, 10.2_

- [x] 2.2 Actualizar configuración de Auth in `amplify/auth/resource.ts`
  - Agregar custom attributes: tenantId, role
  - Configurar email verification
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2.3 Deploy del backend actualizado
  - Ejecutar `npx amplify sandbox deploy`
  - Verificar que los modelos se crearon correctamente
  - _Requirements: 10.1_

---

## Fase 2: Base de Datos Local y Lógica de Negocio

### [x] 3. Implementar Dexie database
- [x] 3.1 Crear schema de Dexie en `src/lib/db.ts`
  - Definir tablas: clientes, creditos, cuotas, pagos, productos, syncQueue
  - Configurar índices compuestos para queries optimizadas
  - Exportar instancia de base de datos
  - _Requirements: 7.1, 9.5_

- [x] 3.2 Crear tipos TypeScript en `src/types/index.ts`
  - Definir interfaces para todas las entidades
  - Definir tipos para estados calculados
  - Definir tipos para sync queue
  - _Requirements: All_

### [x] 4. Implementar funciones puras de cálculo
- [x] 4.1 Crear `src/lib/calculos.ts` con funciones de cálculo
  - `calcularSaldoPendiente(cuotas, pagos): number`
  - `calcularDiasAtraso(cuotas, pagos): number`
  - `distribuirPago(monto, cuotas, pagos): Distribution[]`
  - `calcularEstadoCuota(cuota, pagos): EstadoCuota`
  - `calcularEstadoCredito(credito, cuotas, pagos): EstadoCredito`
  - `calcularScore(cliente, creditos, cuotas, pagos): Score`
  - `generarFechasCuotas(...): string[]`
  - _Requirements: 2.9, 2.10, 4.5, 4.6, 4.7, 4.8, 5.8, 5.11_

- [x]* 4.2 Escribir tests unitarios para funciones de cálculo
  - Test para calcularSaldoPendiente con diferentes escenarios
  - Test para distribuirPago con pagos completos y parciales
  - Test para calcularScore con diferentes historiales
  - Test para generarFechasCuotas excluyendo domingos
  - _Requirements: 2.9, 2.10, 4.5, 5.8_

- [x]* 4.3 Escribir property test para distribución de pagos
  - **Property 5: Payment Distribution Correctness**
  - **Validates: Requirements 2.9, 2.10**
  - Generar montos y cuotas aleatorias
  - Verificar que suma de distribución = monto pagado
  - Verificar que no hay montos negativos
  - Verificar que ninguna cuota recibe más de su saldo
  - _Requirements: 2.9, 2.10_

- [x]* 4.4 Escribir property test para cálculo de saldo
  - **Property 7: Balance Calculation Consistency**
  - **Validates: Requirements 2.2, 4.9**
  - Generar créditos, cuotas y pagos aleatorios
  - Verificar que saldo = suma(cuotas) - suma(pagos)
  - _Requirements: 2.2, 4.9_

### [x] 5. Checkpoint - Verificar base de datos y cálculos
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 3: Sincronización Offline-First

### [x] 6. Implementar Sync Manager
- [x] 6.1 Crear `src/lib/sync.ts` con lógica de sincronización
  - Función para agregar operaciones a sync queue
  - Función para procesar sync queue cada 30s
  - Función para manejar reintentos con backoff exponencial
  - Función para resolver conflictos (servidor gana)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 6.2 Implementar background sync con setInterval
  - Verificar conexión a internet
  - Procesar items PENDING en orden FIFO
  - Actualizar status a SYNCED o incrementar retries
  - _Requirements: 7.3, 7.4, 7.5_

- [ ]* 6.3 Escribir property test para FIFO ordering
  - **Property 14: Sync Queue FIFO Ordering**
  - **Validates: Requirements 7.2, 7.3**
  - Generar secuencia de operaciones aleatorias
  - Verificar que se sincronizan en el mismo orden
  - _Requirements: 7.2, 7.3_

---

## Fase 4: Pantalla Principal - Ruta del Día

### [x] 7. Implementar hook useRuta
- [x] 7.1 Crear `src/hooks/useRuta.ts`
  - Cargar cuotas del día desde Dexie
  - Cargar clientes, créditos y pagos relacionados
  - Calcular estado de cada cliente (saldo, días atraso)
  - Agrupar cuotas atrasadas por cliente
  - Ordenar: atrasados primero, luego del día
  - Implementar función de reordenamiento
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ]* 7.2 Escribir property test para agrupación de cuotas
  - **Property 2: Overdue Grouping Consistency**
  - **Validates: Requirements 1.4, 1.5**
  - Generar clientes con múltiples cuotas atrasadas
  - Verificar que aparece 1 sola tarjeta por cliente
  - Verificar que muestra total correcto
  - _Requirements: 1.4, 1.5_

- [ ]* 7.3 Escribir property test para ordenamiento de ruta
  - **Property 3: Route Ordering Invariant**
  - **Validates: Requirements 1.6, 1.7**
  - Generar ruta con clientes atrasados y al día
  - Verificar que atrasados aparecen primero
  - Verificar orden por días de atraso descendente
  - _Requirements: 1.6, 1.7_

### [x] 8. Implementar componente RutaDelDia
- [x] 8.1 Crear `src/components/cobros/RutaDelDia.tsx`
  - Usar hook useRuta para cargar datos
  - Mostrar resumen: total recaudado, cuotas cobradas/pendientes
  - Renderizar lista de clientes con react-window (virtualización)
  - Implementar drag & drop con react-beautiful-dnd
  - Manejar loading y error states
  - _Requirements: 1.1, 1.2, 1.3, 1.9_

- [x] 8.2 Crear `src/components/cobros/ClienteCard.tsx`
  - Mostrar nombre, cuotas atrasadas, monto, frecuencia, dirección
  - Indicador visual de estado (rojo=mora, verde=al día)
  - Click handler para abrir modal de pago
  - _Requirements: 1.10_

- [ ]* 8.3 Escribir tests de componente para RutaDelDia
  - Test de renderizado con datos mock
  - Test de virtualización con 200+ items
  - Test de drag & drop
  - _Requirements: 1.9_

### [x] 9. Checkpoint - Verificar pantalla de cobros
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 5: Registro de Pagos

### [x] 10. Implementar hook useCobro
- [x] 10.1 Crear `src/hooks/useCobro.ts`
  - Función registrarPago que guarda en Dexie
  - Función que agrega operación a sync queue
  - Función distribuirPago usando calculos.ts
  - Captura de ubicación GPS
  - Manejo de errores
  - _Requirements: 2.1, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [ ]* 10.2 Escribir property test para idempotencia de pagos
  - **Property 6: Payment Idempotency**
  - **Validates: Requirements 2.6, 2.7**
  - Intentar guardar el mismo pago múltiples veces
  - Verificar que solo existe 1 registro
  - _Requirements: 2.6, 2.7_

### [x] 11. Implementar componente RegistrarPago
- [x] 11.1 Crear `src/components/cobros/RegistrarPago.tsx`
  - Modal con información del cliente y crédito
  - Input de monto pre-llenado con saldo pendiente
  - Validación de monto > 0
  - Textarea para observaciones (max 500 chars)
  - Mostrar ubicación capturada
  - Botones Cancelar y Confirmar
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.11, 2.12_

- [ ]* 11.2 Escribir tests de componente para RegistrarPago
  - Test de validación de monto
  - Test de captura de ubicación
  - Test de confirmación exitosa
  - _Requirements: 2.4, 2.5_

### [ ] 12. Checkpoint - Verificar flujo de cobro completo
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 6: Gestión de Clientes

### [x] 13. Implementar hook useClientes
- [x] 13.1 Crear `src/hooks/useClientes.ts`
  - Cargar todos los clientes del tenant
  - Implementar búsqueda en tiempo real (nombre, doc, teléfono)
  - Calcular estado de cada cliente (mora, al día)
  - Debounce de búsqueda (300ms)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 13.2 Escribir property test para búsqueda completa
  - **Property 9: Client Search Completeness**
  - **Validates: Requirements 3.2**
  - Generar lista de clientes aleatorios
  - Generar query de búsqueda
  - Verificar que todos los matches aparecen
  - _Requirements: 3.2_

### [x] 14. Implementar componente ClientesList
- [x] 14.1 Crear `src/components/clientes/ClientesList.tsx`
  - Input de búsqueda en la parte superior
  - Lista virtualizada de clientes (react-window)
  - Botón "Nuevo Cliente"
  - Click en tarjeta navega a detalle
  - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_

- [x] 14.2 Crear `src/components/clientes/ClienteCard.tsx`
  - Mostrar nombre, documento, teléfono
  - Indicador de estado (mora/al día)
  - Mostrar saldo pendiente y créditos activos
  - _Requirements: 3.3, 3.4, 3.5_

### [x] 15. Implementar componente ClienteDetail
- [x] 15.1 Crear `src/components/clientes/ClienteDetail.tsx`
  - Mostrar información personal completa
  - Mostrar count de créditos activos
  - Calcular y mostrar estado general
  - Mostrar historial de créditos
  - Calcular y mostrar score del cliente
  - Listar créditos activos con detalles
  - Botón "Otorgar Nuevo Crédito"
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.9, 4.10_

- [ ]* 15.2 Escribir property test para score determinista
  - **Property 10: Client Score Determinism**
  - **Validates: Requirements 4.5, 4.6, 4.7, 4.8**
  - Generar historial de créditos aleatorio
  - Calcular score múltiples veces
  - Verificar que siempre retorna el mismo resultado
  - _Requirements: 4.5, 4.6, 4.7, 4.8_

### [x] 15.3 Implementar formulario Nuevo Cliente
- [x] 15.3.1 Crear `src/components/clientes/NuevoCliente.tsx`
  - Formulario modal con todos los campos requeridos
  - Validación de campos (nombre, documento, teléfono, dirección, barrio, referencia)
  - Captura de ubicación GPS (opcional)
  - Guardar en Dexie
  - Agregar a sync queue
  - Navegar al detalle del cliente creado
  - _Requirements: 3.6, 3.7, 3.8_

### [ ] 16. Checkpoint - Verificar gestión de clientes
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 7: Otorgar Créditos

### [x] 17. Implementar hook useCredito
- [x] 17.1 Crear `src/hooks/useCredito.ts`
  - Cargar productos de crédito disponibles
  - Función para calcular interés y cuotas
  - Función para generar fechas de cuotas
  - Función para crear crédito y cuotas en Dexie
  - Agregar operación a sync queue
  - _Requirements: 5.1, 5.4, 5.10, 5.11, 5.12_

- [ ]* 17.2 Escribir property test para generación de fechas
  - **Property 11: Installment Date Generation Correctness**
  - **Validates: Requirements 5.8**
  - Generar créditos DIARIO con excluirDomingos=true
  - Verificar que ninguna fecha cae en domingo
  - _Requirements: 5.8_

- [ ]* 17.3 Escribir property test para cálculo de crédito
  - **Property 12: Credit Calculation Accuracy**
  - **Validates: Requirements 5.4**
  - Generar montos e intereses aleatorios
  - Verificar que total = monto * (1 + interés/100)
  - Verificar que cuota = total / número de cuotas
  - _Requirements: 5.4_

### [x] 18. Implementar componente OtorgarCredito
- [x] 18.1 Crear `src/components/creditos/OtorgarCredito.tsx`
  - Selector de producto de crédito
  - Input de monto con validación (min/max)
  - Date picker para fecha de desembolso (default: hoy)
  - Date picker para fecha primera cuota (default: mañana, EDITABLE)
  - Cálculo automático de interés, total y valor cuota
  - Botón "Ver Tabla de Cuotas"
  - Botón "Confirmar"
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.13_

- [ ]* 18.2 Escribir property test para fecha primera cuota editable
  - **Property 13: First Installment Date Editability**
  - **Validates: Requirements 5.6, 5.7**
  - Generar fecha personalizada para primera cuota
  - Verificar que todas las cuotas se calculan desde esa fecha
  - _Requirements: 5.6, 5.7_

- [ ]* 18.3 Escribir tests de componente para OtorgarCredito
  - Test de validación de monto
  - Test de cálculo automático
  - Test de fecha primera cuota editable
  - _Requirements: 5.3, 5.4, 5.7_

### [ ] 19. Checkpoint - Verificar otorgamiento de créditos
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 8: Balance y Caja

### [x] 20. Implementar sistema de Balance/Caja
- [x] 20.1 Actualizar tipos en `src/types/index.ts`
  - Actualizado CierreCaja con todos los campos (cajaBase, totalCobrado, totalCreditosOtorgados, totalEntradas, totalGastos, totalCaja)
  - Creado tipo MovimientoCaja para entradas y gastos
  - Creado tipo EstadoCaja para estado en tiempo real
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 20.2 Actualizar schema de base de datos en `src/lib/db.ts`
  - Agregada tabla movimientos para entradas y gastos
  - Actualizado schema a versión 2
  - Agregados índices compuestos para queries eficientes
  - _Requirements: 6.1, 6.2_

- [x] 20.3 Crear hook `src/hooks/useBalance.ts`
  - Calcula estado de caja en tiempo real
  - Funciones: agregarMovimiento(), cerrarCaja()
  - Reactivo con useLiveQuery
  - Fórmula: Total = Base + Cobrado - Créditos + Entradas - Gastos
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 20.4 Crear componente `src/components/balance/Balance.tsx`
  - Muestra estado CAJA ABIERTA/CERRADA
  - Display de Caja Base
  - Cobrado vs Créditos en dos columnas
  - Tabla de Entradas/Inversión con botón "Agregar"
  - Tabla de Gastos/Salidas con botón "Agregar gasto"
  - Total Caja (verde si positivo, rojo si negativo)
  - Botón "Cerrar Caja" (solo cuando abierta)
  - Botón "Recargar"
  - Desglose detallado del cálculo
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [x] 20.5 Integración en navegación
  - Cambiado tab "Cierre" a "💰 Caja"
  - Actualizado App.tsx con nuevo componente
  - _Requirements: 6.1_

- [x] 20.6 Correcciones Mobile-First y Balance
  - Header fijo con sticky top-0 z-50
  - Eliminado scroll horizontal (overflow-x-hidden)
  - Caja base dinámica (total del día anterior)
  - Funcionalidad eliminar movimientos antes del cierre
  - Botones 🗑️ en tablas (solo cuando ABIERTA)
  - Tablas responsive sin scroll horizontal
  - Optimización mobile: padding reducido, fuentes más pequeñas
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2_

- [ ]* 20.7 Escribir tests de componente para Balance
  - Test de cálculos de totales
  - Test de agregar entradas y gastos
  - Test de eliminar movimientos
  - Test de confirmación de cierre
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

---

## Fase 9: Autenticación y Seguridad

### [ ] 21. Implementar autenticación
- [ ] 21.1 Crear componente de Login
  - Formulario con email y password
  - Integración con Amplify Auth
  - Manejo de errores de autenticación
  - _Requirements: 8.1_

- [ ] 21.2 Implementar AuthContext
  - Almacenar usuario autenticado
  - Extraer tenantId y role de custom attributes
  - Función de logout que limpia IndexedDB
  - Redirección a login si sesión expira
  - _Requirements: 8.2, 8.3, 8.7, 8.8_

- [ ] 21.3 Implementar filtrado por tenantId
  - Wrapper para queries de Dexie que filtra por tenantId
  - Validación en sync manager que incluye tenantId
  - _Requirements: 8.4, 8.5_

- [ ]* 21.4 Escribir property test para aislamiento de tenants
  - **Property 17: Tenant Data Isolation**
  - **Validates: Requirements 8.4, 8.5, 8.6, 10.2, 10.5**
  - Crear datos para múltiples tenants
  - Verificar que queries de tenant A no retornan datos de tenant B
  - _Requirements: 8.4, 8.5, 8.6, 10.2, 10.5_

### [ ] 22. Checkpoint - Verificar autenticación y seguridad
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 10: PWA y Optimizaciones

### [ ] 23. Configurar PWA
- [ ] 23.1 Crear `public/manifest.json`
  - Configurar nombre, iconos, colores
  - Configurar display: standalone
  - Configurar start_url
  - _Requirements: 9.1_

- [ ] 23.2 Configurar Service Worker con Workbox
  - Crear `src/sw.ts`
  - Configurar cache strategies
  - Configurar offline fallback
  - _Requirements: 7.9, 7.10_

- [ ] 23.3 Agregar iconos PWA
  - Generar iconos en múltiples tamaños
  - Agregar a `public/icons/`
  - _Requirements: 9.1_

### [ ] 24. Optimizaciones finales
- [ ] 24.1 Implementar lazy loading de rutas
  - Code splitting por pantalla
  - Suspense boundaries
  - _Requirements: 9.1, 9.2_

- [ ] 24.2 Implementar memoización
  - useMemo para cálculos costosos
  - React.memo para componentes
  - _Requirements: 9.2, 9.3_

- [ ] 24.3 Optimizar búsqueda con debounce
  - Implementar debounce de 300ms
  - _Requirements: 9.4_

- [ ]* 24.4 Escribir tests de performance
  - Test de carga inicial < 2s
  - Test de respuesta UI < 100ms
  - Test de scroll suave con 200 items
  - _Requirements: 9.1, 9.2, 9.3_

### [ ] 25. Checkpoint Final - Verificar todo el sistema
- Ensure all tests pass, ask the user if questions arise.

---

## Fase 11: Testing y Deploy

### [ ]* 26. Tests de integración
- [ ]* 26.1 Test de flujo completo: crear cliente → otorgar crédito → cobrar
  - Crear cliente nuevo
  - Otorgar crédito
  - Registrar pago
  - Verificar sincronización
  - _Requirements: All_

- [ ]* 26.2 Test de sincronización offline
  - Simular operaciones offline
  - Verificar que se agregan a sync queue
  - Simular reconexión
  - Verificar que se sincronizan
  - _Requirements: 7.1, 7.2, 7.3, 7.9, 7.10_

### [ ] 27. Deploy a producción
- [ ] 27.1 Build de producción
  - Ejecutar `npm run build`
  - Verificar que no hay errores
  - _Requirements: All_

- [ ] 27.2 Deploy de backend
  - Ejecutar `npx amplify sandbox deploy --profile production`
  - Verificar que todos los recursos se crearon
  - _Requirements: 10.1_

- [ ] 27.3 Deploy de frontend
  - Configurar Amplify Hosting
  - Deploy automático desde GitHub
  - _Requirements: 11.1_

- [ ] 27.4 Configurar monitoreo
  - CloudWatch dashboards
  - Alertas para errores críticos
  - _Requirements: 11.4_

### [ ] 28. Verificación final
- [ ] 28.1 Smoke tests en producción
  - Login funciona
  - Crear cliente funciona
  - Otorgar crédito funciona
  - Registrar pago funciona
  - Sincronización funciona
  - _Requirements: All_

- [ ] 28.2 Verificar métricas
  - Lighthouse score > 90
  - Performance < 2s carga inicial
  - Uptime 99.9%
  - _Requirements: 9.1, 11.1_

---

## Resumen de Tareas

**Total de tareas:** 28 tareas principales  
**Total de sub-tareas:** 67 sub-tareas  
**Tareas opcionales (*):** 19 sub-tareas de testing

**Distribución por fase:**
- Fase 1 (Setup): 2 tareas ✅
- Fase 2 (Base de datos): 3 tareas ✅
- Fase 3 (Sincronización): 1 tarea ✅
- Fase 4 (Ruta del día): 3 tareas ✅
- Fase 5 (Registro de pagos): 3 tareas ✅
- Fase 6 (Gestión de clientes): 4 tareas ✅
- Fase 7 (Otorgar créditos): 3 tareas ✅
- Fase 8 (Balance y caja): 1 tarea ✅
- Fase 9 (Autenticación): 2 tareas
- Fase 10 (PWA): 3 tareas
- Fase 11 (Testing y Deploy): 3 tareas

**Tiempo estimado:** 10-12 días hábiles

---

**Nota:** Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido. Sin embargo, se recomienda implementarlas para garantizar la calidad y robustez del sistema.
