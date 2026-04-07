import { z } from "zod";

export const modeloNegocioSchema = z.object({
  modelo_negocio: z.enum(["simple", "cocina_independiente"], {
    required_error: "Selecciona un modelo de operación",
  }),
});

export const tarifaDeliverySchema = z.object({
  tarifas: z.array(
    z.object({
      sucursal_id: z.string().uuid(),
      propio_id: z.string().uuid(),
      propio_monto: z.coerce
        .number({ invalid_type_error: "Ingresa un monto válido" })
        .min(0, "El monto no puede ser negativo")
        .max(999, "Monto demasiado alto"),
      tercero_id: z.string().uuid(),
      tercero_monto: z.coerce
        .number({ invalid_type_error: "Ingresa un monto válido" })
        .min(0, "El monto no puede ser negativo")
        .max(999, "Monto demasiado alto"),
    }),
  ),
});

export type ModeloNegocioFormData = z.infer<typeof modeloNegocioSchema>;
export type TarifaDeliveryFormData = z.infer<typeof tarifaDeliverySchema>;
