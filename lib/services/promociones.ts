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

export type PromocionConProductos = Promocion & {
  productos_ids: string[];
  sucursales_ids: string[];
  medidas_ids: string[];
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
}> {
  const [
    { data: relProductos },
    { data: relSucursales },
    { data: relMedidas },
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
  ]);

  const productosPorPromo: Record<string, string[]> = {};
  const sucursalesPorPromo: Record<string, string[]> = {};
  const medidasPorPromo: Record<string, string[]> = {};

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

  return { productosPorPromo, sucursalesPorPromo, medidasPorPromo };
}

function enriquecerPromociones(
  promociones: Promocion[],
  productosPorPromo: Record<string, string[]>,
  sucursalesPorPromo: Record<string, string[]>,
  medidasPorPromo: Record<string, string[]>,
): PromocionConProductos[] {
  return promociones.map((p) => ({
    ...p,
    productos_ids: productosPorPromo[p.id] ?? [],
    sucursales_ids: sucursalesPorPromo[p.id] ?? [],
    medidas_ids: medidasPorPromo[p.id] ?? [],
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

  const { productosPorPromo, sucursalesPorPromo, medidasPorPromo } =
    await cargarRelaciones(
      supabase,
      promociones.map((p) => p.id),
    );

  return enriquecerPromociones(
    promociones,
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
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

  const { productosPorPromo, sucursalesPorPromo, medidasPorPromo } =
    await cargarRelaciones(supabase, [id]);

  return {
    ...data,
    productos_ids: productosPorPromo[id] ?? [],
    sucursales_ids: sucursalesPorPromo[id] ?? [],
    medidas_ids: medidasPorPromo[id] ?? [],
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

  const { productosPorPromo, sucursalesPorPromo, medidasPorPromo } =
    await cargarRelaciones(
      supabase,
      promociones.map((p) => p.id),
    );

  const enriquecidas = enriquecerPromociones(
    promociones,
    productosPorPromo,
    sucursalesPorPromo,
    medidasPorPromo,
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
};

export async function createPromocion(
  data: CreatePromocionData,
): Promise<Promocion> {
  const supabase = await createClient();
  const { productos_ids, sucursales_ids, medidas_ids, ...promoData } = data;

  const { data: promo, error } = await supabase
    .from("promociones")
    .insert({
      ...promoData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insertar relaciones
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
  return promo;
}

export async function updatePromocion(
  id: string,
  data: CreatePromocionData,
): Promise<void> {
  const supabase = await createClient();
  const { productos_ids, sucursales_ids, medidas_ids, ...promoData } = data;

  const { error } = await supabase
    .from("promociones")
    .update({ ...promoData, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Reemplazar relaciones (delete + insert)
  await supabase.from("promociones_productos").delete().eq("promocion_id", id);
  await supabase.from("promocion_sucursales").delete().eq("promocion_id", id);
  await supabase.from("promocion_medidas").delete().eq("promocion_id", id);

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
}

export async function deletePromocion(id: string): Promise<void> {
  const supabase = await createClient();

  await supabase.from("promociones_productos").delete().eq("promocion_id", id);
  await supabase.from("promocion_sucursales").delete().eq("promocion_id", id);
  await supabase.from("promocion_medidas").delete().eq("promocion_id", id);

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
