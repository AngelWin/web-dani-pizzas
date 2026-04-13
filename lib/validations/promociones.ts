import { z } from "zod";
import { TIPO_PROMOCION } from "@/lib/constants";

export const promocionSchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .max(200, "Máximo 200 caracteres"),
    descripcion: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .nullable(),
    tipo_promocion: z.enum(
      [
        TIPO_PROMOCION.DESCUENTO_PORCENTAJE,
        TIPO_PROMOCION.DESCUENTO_FIJO,
        TIPO_PROMOCION.DOS_POR_UNO,
        TIPO_PROMOCION.COMBO_PRECIO_FIJO,
        TIPO_PROMOCION.DELIVERY_GRATIS,
      ],
      { required_error: "Selecciona el tipo de promoción" },
    ),
    valor_descuento: z.coerce
      .number({ invalid_type_error: "El valor debe ser un número" })
      .min(0, "El valor no puede ser negativo")
      .optional()
      .default(0),
    fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
    fecha_fin: z.string().min(1, "La fecha de fin es requerida"),
    activa: z.boolean(),
    // Días de la semana: 0=dom..6=sab, null/vacío = todos
    dias_semana: z
      .array(z.number().int().min(0).max(6))
      .nullable()
      .optional()
      .default(null),
    // Happy hour
    hora_inicio: z.string().nullable().optional().default(null),
    hora_fin: z.string().nullable().optional().default(null),
    // Pedido mínimo (delivery_gratis, descuento_fijo)
    pedido_minimo: z.coerce.number().min(0).nullable().optional().default(null),
    // Precio combo
    precio_combo: z.coerce.number().min(0).nullable().optional().default(null),
    // Relaciones
    productos_ids: z.array(z.string().uuid()).optional().default([]),
    sucursales_ids: z.array(z.string().uuid()).optional().default([]),
    medidas_ids: z.array(z.string().uuid()).optional().default([]),
    // Tipo de pedido aplicable
    tipos_pedido: z
      .array(z.enum(["local", "delivery", "para_llevar"]))
      .nullable()
      .optional()
      .default(null),
    // Permite modificaciones (sabores, extras) al agregar desde POS
    permite_modificaciones: z.boolean().optional().default(true),
    // Nivel de membresía requerido (null = público para todos)
    nivel_membresia_id: z.string().uuid().nullable().optional().default(null),
  })
  .superRefine((data, ctx) => {
    // Fecha fin >= fecha inicio
    if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior a la fecha de inicio",
        path: ["fecha_fin"],
      });
    }

    // Validaciones por tipo
    switch (data.tipo_promocion) {
      case "descuento_porcentaje":
        if (!data.valor_descuento || data.valor_descuento <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El porcentaje de descuento es requerido",
            path: ["valor_descuento"],
          });
        } else if (data.valor_descuento > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El porcentaje no puede ser mayor a 100",
            path: ["valor_descuento"],
          });
        }
        break;

      case "descuento_fijo":
        if (!data.valor_descuento || data.valor_descuento <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El monto de descuento es requerido",
            path: ["valor_descuento"],
          });
        }
        break;

      case "2x1":
        if (!data.productos_ids || data.productos_ids.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selecciona al menos un producto para el 2x1",
            path: ["productos_ids"],
          });
        }
        break;

      case "combo_precio_fijo":
        if (!data.precio_combo || data.precio_combo <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El precio del combo es requerido",
            path: ["precio_combo"],
          });
        }
        // Combo válido: 2+ productos, o 1 producto con 2+ medidas
        const totalItemsCombo =
          (data.productos_ids?.length ?? 0) +
          Math.max(0, (data.medidas_ids?.length ?? 0) - 1);
        if (totalItemsCombo < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Selecciona al menos 2 productos o 1 producto con 2 medidas",
            path: ["productos_ids"],
          });
        }
        break;

      case "delivery_gratis":
        if (!data.pedido_minimo || data.pedido_minimo <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El pedido mínimo es requerido para delivery gratis",
            path: ["pedido_minimo"],
          });
        }
        break;
    }

    // Si hora_inicio, hora_fin también requerida
    if (data.hora_inicio && !data.hora_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin es requerida",
        path: ["hora_fin"],
      });
    }
    if (data.hora_fin && !data.hora_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de inicio es requerida",
        path: ["hora_inicio"],
      });
    }
    if (
      data.hora_inicio &&
      data.hora_fin &&
      data.hora_fin <= data.hora_inicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La hora de fin debe ser posterior a la hora de inicio",
        path: ["hora_fin"],
      });
    }
  });

export type PromocionFormValues = z.input<typeof promocionSchema>;
