import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type RepartidorDetalles =
  Database["public"]["Tables"]["repartidor_detalles"]["Row"];

export async function getRepartidorDetalles(
  profileId: string,
): Promise<RepartidorDetalles | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("repartidor_detalles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertRepartidorDetalles(
  profileId: string,
  data: {
    direccion?: string | null;
    tipo_vehiculo?: string[];
    notas?: string | null;
  },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("repartidor_detalles").upsert(
    {
      id: profileId,
      direccion: data.direccion ?? null,
      tipo_vehiculo: data.tipo_vehiculo ?? [],
      notas: data.notas ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(error.message);
}
