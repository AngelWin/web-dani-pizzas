import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Moneda = Database["public"]["Tables"]["monedas"]["Row"];

export type MonedaActiva = {
  id: string;
  codigo: string;
  simbolo: string;
  nombre: string;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getMonedas(): Promise<Moneda[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("monedas")
    .select("*")
    .order("es_predefinida", { ascending: false })
    .order("nombre");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMonedaActiva(): Promise<MonedaActiva> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_negocio")
    .select(
      "moneda_activa_id, monedas!configuracion_negocio_moneda_activa_id_fkey(id, codigo, simbolo, nombre)",
    )
    .single();

  if (error || !data?.monedas) {
    return { id: "", codigo: "PEN", simbolo: "S/.", nombre: "Sol Peruano" };
  }

  const moneda = data.monedas as unknown as MonedaActiva;
  return moneda;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createMoneda(data: {
  codigo: string;
  simbolo: string;
  nombre: string;
}): Promise<Moneda> {
  const supabase = await createClient();

  const { data: moneda, error } = await supabase
    .from("monedas")
    .insert({
      codigo: data.codigo,
      simbolo: data.simbolo,
      nombre: data.nombre,
      es_predefinida: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return moneda;
}

export async function updateMoneda(
  id: string,
  data: { codigo?: string; simbolo?: string; nombre?: string },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("monedas")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteMoneda(id: string): Promise<void> {
  const supabase = await createClient();

  // Verificar que no sea predefinida
  const { data: moneda } = await supabase
    .from("monedas")
    .select("es_predefinida")
    .eq("id", id)
    .single();

  if (moneda?.es_predefinida) {
    throw new Error("No se puede eliminar una moneda predefinida");
  }

  // Verificar que no sea la activa
  const { data: config } = await supabase
    .from("configuracion_negocio")
    .select("moneda_activa_id")
    .single();

  if (config?.moneda_activa_id === id) {
    throw new Error("No se puede eliminar la moneda activa");
  }

  const { error } = await supabase.from("monedas").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function setMonedaActiva(monedaId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("configuracion_negocio")
    .update({
      moneda_activa_id: monedaId,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .not("id", "is", null);

  if (error) throw new Error(error.message);
}
