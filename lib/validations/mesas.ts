import { z } from "zod";

export const mesaSchema = z.object({
  numero: z
    .number({ required_error: "El número de mesa es obligatorio" })
    .int("Debe ser un número entero")
    .min(1, "El número de mesa debe ser mayor a 0")
    .max(999, "Máximo 999"),
  sillas: z
    .number({ required_error: "La cantidad de sillas es obligatoria" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 silla")
    .max(20, "Máximo 20 sillas"),
  activa: z.boolean(),
});

export type MesaFormValues = z.infer<typeof mesaSchema>;
