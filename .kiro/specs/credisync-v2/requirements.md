# CrediSync360 V2 - Documento de Requisitos

**Fecha:** 5 de diciembre de 2025  
**Versión:** 2.0 (Formato EARS)  
**Estado:** En Revisión

---

## Introducción

CrediSync360 V2 es una aplicación web progresiva (PWA) diseñada para cobradores de microcréditos que gestionan hasta 200 clientes diariamente. El sistema debe operar en modo offline-first, garantizando sincronización perfecta de datos, flujo de trabajo simplificado y performance excepcional en dispositivos móviles con conectividad intermitente.

### Objetivos Principales:
1. Consistencia de datos al 100% (cero pérdida de información)
2. Tiempo de respuesta UI menor a 100ms
3. Capacidad de procesar 200 clientes por día por cobrador
4. Arquitectura multitenant desde el inicio
5. Sincronización automática en background

---

## Glossario

### Términos de Negocio

- **Cobrador:** Usuario del sistema que visita clientes para cobrar cuotas y otorgar créditos
- **Cliente:** Persona que recibe microcréditos y debe pagar cuotas periódicas
- **Crédito:** Préstamo otorgado a un cliente con interés y plazo definido
- **Cuota:** Pago periódico programado que el cliente debe realizar
- **Pago:** Transacción monetaria registrada cuando el cliente abona dinero
- **Producto de Crédito:** Plantilla de crédito con parámetros predefinidos (interés, plazo, frecuencia)
- **Ruta del Día:** Lista de clientes que el cobrador debe visitar en una jornada
- **Mora:** Estado de un crédito cuando tiene cuotas vencidas sin pagar
- **Saldo Pendiente:** Monto total que falta por pagar de un crédito
- **Cierre de Caja:** Proceso de consolidación de cobros al final del día
- **Tenant:** Organización o empresa que usa el sistema (multitenant)

### Términos Técnicos

- **PWA (Progressive Web App):** Aplicación web que funciona como app nativa
- **Offline-First:** Arquitectura donde la app funciona sin conexión a internet
- **IndexedDB:** Base de datos local del navegador para almacenamiento offline
- **Sync Queue:** Cola de operaciones pendientes de sincronización
- **AppSync:** Servicio de AWS para APIs GraphQL
- **DynamoDB:** Base de datos NoSQL de AWS
- **Cognito:** Servicio de autenticación de AWS
- **Calculated Property:** Valor derivado calculado en tiempo real (no almacenado)
- **Immutable Data:** Datos que nunca se modifican, solo se agregan nuevos registros

---

## Requisitos Funcionales

### Requisito 1: Gestión de Ruta del Día

**User Story:** Como cobrador, quiero ver mi ruta del día con todos los clientes que debo visitar, para organizar mi trabajo y maximizar cobros.

#### Acceptance Criteria

1.1. WHEN the Cobrador opens the application, THE System SHALL display the daily route screen as the default view

1.2. WHEN the daily route loads, THE System SHALL display the total amount collected today at the top of the screen

1.3. WHEN the daily route loads, THE System SHALL display the count of collected installments and pending installments

1.4. WHEN the System displays the daily route, THE System SHALL group multiple overdue installments from the same Cliente into a single card

1.5. WHEN a Cliente has multiple overdue installments, THE System SHALL display the total number of overdue installments and the total amount on the card

1.6. WHEN the System displays the daily route, THE System SHALL show overdue clients first, ordered by days overdue descending

1.7. WHEN the System displays the daily route, THE System SHALL show clients with installments due today after overdue clients

1.8. WHEN the Cobrador drags a client card to a new position, THE System SHALL reorder the route and persist the new order locally

1.9. WHEN the daily route contains more than 50 client cards, THE System SHALL implement virtual scrolling for performance

1.10. WHEN a client card is displayed, THE System SHALL show the Cliente name, overdue installments count, total amount due, payment frequency, and address

---

### Requisito 2: Registro de Pagos

**User Story:** Como cobrador, quiero registrar pagos de clientes de forma rápida y precisa, para mantener actualizado el estado de las cuentas.

