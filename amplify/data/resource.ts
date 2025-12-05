import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*
 * CrediSync360 V2 - Data Schema
 * 
 * Este schema define los modelos de datos para la aplicación de microcréditos.
 * Todos los modelos incluyen tenantId para aislamiento multitenant.
 */

const schema = a.schema({
  // Modelo: Cliente
  Cliente: a
    .model({
      tenantId: a.string().required(),
      nombre: a.string().required(),
      documento: a.string().required(),
      telefono: a.string().required(),
      direccion: a.string().required(),
      barrio: a.string(),
      referencia: a.string(),
      latitud: a.float(),
      longitud: a.float(),
      // Relaciones
      creditos: a.hasMany("Credito", "clienteId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create", "update"]),
    ]),

  // Modelo: Producto de Crédito
  ProductoCredito: a
    .model({
      tenantId: a.string().required(),
      nombre: a.string().required(),
      interesPorcentaje: a.float().required(),
      numeroCuotas: a.integer().required(),
      frecuencia: a.enum(["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"]),
      excluirDomingos: a.boolean().default(true),
      montoMinimo: a.float(),
      montoMaximo: a.float(),
      activo: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.authenticated().to(["create", "update", "delete"]),
    ]),

  // Modelo: Crédito
  Credito: a
    .model({
      tenantId: a.string().required(),
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
      estado: a.enum(["ACTIVO", "CANCELADO", "CASTIGADO"]).default("ACTIVO"),
      // Relaciones
      cliente: a.belongsTo("Cliente", "clienteId"),
      cuotas: a.hasMany("Cuota", "creditoId"),
      pagos: a.hasMany("Pago", "creditoId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
    ]),

  // Modelo: Cuota
  Cuota: a
    .model({
      tenantId: a.string().required(),
      creditoId: a.id().required(),
      clienteId: a.id().required(),
      // Datos de la cuota
      numero: a.integer().required(),
      fechaProgramada: a.date().required(),
      montoProgramado: a.float().required(),
      // Relaciones
      credito: a.belongsTo("Credito", "creditoId"),
      pagos: a.hasMany("Pago", "cuotaId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
    ]),

  // Modelo: Pago (Inmutable)
  Pago: a
    .model({
      tenantId: a.string().required(),
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
      credito: a.belongsTo("Credito", "creditoId"),
      cuota: a.belongsTo("Cuota", "cuotaId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      // Los pagos son inmutables - no se pueden actualizar ni eliminar
    ]),

  // Modelo: Cierre de Caja
  CierreCaja: a
    .model({
      tenantId: a.string().required(),
      cobradorId: a.string().required(),
      fecha: a.date().required(),
      // Datos del cierre
      totalCobrado: a.float().required(),
      cuotasCobradas: a.integer().required(),
      cuotasTotales: a.integer().required(),
      clientesVisitados: a.integer().required(),
      efectivoEnMano: a.float().required(),
      observaciones: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
