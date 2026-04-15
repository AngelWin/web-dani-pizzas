"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  abrirSesionSchema,
  cerrarSesionSchema,
} from "@/lib/validations/caja-sesiones";
import { abrirSesion, cerrarSesion } from "@/lib/services/caja-sesiones";
import type { ActionResult } from "@/types";
import type { CajaSesion } from "@/lib/services/caja-sesiones";

/** Abre una nueva sesión de caja para la sucursal indicada */
export async function abrirSesionAction(
  rawData: unknown,
): Promise<ActionResult<CajaSesion>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permiso para abrir caja" };
  }

  const parsed = abrirSesionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    const sesion = await abrirSesion({
      sucursal_id: parsed.data.sucursal_id,
      abierta_por: user.id,
      monto_inicial: parsed.data.monto_inicial,
      notas_apertura: parsed.data.notas_apertura,
    });

    revalidatePath("/caja");
    return { data: sesion, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al abrir caja",
    };
  }
}

/** Cierra la sesión de caja indicada */
export async function cerrarSesionAction(
  rawData: unknown,
): Promise<ActionResult<CajaSesion>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permiso para cerrar caja" };
  }

  const parsed = cerrarSesionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    const sesion = await cerrarSesion({
      sesion_id: parsed.data.sesion_id,
      cerrada_por: user.id,
      monto_contado_efectivo: parsed.data.monto_contado_efectivo,
      notas_cierre: parsed.data.notas_cierre,
    });

    revalidatePath("/caja");
    revalidatePath("/reportes");
    return { data: sesion, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cerrar caja",
    };
  }
}
