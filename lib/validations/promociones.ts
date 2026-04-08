import { z } from "zod";

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
    tipo_descuento: z.enum(["porcentaje", "fijo"], {
      required_error: "Selecciona el tipo de descuento",
    }),
    valor_descuento: z.coerce
      .number({ invalid_type_error: "El valor debe ser un número" })
      .positive("El valor debe ser mayor a 0"),
    fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
    fecha_fin: z.string().min(1, "La fecha de fin es requerida"),
    activa: z.boolean(),
    productos_ids: z.array(z.string().uuid()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.tipo_descuento === "porcentaje" && data.valor_descuento > 100) {
        return false;
      }
      return true;
    },
    {
      message: "El porcentaje no puede ser mayor a 100",
      path: ["valor_descuento"],
    },
  )
  .refine(
    (data) => {
      return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["fecha_fin"],
    },
  );

export type PromocionFormValues = z.input<typeof promocionSchema>;
