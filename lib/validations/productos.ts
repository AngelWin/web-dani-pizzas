import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  orden: z.coerce.number().int().min(0, "El orden debe ser mayor o igual a 0"),
  activa: z.boolean(),
});

export const categoriaMedidaSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  descripcion: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .nullable(),
  orden: z.coerce.number().int().min(0, "El orden debe ser mayor o igual a 0"),
  activa: z.boolean(),
  permite_combinacion: z.boolean(),
  max_sabores: z.coerce
    .number()
    .int()
    .min(2, "Mínimo 2 sabores")
    .max(10, "Máximo 10 sabores")
    .nullable()
    .optional(),
});

export const varianteFormSchema = z.object({
  medida_id: z.string().uuid(),
  medida_nombre: z.string(),
  precio: z.coerce
    .number({ invalid_type_error: "El precio debe ser un número" })
    .min(0, "El precio debe ser mayor o igual a 0"),
  disponible: z.boolean(),
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
  precio: z
    .number({ invalid_type_error: "El precio debe ser un número" })
    .min(0.01, "El precio debe ser mayor a 0")
    .nullable()
    .optional(),
  categoria_id: z.string().uuid("Categoría inválida").optional().nullable(),
  imagen_url: z.string().optional().nullable(),
  disponible: z.boolean(),
  variantes: z.array(varianteFormSchema).optional(),
  sucursales_ids: z.array(z.string().uuid()).optional(),
});

export type CategoriaFormValues = z.infer<typeof categoriaSchema>;
export type CategoriaMedidaFormValues = z.infer<typeof categoriaMedidaSchema>;
export type VarianteFormValues = z.infer<typeof varianteFormSchema>;
// Usar z.input para que react-hook-form reciba tipos opcionales (compatibles con zodResolver)
export type ProductoFormValues = z.input<typeof productoSchema>;
