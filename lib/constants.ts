/** Roles conocidos del sistema. Los roles se gestionan en la tabla `roles` de Supabase. */
export const ROLES = {
  ADMINISTRADOR: "administrador",
  CAJERO: "cajero",
  MESERO: "mesero",
  REPARTIDOR: "repartidor",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DEFAULT_USER_IMAGE = "/images/default-user-image.png";

export const TIPO_PEDIDO = {
  EN_LOCAL: "local",
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

export const TIPOS_VEHICULO = {
  AUTO: "auto",
  MOTOCAR: "motocar",
  MOTO_LINEAL: "moto_lineal",
} as const;

export type TipoVehiculo = (typeof TIPOS_VEHICULO)[keyof typeof TIPOS_VEHICULO];

export const TIPOS_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  auto: "Auto",
  motocar: "Motocar",
  moto_lineal: "Moto lineal",
};

export const SUCURSALES = {
  CASMA: "Casma Av. Reina",
  VILLA_HERMOSA: "Villa Hermosa Calle Uno",
} as const;
