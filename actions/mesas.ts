"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mesaSchema, type MesaFormValues } from "@/lib/validations/mesas";
import {
  createMesa,
  updateMesa,
  deleteMesa,
  updateEstadoMesa,
  liberarMesaForzado,
} from "@/lib/services/mesas";
import type { EstadoMesa } from "@/lib/services/mesas";
import type { ActionResult } from "@/types";

async function verificarAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "No autenticado";

  const { data: rol } = await supabase.rpc("get_user_role");
  if (rol !== "administrador")
    return "Solo el administrador puede gestionar mesas";

  return null;
}

export async function createMesaAction(
  sucursalId: string,
  values: unknown,
): Promise<ActionResult<null>> {
  const adminError = await verificarAdmin();
  if (adminError) return { data: null, error: adminError };

  const parsed = mesaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await createMesa({
      sucursal_id: sucursalId,
      numero: parsed.data.numero,
      sillas: parsed.data.sillas,
      activa: parsed.data.activa,
    });
    revalidatePath("/sucursales");
    revalidatePath("/pos");
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear mesa";
    if (msg.includes("mesas_numero_sucursal_unique")) {
      return {
        data: null,
        error: "Ya existe una mesa con ese número en esta sucursal",
      };
    }
    return { data: null, error: msg };
  }
}

export async function updateMesaAction(
  id: string,
  values: unknown,
): Promise<ActionResult<null>> {
  const adminError = await verificarAdmin();
  if (adminError) return { data: null, error: adminError };

  const parsed = mesaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await updateMesa(id, parsed.data);
    revalidatePath("/sucursales");
    revalidatePath("/pos");
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al actualizar mesa";
    if (msg.includes("mesas_numero_sucursal_unique")) {
      return {
        data: null,
        error: "Ya existe una mesa con ese número en esta sucursal",
      };
    }
    return { data: null, error: msg };
  }
}

export async function deleteMesaAction(
  id: string,
): Promise<ActionResult<null>> {
  const adminError = await verificarAdmin();
  if (adminError) return { data: null, error: adminError };

  try {
    await deleteMesa(id);
    revalidatePath("/sucursales");
    revalidatePath("/pos");
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al eliminar mesa",
    };
  }
}

/** Libera una mesa a la fuerza cancelando todas sus órdenes activas. Accesible para cajero y admin. */
export async function liberarMesaForzadoAction(
  mesaId: string,
): Promise<ActionResult<{ canceladas: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data: rol } = await supabase.rpc("get_user_role");
  if (!["administrador", "cajero"].includes(rol ?? "")) {
    return { data: null, error: "Sin permiso para liberar mesas" };
  }

  try {
    const canceladas = await liberarMesaForzado(
      mesaId,
      "Liberación administrativa — órdenes canceladas sin cobrar",
    );
    revalidatePath("/ordenes");
    revalidatePath("/pos");
    return { data: { canceladas }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al liberar mesa",
    };
  }
}

export async function cambiarEstadoMesaAction(
  id: string,
  estado: EstadoMesa,
): Promise<ActionResult<null>> {
  const adminError = await verificarAdmin();
  if (adminError) return { data: null, error: adminError };

  try {
    await updateEstadoMesa(id, estado);
    revalidatePath("/sucursales");
    revalidatePath("/pos");
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cambiar estado",
    };
  }
}
