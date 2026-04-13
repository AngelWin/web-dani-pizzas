import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { esPromocionVigente } from "@/lib/promociones-utils";
export {
  esPromocionVigente,
  calcularDescuento,
  esPromocionAplicableAlCarrito,
  getDescripcionPromocion,
} from "@/lib/promociones-utils";

export type Promocion = Database["public"]["Tables"]["promociones"]["Row"];

export type PromocionComboItem = {
  id: string;
  producto_id: string;
  medida_id: string | null;
  medida_nombre: string | null;
  producto_nombre: string | null;
  orden: number;
  es_ancla: boolean;
};

export type PromocionConProductos = Promocion & {
  productos_ids: string[];
  sucursales_ids: string[];
  medidas_ids: string[];
  sabores_ids: string[];
  combo_items: PromocionComboItem[];
};

export type PromocionActivaPOS = PromocionConProductos;

// ─── Helpers internos ─────────────────────────────────────────────────────

async function cargarRelaciones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  promocionIds: string[],
): Promise<{
  productosPorPromo: Record<string, string[]>;
  sucursalesPorPromo: Record<string, string[]>;
  medidasPorPromo: Record<string, string[]>;
  saboresPorPromo: Record<string, string[]>;
  comboItemsPorPromo: Record<string, PromocionComboItem[]>;
}> {
  const [
    { data: relProductos },
    { data: relSucursales },
    { data: relMedidas },
    { data: relSabores },
    { data: relComboItems },
  ] = await Promise.all([
    supabase
      .from("promociones_productos")
      .select("promocion_id, producto_id")
      .in("promocion_id", promocionIds),
    supabase
      .from("promocion_sucursales")
      .select("promocion_id, sucursal_id")
      .in("promocion_id", promocionIds),
    supabase
      .from("promocion_medidas")
      .select("promocion_id, medida_id")
      .in("promocion_id", promocionIds),
    supabase
      .from("promocion_sabores")
      .select("promocion_id, sabor_id")
      .in("promocion_id", promocionIds),
    supabase
      .from("promocion_combo_items")
      .select(
        "id, promocion_id, producto_id, medida_id, orden, es_ancla, categoria_medidas(nombre), productos(nombre)",
      )
      .in("promocion_id", promocionIds)
      .order("orden", { ascending: true }),
  ]);

  const productosPorPromo: Record<string, string[]> = {};
  const sucursalesPorPromo: Record<string, string[]> = {};
  const medidasPorPromo: Record<string, string[]> = {};
  const saboresPorPromo: Record<string, string[]> = {};
  const comboItemsPorPromo: Record<string, PromocionComboItem[]> = {};

  for (const r of relProductos ?? []) {
    if (r.promocion_id && r.producto_id) {
      (productosPorPromo[r.promocion_id] ??= []).push(r.producto_id);
    }
  }
  for (const r of relSucursales ?? []) {
    if (r.promocion_id && r.sucursal_id) {
      (sucursalesPorPromo[r.promocion_id] ??= []).push(r.sucursal_id);
    }
  }
  for (const r of relMedidas ?? []) {
    if (r.promocion_id && r.medida_id) {
      (medidasPorPromo[r.promocion_id] ??= []).push(r.medida_id);
    }
  }
  for (const r of relSabores ?? []) {
    if (r.promocion_id && r.sabor_id) {
      (saboresPorPromo[r.promocion_id] ??= []).push(r.sabor_id);
    }
  }
  for (const r of (relComboItems as Array<{
    id: string;
    promocion_id: string;
    producto_id: string;
    medida_id: string | null;
    orden: number;
    es_ancla: boolean;
    categoria_medidas: { nombre: string } | null;
    productos: { nombre: string } | null;
  }>) ?? []) {
    (comboItemsPorPromo[r.promocion_id] ??= []).push({
      id: r.id,
      producto_id: r.producto_id,
      medida_id: r.medida_id,
      medida_nombre: r.categoria_medidas?.nombre ?? null,
      producto_nombre: r.productos?.nombre ?? null,
      orden: r.orden,
      es_ancla: r.es_ancla,
    });
  }

  return {
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  };
}

