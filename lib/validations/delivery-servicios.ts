import { z } from "zod";

export const deliveryServicioSchema = z.object({
  sucursal_id: z.string().uuid("Sucursal requerida"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  tipo: z.enum(["propio", "tercero"], {
    required_error: "Selecciona el tipo",
  }),
  precio_base: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(999, "Precio máximo S/. 999"),
  activo: z.boolean(),
  orden: z.coerce.number().int().min(0),
});

export type DeliveryServicioFormData = z.infer<typeof deliveryServicioSchema>;
