import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type DeliveryServicio =
  Database["public"]["Tables"]["delivery_servicios"]["Row"];

export type DeliveryServiciosPorSucursal = {
  sucursal_id: string;
  sucursal_nombre: string;
  servicios: DeliveryServicio[];
};

// ─── Consultas ─────────────────────────────────────────────────────────────

export async function getDeliveryServiciosPorSucursal(
  sucursalId: string,
): Promise<DeliveryServicio[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_servicios")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .eq("activo", true)
    .order("orden");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllDeliveryServiciosConSucursal(): Promise<
  DeliveryServiciosPorSucursal[]
> {
  const supabase = await createClient();

  const { data: sucursales, error: sucError } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");

  if (sucError) throw new Error(sucError.message);

  const { data: servicios, error: svcError } = await supabase
    .from("delivery_servicios")
    .select("*")
    .order("orden");

  if (svcError) throw new Error(svcError.message);

  return (sucursales ?? []).map((s) => ({
    sucursal_id: s.id,
    sucursal_nombre: s.nombre,
    servicios: (servicios ?? []).filter((svc) => svc.sucursal_id === s.id),
  }));
}

// ─── Mutaciones ────────────────────────────────────────────────────────────

export async function crearDeliveryServicio(data: {
  sucursal_id: string;
  nombre: string;
  tipo: "propio" | "tercero";
  precio_base: number;
  activo?: boolean;
  orden?: number;
}): Promise<DeliveryServicio> {
  const supabase = await createClient();

  const { data: servicio, error } = await supabase
    .from("delivery_servicios")
    .insert({
      sucursal_id: data.sucursal_id,
      nombre: data.nombre,
      tipo: data.tipo,
      precio_base: data.precio_base,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return servicio;
}

export async function actualizarDeliveryServicio(
  id: string,
  data: {
    nombre?: string;
    tipo?: "propio" | "tercero";
    precio_base?: number;
    activo?: boolean;
    orden?: number;
  },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_servicios")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function toggleDeliveryServicio(
  id: string,
  activo: boolean,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_servicios")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function eliminarDeliveryServicio(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_servicios")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
