import { z } from "zod";

export const monedaSchema = z.object({
  codigo: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(5, "Máximo 5 caracteres")
    .regex(/^[A-Z]+$/, "Solo letras mayúsculas (ej: EUR, CLP)"),
  simbolo: z
    .string()
    .min(1, "El símbolo es requerido")
    .max(5, "Máximo 5 caracteres"),
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
});

export const monedaActivaSchema = z.object({
  moneda_id: z.string().uuid("Selecciona una moneda válida"),
});

export type MonedaFormData = z.infer<typeof monedaSchema>;
export type MonedaActivaFormData = z.infer<typeof monedaActivaSchema>;
