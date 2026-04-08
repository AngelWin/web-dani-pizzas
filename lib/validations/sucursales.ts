import { z } from "zod";

export const sucursalSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  direccion: z
    .string()
    .min(1, "La dirección es requerida")
    .max(200, "Máximo 200 caracteres"),
  telefono: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .nullable()
    .transform((v) => v || null),
  activa: z.boolean(),
});

export type SucursalFormData = z.infer<typeof sucursalSchema>;