function enriquecerPromociones(
  promociones: Promocion[],
  productosPorPromo: Record<string, string[]>,
  sucursalesPorPromo: Record<string, string[]>,
  medidasPorPromo: Record<string, string[]>,
  saboresPorPromo: Record<string, string[]>,
  comboItemsPorPromo: Record<string, PromocionComboItem[]>,
): PromocionConProductos[] {
  return promociones.map((p) => ({
    ...p,
    productos_ids: productosPorPromo[p.id] ?? [],
    sucursales_ids: sucursalesPorPromo[p.id] ?? [],
    medidas_ids: medidasPorPromo[p.id] ?? [],
    sabores_ids: saboresPorPromo[p.id] ?? [],
    combo_items: comboItemsPorPromo[p.id] ?? [],
  }));
}

// ─── Consultas ────────────────────────────────────────────────────────────

export async function getPromociones(): Promise<PromocionConProductos[]> {
  const supabase = await createClient();

  const { data: promociones, error } = await supabase
    .from("promociones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!promociones || promociones.length === 0) return [];

  const {
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  } = await cargarRelaciones(
    supabase,
    promociones.map((p) => p.id),
  );

  return enriquecerPromociones(
    promociones,
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  );
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

  const {
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  } = await cargarRelaciones(supabase, [id]);

  return {
    ...data,
    productos_ids: productosPorPromo[id] ?? [],
    sucursales_ids: sucursalesPorPromo[id] ?? [],
    medidas_ids: medidasPorPromo[id] ?? [],
    sabores_ids: saboresPorPromo[id] ?? [],
    combo_items: comboItemsPorPromo[id] ?? [],
  };
}

/** Retorna promociones activas, vigentes y aplicables a la sucursal dada */
export async function getPromocionesActivas(
  sucursalId: string,
): Promise<PromocionActivaPOS[]> {
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

  const {
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  } = await cargarRelaciones(
    supabase,
    promociones.map((p) => p.id),
  );

  const enriquecidas = enriquecerPromociones(
    promociones,
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
    saboresPorPromo,
    comboItemsPorPromo,
  );

  // Filtrar por sucursal: si tiene sucursales asignadas, solo incluir si la sucursal actual está
  // Si no tiene sucursales (vacío), aplica a todas
  return enriquecidas.filter((p) => {
    // Filtro por sucursal
    if (p.sucursales_ids.length > 0 && !p.sucursales_ids.includes(sucursalId)) {
      return false;
    }
    // Filtro por día de la semana y hora (en memoria)
    return esPromocionVigente(p);
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────

type CreatePromocionData = {
  nombre: string;
  descripcion?: string | null;
  tipo_promocion: Database["public"]["Enums"]["tipo_promocion"];
  tipo_descuento: string;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  dias_semana?: number[] | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  pedido_minimo?: number | null;
  precio_combo?: number | null;
  productos_ids?: string[];
  sucursales_ids?: string[];
  medidas_ids?: string[];
  tipos_pedido?: string[] | null;
  permite_modificaciones?: boolean;
  nivel_membresia_id?: string | null;
  precio_dinamico?: boolean;
  sabores_ids?: string[];
  combo_items?: Array<{
    producto_id: string;
    medida_id: string | null;
    orden: number;
    es_ancla: boolean;
  }>;
};

export async function createPromocion(
  data: CreatePromocionData,
): Promise<Promocion> {
  const supabase = await createClient();
  const {
    productos_ids,
    sucursales_ids,
    medidas_ids,
    sabores_ids,
    combo_items,
    ...promoData
  } = data;

  const { data: promo, error } = await supabase
    .from("promociones")
    .insert({
      ...promoData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insertar combo items (nueva tabla explícita)
  if (combo_items && combo_items.length > 0) {
    const { error: ciError } = await supabase
      .from("promocion_combo_items")
      .insert(
        combo_items.map((ci) => ({
          promocion_id: promo.id,
          producto_id: ci.producto_id,
          medida_id: ci.medida_id,
          orden: ci.orden,
          es_ancla: ci.es_ancla,
        })),
      );
    if (ciError) throw new Error(ciError.message);
  }

  // Insertar relaciones legacy (para descuento/2x1)
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

  if (sucursales_ids && sucursales_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promocion_sucursales")
      .insert(
        sucursales_ids.map((sid) => ({
          promocion_id: promo.id,
          sucursal_id: sid,
        })),
      );
    if (relError) throw new Error(relError.message);
  }

  if (medidas_ids && medidas_ids.length > 0) {
    const { error: relError } = await supabase.from("promocion_medidas").insert(
      medidas_ids.map((mid) => ({
        promocion_id: promo.id,
        medida_id: mid,
      })),
    );
    if (relError) throw new Error(relError.message);
  }

  if (sabores_ids && sabores_ids.length > 0) {
    const { error: relError } = await supabase.from("promocion_sabores").insert(
      sabores_ids.map((sid) => ({
        promocion_id: promo.id,
        sabor_id: sid,
      })),
    );
    if (relError) throw new Error(relError.message);
  }
  return promo;
}

export async function updatePromocion(
  id: string,
  data: CreatePromocionData,
): Promise<void> {
  const supabase = await createClient();
  const {
    productos_ids,
    sucursales_ids,
    medidas_ids,
    sabores_ids,
    combo_items,
    ...promoData
  } = data;

  const { error } = await supabase
    .from("promociones")
    .update({ ...promoData, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Reemplazar relaciones (delete + insert)
  await supabase.from("promocion_combo_items").delete().eq("promocion_id", id);
  await supabase.from("promociones_productos").delete().eq("promocion_id", id);
  await supabase.from("promocion_sucursales").delete().eq("promocion_id", id);
  await supabase.from("promocion_medidas").delete().eq("promocion_id", id);
  await supabase.from("promocion_sabores").delete().eq("promocion_id", id);

  if (combo_items && combo_items.length > 0) {
    const { error: ciError } = await supabase
      .from("promocion_combo_items")
      .insert(
        combo_items.map((ci) => ({
          promocion_id: id,
          producto_id: ci.producto_id,
          medida_id: ci.medida_id,
          orden: ci.orden,
          es_ancla: ci.es_ancla,
        })),
      );
    if (ciError) throw new Error(ciError.message);
  }

  if (productos_ids && productos_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promociones_productos")
      .insert(
        productos_ids.map((pid) => ({ promocion_id: id, producto_id: pid })),
      );
    if (relError) throw new Error(relError.message);
  }

  if (sucursales_ids && sucursales_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promocion_sucursales")
      .insert(
        sucursales_ids.map((sid) => ({ promocion_id: id, sucursal_id: sid })),
      );
    if (relError) throw new Error(relError.message);
  }

  if (medidas_ids && medidas_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promocion_medidas")
      .insert(medidas_ids.map((mid) => ({ promocion_id: id, medida_id: mid })));
    if (relError) throw new Error(relError.message);
  }

  if (sabores_ids && sabores_ids.length > 0) {
    const { error: relError } = await supabase
      .from("promocion_sabores")
      .insert(sabores_ids.map((sid) => ({ promocion_id: id, sabor_id: sid })));
    if (relError) throw new Error(relError.message);
  }
}

export async function deletePromocion(id: string): Promise<void> {
  const supabase = await createClient();

  await supabase.from("promocion_combo_items").delete().eq("promocion_id", id);
  await supabase.from("promociones_productos").delete().eq("promocion_id", id);
  await supabase.from("promocion_sucursales").delete().eq("promocion_id", id);
  await supabase.from("promocion_medidas").delete().eq("promocion_id", id);
  await supabase.from("promocion_sabores").delete().eq("promocion_id", id);

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
