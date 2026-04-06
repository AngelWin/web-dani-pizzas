export const ROLES = {
  ADMINISTRADOR: "administrador",
  CAJERO: "cajero",
  MESERO: "mesero",
  REPARTIDOR: "repartidor",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TIPO_PEDIDO = {
  EN_LOCAL: "en_local",
  PARA_LLEVAR: "para_llevar",
  DELIVERY: "delivery",
} as const;

export type TipoPedido = (typeof TIPO_PEDIDO)[keyof typeof TIPO_PEDIDO];

export const DELIVERY_METHOD = {
  PROPIO: "propio",
  TERCERO: "tercero",
} as const;

export type DeliveryMethod =
  (typeof DELIVERY_METHOD)[keyof typeof DELIVERY_METHOD];

export const DELIVERY_STATUS = {
  PENDIENTE: "pendiente",
  EN_CAMINO: "en_camino",
  ENTREGADO: "entregado",
} as const;

export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

export const METODO_PAGO = {
  EFECTIVO: "efectivo",
  TARJETA: "tarjeta",
  YAPE: "yape",
  PLIN: "plin",
  TRANSFERENCIA: "transferencia",
} as const;

export type MetodoPago = (typeof METODO_PAGO)[keyof typeof METODO_PAGO];

export const THIRD_PARTY_SERVICES = [
  "Rappi",
  "PedidosYa",
  "Glovo",
  "Otro",
] as const;

export const DEFAULT_DELIVERY_FEES = {
  propio: 3,
  tercero: 4,
} as const;

export const SUCURSALES = {
  CASMA: "Casma Av. Reina",
  VILLA_HERMOSA: "Villa Hermosa Calle Uno",
} as const;
