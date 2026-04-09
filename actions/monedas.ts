"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { monedaSchema, monedaActivaSchema } from "@/lib/validations/moneda";
import {
  createMoneda,
  updateMoneda,
  deleteMoneda,
  setMonedaActiva,
} from "@/lib/services/monedas";

type ActionResult = { success: boolean; error?: string };

async function verificarAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (rolNombre !== "administrador") {
    return { error: "Sin permiso" };
  }
  return {};
}

export async function crearMonedaAction(
  rawData: unknown,
): Promise<ActionResult> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const parsed = monedaSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await createMoneda(parsed.data);
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al crear moneda",
    };
  }
}

export async function actualizarMonedaAction(
  id: string,
  rawData: unknown,
): Promise<ActionResult> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const parsed = monedaSchema.partial().safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await updateMoneda(id, parsed.data);
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar moneda",
    };
  }
}

export async function eliminarMonedaAction(id: string): Promise<ActionResult> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  try {
    await deleteMoneda(id);
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar moneda",
    };
  }
}

export async function setMonedaActivaAction(
  rawData: unknown,
): Promise<ActionResult> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const parsed = monedaActivaSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await setMonedaActiva(parsed.data.moneda_id);
    revalidatePath("/configuracion");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Error al cambiar moneda activa",
    };
  }
}
