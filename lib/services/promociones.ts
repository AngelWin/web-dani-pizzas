import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
export { esPromocionVigente, calcularDescuento } from "@/lib/promociones-utils";

export type Promocion = Database["public"]["Tables"]["promociones"]["Row"];

export type PromocionConProductos = Promocion & {
  productos_ids: string[];
};

export type PromocionActivaPOS = Promocion & {
  productos_ids: string[];
};

export async function getPromociones(): Promise<PromocionConProductos[]> {
  const supabase = await createClient();

  const { data: promociones, error } = await supabase
    .from("promociones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!promociones || promociones.length === 0) return [];

  const { data: relaciones } = await supabase
    .from("promociones_productos")
    .select("promocion_id, producto_id")
    .in(
      "promocion_id",
      promociones.map((p) => p.id),
    );

  return promociones.map((p) => ({
    ...p,
    productos_ids: (relaciones ?? [])
      .filter((r) => r.promocion_id === p.id)
      .map((r) => r.producto_id!)
      .filter(Boolean),
  }));
}

export async function getPromocionById(
  id: string,
): Promise<PromocionConProductos | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promociones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  const { data: relaciones } = await supabase
    .from("promociones_productos")
    .select("producto_id")
    .eq("promocion_id", id);

  return {
    ...data,
    productos_ids: (relaciones ?? [])
      .map((r) => r.producto_id!)
      .filter(Boolean),
  };
}

/** Retorna promociones activas y vigentes para el POS */
export async function getPromocionesActivas(): Promise<PromocionActivaPOS[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: promociones, error } = await supabase
    .from("promociones")
    .select("*")
    .eq("activa", true)
    .lte("fecha_inicio", now)
    .gte("fecha_fin", now)
    .order("nombre");

  if (error) throw new Error(error.message);
  if (!promociones || promociones.length === 0) return [];

  const { data: relaciones } = await supabase
    .from("promociones_productos")
    .select("promocion_id, producto_id")
    .in(
      "promocion_id",
      promociones.map((p) => p.id),
    );

  return promociones.map((p) => ({
    ...p,
    productos_ids: (relaciones ?? [])
      .filter((r) => r.promocion_id === p.id)
      .map((r) => r.producto_id!)
      .filter(Boolean),
  }));
}

export async function createPromocion(data: {
  nombre: string;
  descripcion?: string | null;
  tipo_descuento: string;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  productos_ids?: string[];
}): Promise<Promocion> {
  const supabase = await createClient();
  const { productos_ids, ...promoData } = data;

  const { data: promo, error } = await supabase
    .from("promociones")
    .insert({
      ...promoData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (productos_ids && productos_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promociones_productos")
      .insert(
        productos_ids.map((pid) => ({
          promocion_id: promo.id,
          producto_id: pid,
        })),
      );
    if (relError) throw new Error(relError.message);
  }

  return promo;
}

export async function updatePromocion(
  id: string,
  data: {
    nombre: string;
    descripcion?: string | null;
    tipo_descuento: string;
    valor_descuento: number;
    fecha_inicio: string;
    fecha_fin: string;
    activa: boolean;
    productos_ids?: string[];
  },
): Promise<void> {
  const supabase = await createClient();
  const { productos_ids, ...promoData } = data;

  const { error } = await supabase
    .from("promociones")
    .update({ ...promoData, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Reemplazar relaciones de productos
  await supabase.from("promociones_productos").delete().eq("promocion_id", id);

  if (productos_ids && productos_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promociones_productos")
      .insert(
        productos_ids.map((pid) => ({
          promocion_id: id,
          producto_id: pid,
        })),
      );
    if (relError) throw new Error(relError.message);
  }
}

export async function deletePromocion(id: string): Promise<void> {
  const supabase = await createClient();

  await supabase.from("promociones_productos").delete().eq("promocion_id", id);

  const { error } = await supabase.from("promociones").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function togglePromocionActiva(
  id: string,
  activa: boolean,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("promociones")
    .update({ activa, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
