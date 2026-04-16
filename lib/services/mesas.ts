import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

export type Mesa = Database["public"]["Tables"]["mesas"]["Row"];
export type EstadoMesa = Database["public"]["Enums"]["estado_mesa"];

const ESTADOS_ORDEN_ACTIVA = ["confirmada", "en_preparacion", "lista"] as const;

/** Mesas activas de una sucursal, ordenadas por número */
export async function getMesasPorSucursal(sucursalId: string): Promise<Mesa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .eq("activa", true)
    .order("numero", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Todas las mesas de una sucursal (incluyendo inactivas) — para admin */
export async function getTodasLasMesas(sucursalId: string): Promise<Mesa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .order("numero", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMesa(payload: {
  sucursal_id: string;
  numero: number;
  sillas: number;
  activa: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("mesas").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateMesa(
  id: string,
  payload: { numero: number; sillas: number; activa: boolean },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mesas")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMesa(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("mesas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Actualizar estado de una mesa */
export async function updateEstadoMesa(
  id: string,
  estado: EstadoMesa,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mesas")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Libera una mesa a la fuerza: cancela todas sus órdenes activas y la pone libre.
 * Usar solo cuando la mesa quedó bloqueada por órdenes sin atender.
 * Devuelve la cantidad de órdenes canceladas.
 */
export async function liberarMesaForzado(
  mesaId: string,
  motivo: string,
): Promise<number> {
  const supabase = await createClient();

  // Traer todas las órdenes activas de la mesa
  const { data: ordenes, error: fetchError } = await supabase
    .from("ordenes")
    .select("id")
    .eq("mesa_id", mesaId)
    .in("estado", ESTADOS_ORDEN_ACTIVA);

  if (fetchError) throw new Error(fetchError.message);
  if (!ordenes || ordenes.length === 0) {
    // No hay órdenes activas, solo liberar la mesa
    await updateEstadoMesa(mesaId, "libre");
    return 0;
  }

  const ids = ordenes.map((o) => o.id);

  // Cancelar todas las órdenes activas
  const { error: cancelError } = await supabase
    .from("ordenes")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (cancelError) throw new Error(cancelError.message);

  // Registrar el motivo en el historial de la última orden (best-effort)
  await supabase
    .from("orden_estado_historial")
    .update({ notas: motivo })
    .in("orden_id", ids)
    .eq("estado_hasta", "cancelada")
    .order("cambiado_at", { ascending: false });

  // Liberar la mesa
  await updateEstadoMesa(mesaId, "libre");

  return ids.length;
}

/**
 * Liberar mesa solo si no tiene más órdenes activas.
 * Se usa al cobrar o cancelar una orden.
 */
export async function liberarMesaSiCorresponde(mesaId: string): Promise<void> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("ordenes")
    .select("id", { count: "exact", head: true })
    .eq("mesa_id", mesaId)
    .in("estado", ESTADOS_ORDEN_ACTIVA);

  if (error) throw new Error(error.message);

  if ((count ?? 0) === 0) {
    await updateEstadoMesa(mesaId, "libre");
  }
}
