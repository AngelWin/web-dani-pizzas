import { z } from "zod";
import { TIPO_PEDIDO, DELIVERY_METHOD, METODO_PAGO } from "@/lib/constants";

// ─── Item del carrito ──────────────────────────────────────────────────────

export const ventaItemSchema = z.object({
  producto_id: z.string().uuid("ID de producto inválido"),
  variante_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().int().min(1, "La cantidad mínima es 1"),
  producto_nombre: z.string().min(1),
  variante_nombre: z.string().nullable().optional(),
  producto_precio: z.number().positive("El precio debe ser positivo"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
});

export type VentaItemValues = z.infer<typeof ventaItemSchema>;

// ─── Formulario de pago ────────────────────────────────────────────────────

export const pagoSchema = z.object({
  metodo_pago: z.enum(
    [
      METODO_PAGO.EFECTIVO,
      METODO_PAGO.TARJETA,
      METODO_PAGO.YAPE,
      METODO_PAGO.PLIN,
      METODO_PAGO.TRANSFERENCIA,
    ],
    { required_error: "Selecciona un método de pago" },
  ),
  notas: z.string().max(300, "Máximo 300 caracteres").optional(),
});

export type PagoFormValues = z.infer<typeof pagoSchema>;

// ─── Formulario de tipo de pedido ──────────────────────────────────────────

export const tipoPedidoSchema = z.object({
  tipo_pedido: z.enum(
    [TIPO_PEDIDO.EN_LOCAL, TIPO_PEDIDO.PARA_LLEVAR, TIPO_PEDIDO.DELIVERY],
    { required_error: "Selecciona un tipo de pedido" },
  ),
  mesa_referencia: z.string().max(50).optional(),
});

export type TipoPedidoFormValues = z.infer<typeof tipoPedidoSchema>;

// ─── Formulario de delivery ────────────────────────────────────────────────

export const deliverySchema = z
  .object({
    delivery_method: z.enum([DELIVERY_METHOD.PROPIO, DELIVERY_METHOD.TERCERO], {
      required_error: "Selecciona el método de delivery",
    }),
    repartidor_id: z.string().uuid().nullable().optional(),
    third_party_name: z.string().max(50).nullable().optional(),
    delivery_fee: z
      .number()
      .min(0, "El costo de delivery no puede ser negativo"),
    delivery_address: z
      .string()
      .min(5, "Ingresa la dirección completa")
      .max(200, "Máximo 200 caracteres"),
    delivery_referencia: z
      .string()
      .max(150, "Máximo 150 caracteres")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_method === DELIVERY_METHOD.PROPIO) {
      if (!data.repartidor_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un repartidor",
          path: ["repartidor_id"],
        });
      }
    }
    if (data.delivery_method === DELIVERY_METHOD.TERCERO) {
      if (!data.third_party_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresa el nombre del servicio de delivery",
          path: ["third_party_name"],
        });
      }
    }
  });

export type DeliveryFormValues = z.infer<typeof deliverySchema>;

// ─── Schema completo de venta ──────────────────────────────────────────────

export const crearVentaSchema = z.object({
  tipo_pedido: z.enum([
    TIPO_PEDIDO.EN_LOCAL,
    TIPO_PEDIDO.PARA_LLEVAR,
    TIPO_PEDIDO.DELIVERY,
  ]),
  metodo_pago: z.enum([
    METODO_PAGO.EFECTIVO,
    METODO_PAGO.TARJETA,
    METODO_PAGO.YAPE,
    METODO_PAGO.PLIN,
    METODO_PAGO.TRANSFERENCIA,
  ]),
  notas: z.string().max(300).optional(),
  mesa_referencia: z.string().max(50).optional(),
  delivery_method: z.string().nullable().optional(),
  repartidor_id: z.string().uuid().nullable().optional(),
  third_party_name: z.string().max(50).nullable().optional(),
  delivery_fee: z.number().min(0).nullable().optional(),
  delivery_address: z.string().max(200).nullable().optional(),
  delivery_referencia: z.string().max(150).nullable().optional(),
  items: z.array(ventaItemSchema).min(1, "Agrega al menos un producto"),
});

export type CrearVentaFormValues = z.infer<typeof crearVentaSchema>;

// ─── Cobro de orden ────────────────────────────────────────────────────────

export const cobrarOrdenSchema = z
  .object({
    metodo_pago: z.enum(
      [
        METODO_PAGO.EFECTIVO,
        METODO_PAGO.TARJETA,
        METODO_PAGO.YAPE,
        METODO_PAGO.PLIN,
        METODO_PAGO.TRANSFERENCIA,
      ],
      { required_error: "Selecciona un método de pago" },
    ),
    monto_recibido: z
      .number({ invalid_type_error: "Ingresa un monto válido" })
      .positive("El monto debe ser mayor a cero")
      .optional(),
    descuento_membresia: z.number().min(0).optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.metodo_pago === METODO_PAGO.EFECTIVO && !data.monto_recibido) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa el monto recibido",
        path: ["monto_recibido"],
      });
    }
  });

export type CobrarOrdenFormValues = z.input<typeof cobrarOrdenSchema>;
