import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NivelMembresia =
  Database["public"]["Tables"]["membresias_niveles"]["Row"];
export type ReglaPuntos = Database["public"]["Tables"]["reglas_puntos"]["Row"];

// ─── Niveles de membresía ─────────────────────────────────────────────────────

export async function getNivelesMembresia(): Promise<NivelMembresia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membresias_niveles")
    .select("*")
    .order("puntos_requeridos", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createNivelMembresia(data: {
  nombre: string;
  beneficios?: string | null;
  descuento_porcentaje: number;
  puntos_requeridos: number;
  orden?: number | null;
}): Promise<NivelMembresia> {
  const supabase = await createClient();
  const { data: nivel, error } = await supabase
    .from("membresias_niveles")
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return nivel;
}

export async function updateNivelMembresia(
  id: string,
  data: {
    nombre: string;
    beneficios?: string | null;
    descuento_porcentaje: number;
    puntos_requeridos: number;
    orden?: number | null;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membresias_niveles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteNivelMembresia(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membresias_niveles")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Reglas de puntos ─────────────────────────────────────────────────────────

export async function getReglasPuntos(): Promise<ReglaPuntos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglas_puntos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getReglasPuntosActivas(): Promise<ReglaPuntos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglas_puntos")
    .select("*")
    .eq("activa", true)
    .order("soles_por_punto", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createReglaPuntos(data: {
  nombre: string;
  descripcion?: string | null;
  puntos_otorgados: number;
  soles_por_punto: number;
  activa: boolean;
}): Promise<ReglaPuntos> {
  const supabase = await createClient();
  const { data: regla, error } = await supabase
    .from("reglas_puntos")
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return regla;
}

export async function updateReglaPuntos(
  id: string,
  data: {
    nombre: string;
    descripcion?: string | null;
    puntos_otorgados: number;
    soles_por_punto: number;
    activa: boolean;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reglas_puntos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReglaPuntos(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reglas_puntos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleReglaPuntosActiva(
  id: string,
  activa: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reglas_puntos")
    .update({ activa, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Re-export funciones puras desde utils (sin dependencias de servidor)
export {
  calcularPuntosVenta,
  calcularDescuentoNivel,
} from "@/lib/membresias-utils";
