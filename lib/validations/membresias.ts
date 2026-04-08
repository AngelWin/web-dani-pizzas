import { z } from "zod";

export const nivelMembresiaSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  beneficios: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .nullable(),
  descuento_porcentaje: z.coerce
    .number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100"),
  puntos_requeridos: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los puntos no pueden ser negativos"),
  orden: z.coerce.number().int().min(1).optional().nullable(),
});

export type NivelMembresiaFormValues = z.input<typeof nivelMembresiaSchema>;

export const reglaPuntosSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .nullable(),
  puntos_otorgados: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe otorgar al menos 1 punto"),
  soles_por_punto: z.coerce.number().positive("Debe ser mayor a 0"),
  activa: z.boolean(),
});

export type ReglaPuntosFormValues = z.input<typeof reglaPuntosSchema>;
