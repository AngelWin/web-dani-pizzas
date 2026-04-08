import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

export async function getSucursales(): Promise<Sucursal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSucursalById(id: string): Promise<Sucursal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createSucursal(payload: {
  nombre: string;
  direccion: string;
  telefono?: string | null;
  activa: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sucursales").insert({
    nombre: payload.nombre,
    direccion: payload.direccion,
    telefono: payload.telefono ?? null,
    activa: payload.activa,
  });
  if (error) throw new Error(error.message);
}

export async function updateSucursal(
  id: string,
  payload: {
    nombre: string;
    direccion: string;
    telefono?: string | null;
    activa: boolean;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sucursales")
    .update({
      nombre: payload.nombre,
      direccion: payload.direccion,
      telefono: payload.telefono ?? null,
      activa: payload.activa,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