#### Acceptance Criteria

2.1. WHEN the Cobrador clicks on a client card, THE System SHALL open the payment registration modal

2.2. WHEN the payment modal opens, THE System SHALL display the Cliente name, credit details, and pending balance

2.3. WHEN the payment modal opens, THE System SHALL pre-fill the payment amount with the total pending balance

2.4. WHEN the Cobrador enters a payment amount, THE System SHALL validate that the amount is greater than zero

2.5. WHEN the Cobrador confirms a payment, THE System SHALL capture the current GPS location

2.6. WHEN the Cobrador confirms a payment, THE System SHALL save the Pago to IndexedDB immediately

2.7. WHEN a Pago is saved locally, THE System SHALL add the operation to the Sync Queue

2.8. WHEN a Pago is saved, THE System SHALL update the UI immediately without waiting for server sync

2.9. WHEN a payment amount is less than the total pending balance, THE System SHALL distribute the payment across installments in chronological order

2.10. WHEN a payment amount covers multiple installments, THE System SHALL mark completed installments as paid and partially paid installments with the remaining amount

2.11. WHEN a Pago is registered, THE System SHALL allow optional observations text up to 500 characters

2.12. WHEN the payment registration completes, THE System SHALL close the modal and update the daily route display

---

### Requisito 3: Búsqueda y Gestión de Clientes

**User Story:** Como cobrador, quiero buscar y gestionar información de clientes, para acceder rápidamente a sus datos y historial.

#### Acceptance Criteria

3.1. WHEN the Cobrador navigates to the clients screen, THE System SHALL display a search input at the top

3.2. WHEN the Cobrador types in the search input, THE System SHALL filter clients by name, document number, or phone number in real-time

3.3. WHEN the search returns results, THE System SHALL display client cards with name, document, phone, status, pending balance, and active credits count

3.4. WHEN a Cliente has overdue installments, THE System SHALL display the card with a red indicator and "MORA" status

3.5. WHEN a Cliente has no overdue installments, THE System SHALL display the card with a green indicator and "AL DÍA" status

3.6. WHEN the Cobrador clicks on a client card, THE System SHALL navigate to the client detail screen

3.7. WHEN the clients list contains more than 50 items, THE System SHALL implement virtual scrolling for performance

3.8. WHEN the Cobrador clicks the "New Client" button, THE System SHALL open the client creation form

---

### Requisito 4: Detalle de Cliente

**User Story:** Como cobrador, quiero ver el detalle completo de un cliente, para entender su historial crediticio y tomar decisiones informadas.

#### Acceptance Criteria

4.1. WHEN the client detail screen loads, THE System SHALL display the Cliente personal information including name, document, phone, address, neighborhood, and reference

4.2. WHEN the client detail screen loads, THE System SHALL display the count of active credits

4.3. WHEN the client detail screen loads, THE System SHALL calculate and display the Cliente overall status (MORA or AL DÍA)

4.4. WHEN the client detail screen loads, THE System SHALL display the credit history summary including total credits, paid credits, and credits in mora

4.5. WHEN the client detail screen loads, THE System SHALL calculate and display the Cliente score (CONFIABLE, REGULAR, or RIESGOSO)

4.6. WHEN a Cliente has 3 or more paid credits with zero days overdue, THE System SHALL assign the score "CONFIABLE"

4.7. WHEN a Cliente has more credits with mora than credits paid on time, THE System SHALL assign the score "RIESGOSO"

4.8. WHEN a Cliente does not meet criteria for CONFIABLE or RIESGOSO, THE System SHALL assign the score "REGULAR"

4.9. WHEN the client detail screen loads, THE System SHALL display all active credits with their details including product name, amounts, installments, pending balance, and overdue installments

4.10. WHEN the Cobrador clicks "Grant New Credit" button, THE System SHALL navigate to the credit granting screen

---

### Requisito 5: Otorgar Crédito

**User Story:** Como cobrador, quiero otorgar nuevos créditos a clientes, para expandir la cartera y generar ingresos.

