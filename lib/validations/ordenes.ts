import { z } from "zod";
import { TIPO_PEDIDO, DELIVERY_METHOD } from "@/lib/constants";

export const saborOrdenSchema = z.object({
  sabor_id: z.string().uuid(),
  sabor_nombre: z.string().min(1),
  proporcion: z.string().min(1),
  exclusiones: z.array(z.string()),
});

export const extraOrdenSchema = z.object({
  extra_id: z.string().uuid(),
  nombre: z.string().min(1),
  precio: z.number().min(0),
});

export const acompananteOrdenSchema = z.object({
  variante_id: z.string().uuid(),
  variante_nombre: z.string().min(1),
  sabor_id: z.string().uuid(),
  sabor_nombre: z.string().min(1),
});

export const ordenItemSchema = z.object({
  producto_id: z.string().uuid(),
  variante_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().int().min(1, "La cantidad mínima es 1"),
  producto_nombre: z.string().min(1),
  variante_nombre: z.string().nullable().optional(),
  precio_unitario: z.number().positive(),
  subtotal: z.number().positive(),
  notas_item: z.string().max(200).nullable().optional(),
  sabores: z.array(saborOrdenSchema).nullable().optional(),
  extras: z.array(extraOrdenSchema).nullable().optional(),
  acompanante: acompananteOrdenSchema.nullable().optional(),
});

export const crearOrdenSchema = z
  .object({
    sucursal_id: z.string().uuid(),
    cliente_id: z.string().uuid().nullable().optional(),
    tipo_pedido: z.enum(
      [TIPO_PEDIDO.EN_LOCAL, TIPO_PEDIDO.PARA_LLEVAR, TIPO_PEDIDO.DELIVERY],
      { required_error: "Selecciona un tipo de pedido" },
    ),
    mesa_id: z.string().uuid().nullable().optional(),
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
    // Promoción aplicada
    promocion_id: z.string().uuid().nullable().optional(),
    descuento: z.number().min(0).optional(),
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
    if (!data.third_party_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un servicio de delivery",
        path: ["third_party_name"],
      });
    }
  });

export type CrearOrdenFormValues = z.infer<typeof crearOrdenSchema>;
export type SaborOrdenValues = z.infer<typeof saborOrdenSchema>;
export type ExtraOrdenValues = z.infer<typeof extraOrdenSchema>;
