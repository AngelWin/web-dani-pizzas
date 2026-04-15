import { z } from "zod";

export const abrirSesionSchema = z.object({
  sucursal_id: z.string().uuid("Sucursal inválida"),
  monto_inicial: z
    .number({ invalid_type_error: "El monto inicial debe ser un número" })
    .min(0, "El monto inicial no puede ser negativo"),
  notas_apertura: z.string().max(500).optional().nullable(),
});

export const cerrarSesionSchema = z.object({
  sesion_id: z.string().uuid("Sesión inválida"),
  monto_contado_efectivo: z
    .number({ invalid_type_error: "El monto contado debe ser un número" })
    .min(0, "El monto contado no puede ser negativo"),
  notas_cierre: z.string().max(500).optional().nullable(),
});

export type AbrirSesionInput = z.infer<typeof abrirSesionSchema>;
export type CerrarSesionInput = z.infer<typeof cerrarSesionSchema>;
