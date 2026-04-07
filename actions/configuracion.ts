"use server";

import { revalidatePath } from "next/cache";
import {
  updateModeloNegocio,
  updateDeliveryFee,
} from "@/lib/services/configuracion";
import {
  modeloNegocioSchema,
  tarifaDeliverySchema,
} from "@/lib/validations/configuracion";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function actualizarModeloNegocioAction(
  formData: FormData,
): Promise<ActionResult> {
  const raw = { modelo_negocio: formData.get("modelo_negocio") };
  const parsed = modeloNegocioSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await updateModeloNegocio(parsed.data.modelo_negocio);
    revalidatePath("/configuracion");
    revalidatePath("/ordenes");
    revalidatePath("/pos");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al guardar",
    };
  }
}

export async function actualizarTarifasDeliveryAction(
  formData: FormData,
): Promise<ActionResult> {
  const tarifasRaw = formData.get("tarifas");
  if (!tarifasRaw) return { success: false, error: "Datos inválidos" };

  let parsed;
  try {
    parsed = tarifaDeliverySchema.parse({
      tarifas: JSON.parse(tarifasRaw as string),
    });
  } catch {
    return { success: false, error: "Datos de tarifas inválidos" };
  }

  try {
    await Promise.all(
      parsed.tarifas.flatMap((t) => [
        updateDeliveryFee(t.propio_id, t.propio_monto),
        updateDeliveryFee(t.tercero_id, t.tercero_monto),
      ]),
    );
    revalidatePath("/configuracion");
    revalidatePath("/pos");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al guardar tarifas",
    };
  }
}
