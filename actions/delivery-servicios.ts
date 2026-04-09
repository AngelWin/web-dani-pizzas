"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deliveryServicioSchema } from "@/lib/validations/delivery-servicios";
import {
  crearDeliveryServicio,
  actualizarDeliveryServicio,
  toggleDeliveryServicio,
  eliminarDeliveryServicio,
} from "@/lib/services/delivery-servicios";

async function verificarAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (rolNombre !== "administrador") {
    return { error: "Sin permiso" };
  }
  return {};
}

export async function crearDeliveryServicioAction(
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const parsed = deliveryServicioSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await crearDeliveryServicio(parsed.data);
    revalidatePath("/configuracion");
    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al crear servicio",
    };
  }
}

export async function actualizarDeliveryServicioAction(
  id: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const parsed = deliveryServicioSchema.partial().safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await actualizarDeliveryServicio(id, parsed.data);
    revalidatePath("/configuracion");
    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Error al actualizar servicio",
    };
  }
}

export async function toggleDeliveryServicioAction(
  id: string,
  activo: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  try {
    await toggleDeliveryServicio(id, activo);
    revalidatePath("/configuracion");
    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al cambiar estado",
    };
  }
}

export async function eliminarDeliveryServicioAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await verificarAdmin();
  if (auth.error) return { success: false, error: auth.error };

  try {
    await eliminarDeliveryServicio(id);
    revalidatePath("/configuracion");
    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar servicio",
    };
  }
}
