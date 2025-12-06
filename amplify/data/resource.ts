import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*
 * CrediSync360 V2 - Data Schema
 * 
 * Este schema define los modelos de datos para la aplicación de microcréditos.
 * Todos los modelos incluyen tenantId para aislamiento multitenant.
 */

const schema = a.schema({
  // Modelo: Ruta
  Ruta: a
    .model({
      tenantId: a.string().required(),
      nombre: a.string().required(),
      supervisorId: a.string().required(),
      activa: a.boolean().required(),
      // Relaciones
      clientes: a.hasMany("Cliente", "rutaId"),
      creditos: a.hasMany("Credito", "rutaId"),
      cuotas: a.hasMany("Cuota", "rutaId"),
      pagos: a.hasMany("Pago", "rutaId"),
      cierres: a.hasMany("CierreCaja", "rutaId"),
      movimientos: a.hasMany("MovimientoCaja", "rutaId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Cliente
  Cliente: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      nombre: a.string().required(),
      documento: a.string().required(),
      telefono: a.string().required(),
      direccion: a.string().required(),
      barrio: a.string(),
      referencia: a.string(),
      latitud: a.float(),
      longitud: a.float(),
      // Campos calculados (optimización)
      creditosActivos: a.integer().required(),
      saldoTotal: a.float().required(),
      diasAtrasoMax: a.integer().required(),
      estado: a.enum(["SIN_CREDITOS", "AL_DIA", "MORA"]),
      score: a.enum(["CONFIABLE", "REGULAR", "RIESGOSO"]),
      ultimaActualizacion: a.string().required(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
      creditos: a.hasMany("Credito", "clienteId"),
      cuotas: a.hasMany("Cuota", "clienteId"),
      pagos: a.hasMany("Pago", "clienteId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Producto de Crédito
  ProductoCredito: a
    .model({
      tenantId: a.string().required(),
      nombre: a.string().required(),
      interesPorcentaje: a.float().required(),
      numeroCuotas: a.integer().required(),
      frecuencia: a.enum(["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"]),
      excluirDomingos: a.boolean().required(),
      montoMinimo: a.float(),
      montoMaximo: a.float(),
      activo: a.boolean().required(),
      // Relaciones
      creditos: a.hasMany("Credito", "productoId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Crédito
  Credito: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      clienteId: a.id().required(),
      productoId: a.id().required(),
      cobradorId: a.string().required(),
      // Datos del crédito
      montoOriginal: a.float().required(),
      interesPorcentaje: a.float().required(),
      totalAPagar: a.float().required(),
      numeroCuotas: a.integer().required(),
      valorCuota: a.float().required(),
      frecuencia: a.enum(["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"]),
      // Fechas
      fechaDesembolso: a.date().required(),
      fechaPrimeraCuota: a.date().required(),
      fechaUltimaCuota: a.date().required(),
      // Estado
      estado: a.enum(["ACTIVO", "CANCELADO", "CASTIGADO"]),
      // Campos calculados (optimización)
      saldoPendiente: a.float().required(),
      cuotasPagadas: a.integer().required(),
      diasAtraso: a.integer().required(),
      ultimaActualizacion: a.string().required(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
      producto: a.belongsTo("ProductoCredito", "productoId"),
      cuotas: a.hasMany("Cuota", "creditoId"),
      pagos: a.hasMany("Pago", "creditoId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Cuota
  Cuota: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      creditoId: a.id().required(),
      clienteId: a.id().required(),
      cobradorId: a.string().required(),
      // Datos de la cuota
      numero: a.integer().required(),
      fechaProgramada: a.date().required(),
      montoProgramado: a.float().required(),
      // Campos calculados (optimización)
      montoPagado: a.float().required(),
      saldoPendiente: a.float().required(),
      estado: a.enum(["PENDIENTE", "PARCIAL", "PAGADA"]),
      diasAtraso: a.integer().required(),
      ultimaActualizacion: a.string().required(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
      credito: a.belongsTo("Credito", "creditoId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
      pagos: a.hasMany("Pago", "cuotaId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Pago (Inmutable)
  Pago: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      creditoId: a.id().required(),
      cuotaId: a.id().required(),
      clienteId: a.id().required(),
      cobradorId: a.string().required(),
      // Datos del pago
      monto: a.float().required(),
      fecha: a.date().required(),
      // Ubicación
      latitud: a.float(),
      longitud: a.float(),
      // Observaciones
      observaciones: a.string(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
      credito: a.belongsTo("Credito", "creditoId"),
      cuota: a.belongsTo("Cuota", "cuotaId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
      // Los pagos son inmutables - no se pueden actualizar ni eliminar
    ]),

  // Modelo: Cierre de Caja
  CierreCaja: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      cobradorId: a.string().required(),
      fecha: a.date().required(),
      // Datos del cierre
      cajaBase: a.float().required(),
      totalCobrado: a.float().required(),
      totalCreditosOtorgados: a.float().required(),
      totalEntradas: a.float().required(),
      totalGastos: a.float().required(),
      totalCaja: a.float().required(),
      cuotasCobradas: a.integer().required(),
      cuotasTotales: a.integer().required(),
      clientesVisitados: a.integer().required(),
      observaciones: a.string(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),

  // Modelo: Movimiento de Caja
  MovimientoCaja: a
    .model({
      tenantId: a.string().required(),
      rutaId: a.id().required(),
      cobradorId: a.string().required(),
      fecha: a.date().required(),
      tipo: a.enum(["ENTRADA", "GASTO"]),
      detalle: a.string().required(),
      valor: a.float().required(),
      // Relaciones
      ruta: a.belongsTo("Ruta", "rutaId"),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