#### Acceptance Criteria

5.1. WHEN the credit granting screen loads, THE System SHALL display a list of available Producto de Crédito options

5.2. WHEN the Cobrador selects a Producto de Crédito, THE System SHALL display the product details including interest rate, number of installments, and frequency

5.3. WHEN the Cobrador enters a loan amount, THE System SHALL validate that the amount is within the product minimum and maximum limits

5.4. WHEN the Cobrador enters a loan amount, THE System SHALL calculate and display the interest amount, total to pay, and installment value

5.5. WHEN the credit granting screen loads, THE System SHALL pre-fill the disbursement date with today's date

5.6. WHEN the credit granting screen loads, THE System SHALL pre-fill the first installment date with tomorrow's date

5.7. WHEN the Cobrador modifies the first installment date, THE System SHALL allow the date to be changed

5.8. WHEN the System calculates installment dates with DIARIO frequency, THE System SHALL skip Sundays and move to Monday

5.9. WHEN the Cobrador clicks "View Installment Table", THE System SHALL display all installment dates and amounts

5.10. WHEN the Cobrador confirms the credit, THE System SHALL create the Crédito record in IndexedDB

5.11. WHEN a Crédito is created, THE System SHALL generate all Cuota records with calculated dates

5.12. WHEN a Crédito is created, THE System SHALL add the operation to the Sync Queue

5.13. WHEN the credit creation completes, THE System SHALL navigate back to the client detail screen

---

### Requisito 6: Balance y Cierre de Caja

**User Story:** Como cobrador, quiero gestionar el balance de caja durante el día y realizar el cierre al final, para consolidar mis cobros y reportar resultados.

#### Acceptance Criteria

6.1. WHEN the Cobrador navigates to the cash closing screen, THE System SHALL display today's date and current cash status (OPEN or CLOSED)

6.2. WHEN the cash closing screen loads, THE System SHALL calculate and display the base cash from the previous day's closing

6.3. WHEN the cash closing screen loads, THE System SHALL calculate and display the total amount collected today

6.4. WHEN the cash closing screen loads, THE System SHALL calculate and display total credits granted today

6.5. WHEN the cash closing screen loads, THE System SHALL display entries/investments with ability to add and delete before closing

6.6. WHEN the cash closing screen loads, THE System SHALL display expenses/withdrawals with ability to add and delete before closing

6.7. WHEN the Cobrador adds an entry or expense, THE System SHALL save it immediately to IndexedDB

6.8. WHEN the Cobrador deletes an entry or expense, THE System SHALL remove it from IndexedDB only if cash is OPEN

6.9. WHEN the cash closing screen loads, THE System SHALL calculate total cash as: Base + Collected - Credits + Entries - Expenses

6.10. WHEN the Cobrador clicks "Confirm Closing", THE System SHALL save the closing record to IndexedDB and mark cash as CLOSED

6.11. WHEN the cash is CLOSED, THE System SHALL display a "Reopen Cash" button

6.12. WHEN the Cobrador clicks "Reopen Cash", THE System SHALL delete the closing record and mark cash as OPEN (TODO: restrict to administrators in Phase 9)

---

### Requisito 7: Sincronización Offline-First

**User Story:** Como cobrador, quiero que la aplicación funcione sin conexión a internet, para trabajar en zonas con cobertura limitada.

#### Acceptance Criteria

7.1. WHEN the Cobrador performs any operation, THE System SHALL save the data to IndexedDB immediately

7.2. WHEN an operation is saved locally, THE System SHALL add the operation to the Sync Queue with status PENDING

7.3. WHEN the device has internet connection, THE System SHALL attempt to sync pending operations every 30 seconds

7.4. WHEN a sync operation succeeds, THE System SHALL update the Sync Queue item status to SYNCED

7.5. WHEN a sync operation fails, THE System SHALL increment the retry counter and keep status as PENDING

7.6. WHEN a sync operation fails 5 times, THE System SHALL mark the item as FAILED and notify the Cobrador

