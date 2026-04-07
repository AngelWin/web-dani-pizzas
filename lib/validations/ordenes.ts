import { z } from "zod";
import { TIPO_PEDIDO, DELIVERY_METHOD } from "@/lib/constants";

export const ordenItemSchema = z.object({
  producto_id: z.string().uuid(),
  variante_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().int().min(1, "La cantidad mínima es 1"),
  producto_nombre: z.string().min(1),
  variante_nombre: z.string().nullable().optional(),
  precio_unitario: z.number().positive(),
  subtotal: z.number().positive(),
  notas_item: z.string().max(200).nullable().optional(),
});

export const crearOrdenSchema = z
  .object({
    cliente_id: z.string().uuid().nullable().optional(),
    tipo_pedido: z.enum(
      [TIPO_PEDIDO.EN_LOCAL, TIPO_PEDIDO.PARA_LLEVAR, TIPO_PEDIDO.DELIVERY],
      { required_error: "Selecciona un tipo de pedido" },
    ),
    mesa_referencia: z.string().max(50).optional(),
    notas: z.string().max(300).optional(),
    // Delivery
    delivery_method: z
      .enum([DELIVERY_METHOD.PROPIO, DELIVERY_METHOD.TERCERO])
      .nullable()
      .optional(),
    repartidor_id: z.string().uuid().nullable().optional(),
    third_party_name: z.string().max(50).nullable().optional(),
    delivery_fee: z.number().min(0).optional(),
    delivery_address: z.string().max(200).nullable().optional(),
    delivery_referencia: z.string().max(150).nullable().optional(),
    items: z.array(ordenItemSchema).min(1, "Agrega al menos un producto"),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_pedido !== TIPO_PEDIDO.DELIVERY) return;

    if (!data.delivery_method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el método de delivery",
        path: ["delivery_method"],
      });
    }
    if (!data.delivery_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa la dirección de entrega",
        path: ["delivery_address"],
      });
    }
    if (
      data.delivery_method === DELIVERY_METHOD.PROPIO &&
      !data.repartidor_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un repartidor",
        path: ["repartidor_id"],
      });
    }
    if (
      data.delivery_method === DELIVERY_METHOD.TERCERO &&
      !data.third_party_name
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa el nombre del servicio de delivery",
        path: ["third_party_name"],
      });
    }
  });

export type CrearOrdenFormValues = z.infer<typeof crearOrdenSchema>;
