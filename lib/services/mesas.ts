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
