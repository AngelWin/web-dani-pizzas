import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ModeloNegocio = Database["public"]["Enums"]["modelo_negocio"];

export type ConfiguracionNegocio =
  Database["public"]["Tables"]["configuracion_negocio"]["Row"];

export type DeliveryFeeConfig =
  Database["public"]["Tables"]["delivery_fees_config"]["Row"];

export type DeliveryFeesPorSucursal = {
  sucursal_id: string;
  sucursal_nombre: string;
  propio: { id: string; monto: number };
  tercero: { id: string; monto: number };
};

// ─── Modelo de negocio ────────────────────────────────────────────────────────

export async function getConfiguracionNegocio(): Promise<ConfiguracionNegocio | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_negocio")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateModeloNegocio(
  modelo: ModeloNegocio,
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("configuracion_negocio")
    .update({
      modelo_negocio: modelo,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .not("id", "is", null);

  if (error) throw new Error(error.message);
}

// ─── Tarifas de delivery ──────────────────────────────────────────────────────

export async function getDeliveryFeesPorSucursal(): Promise<
  DeliveryFeesPorSucursal[]
> {
  const supabase = await createClient();

  const { data: sucursales, error: sucError } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");

  if (sucError) throw new Error(sucError.message);

  const { data: fees, error: feesError } = await supabase
    .from("delivery_fees_config")
    .select("*");

  if (feesError) throw new Error(feesError.message);

  return (sucursales ?? []).map((s) => {
    const propio = fees?.find(
      (f) => f.sucursal_id === s.id && f.tipo === "propio",
    );
    const tercero = fees?.find(
      (f) => f.sucursal_id === s.id && f.tipo === "tercero",
    );
    return {
      sucursal_id: s.id,
      sucursal_nombre: s.nombre,
      propio: { id: propio?.id ?? "", monto: propio?.monto ?? 3 },
      tercero: { id: tercero?.id ?? "", monto: tercero?.monto ?? 4 },
    };
  });
}

export async function updateDeliveryFee(
  id: string,
  monto: number,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_fees_config")
    .update({ monto, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