7.7. WHEN the System detects a conflict between local and server data, THE System SHALL apply the server version as the source of truth

7.8. WHEN a conflict is resolved, THE System SHALL update the local IndexedDB with the server data

7.9. WHEN the device goes offline, THE System SHALL continue operating normally using local data

7.10. WHEN the device comes back online, THE System SHALL automatically resume synchronization

---

### Requisito 8: Autenticación y Seguridad

**User Story:** Como administrador del sistema, quiero que los usuarios se autentiquen de forma segura, para proteger los datos de la organización.

#### Acceptance Criteria

8.1. WHEN a user accesses the application, THE System SHALL require authentication via email and password

8.2. WHEN a user logs in successfully, THE System SHALL retrieve the user's tenantId from Cognito custom attributes

8.3. WHEN a user logs in successfully, THE System SHALL retrieve the user's role from Cognito custom attributes

8.4. WHEN the System loads data from IndexedDB, THE System SHALL filter all records by the user's tenantId

8.5. WHEN the System syncs data to the server, THE System SHALL include the tenantId in all requests

8.6. WHEN the System queries DynamoDB, THE System SHALL filter all queries by the partition key tenantId

8.7. WHEN a user session expires, THE System SHALL redirect to the login screen

8.8. WHEN a user logs out, THE System SHALL clear all local data from IndexedDB

---

## Requisitos No Funcionales

### Requisito 9: Performance

**User Story:** Como cobrador, quiero que la aplicación responda instantáneamente, para no perder tiempo durante mi jornada laboral.

#### Acceptance Criteria

9.1. WHEN the application loads for the first time, THE System SHALL display the main screen in less than 2 seconds

9.2. WHEN the Cobrador performs any UI interaction, THE System SHALL respond in less than 100 milliseconds

9.3. WHEN the daily route displays 200 client cards, THE System SHALL maintain smooth scrolling at 60 frames per second

9.4. WHEN the Cobrador searches for clients, THE System SHALL display filtered results in less than 50 milliseconds

9.5. WHEN the System saves data to IndexedDB, THE System SHALL complete the operation in less than 50 milliseconds

---

### Requisito 10: Escalabilidad

**User Story:** Como administrador del sistema, quiero que la aplicación soporte múltiples organizaciones y miles de usuarios, para crecer el negocio.

#### Acceptance Criteria

10.1. WHEN the System is deployed, THE System SHALL support at least 1000 concurrent Cobradores

10.2. WHEN the System stores data in DynamoDB, THE System SHALL partition data by tenantId for isolation

10.3. WHEN the System processes transactions, THE System SHALL handle at least 1 million transactions per month

10.4. WHEN the System stores client data, THE System SHALL support at least 200,000 total Clientes across all tenants

10.5. WHEN a new tenant is added, THE System SHALL isolate their data completely from other tenants

---

### Requisito 11: Confiabilidad

**User Story:** Como administrador del sistema, quiero que la aplicación sea confiable y no pierda datos, para mantener la confianza de los usuarios.

#### Acceptance Criteria

11.1. WHEN the System is in production, THE System SHALL maintain 99.9% uptime

11.2. WHEN the System processes any operation, THE System SHALL guarantee zero data loss

11.3. WHEN the System syncs data to the server, THE System SHALL guarantee 100% synchronization success rate

11.4. WHEN the System encounters an error, THE System SHALL log the error details for debugging

11.5. WHEN the System detects data corruption, THE System SHALL alert the administrator immediately

---

## Métricas de Éxito

### Métricas Operacionales:
- Cobrador procesa 200 clientes por día
- Tiempo promedio por cobro: < 2 minutos
- Errores de usuario: < 1%

### Métricas Técnicas:
- Bugs críticos: 0
- Tiempo de sincronización: < 5 segundos
- Uso de batería: Bajo (< 10% por hora)

### Métricas de Negocio:
- Satisfacción de usuario: > 4.5/5
- Tiempo de entrenamiento: < 1 hora
- Tasa de adopción: > 95%

---

**Próximo Documento:** design.md - Diseño técnico y Correctness Properties
