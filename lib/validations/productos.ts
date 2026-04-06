import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  orden: z.coerce.number().int().min(0, "El orden debe ser mayor o igual a 0"),
  activa: z.boolean(),
});

export const productoSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .nullable(),
  precio: z.coerce
    .number({ invalid_type_error: "El precio debe ser un número" })
    .min(0.01, "El precio debe ser mayor a 0"),
  categoria_id: z.string().uuid("Categoría inválida").optional().nullable(),
  imagen_url: z.string().optional().nullable(),
  disponible: z.boolean(),
});

export type CategoriaFormValues = z.infer<typeof categoriaSchema>;
export type ProductoFormValues = z.infer<typeof productoSchema>;
