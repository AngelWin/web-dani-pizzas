import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Categoria = Database["public"]["Tables"]["categorias"]["Row"];
export type Producto = Database["public"]["Tables"]["productos"]["Row"];
export type CategoriaMedida =
  Database["public"]["Tables"]["categoria_medidas"]["Row"];
export type ProductoVariante =
  Database["public"]["Tables"]["producto_variantes"]["Row"] & {
    categoria_medidas: Pick<
      CategoriaMedida,
      "nombre" | "permite_combinacion"
    > | null;
  };
export type ProductoSucursal =
  Database["public"]["Tables"]["producto_sucursal"]["Row"];
export type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];
export type PizzaSabor = Database["public"]["Tables"]["pizza_sabores"]["Row"];
export type SaborIngrediente =
  Database["public"]["Tables"]["sabor_ingredientes"]["Row"];
export type ProductoExtra =
  Database["public"]["Tables"]["producto_extras"]["Row"];
export type PizzaSaborConIngredientes = PizzaSabor & {
  sabor_ingredientes: SaborIngrediente[];
};

export type ProductoConCategoria = Producto & {
  categorias: Pick<Categoria, "id" | "nombre"> | null;
};

export type ProductoCompleto = ProductoConCategoria & {
  producto_variantes: ProductoVariante[];
  producto_sucursal: ProductoSucursal[];
};

// ─── Categorías ────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCategoria(id: string): Promise<Categoria | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// ─── Medidas por categoría ─────────────────────────────────────────────────

export async function getMedidasByCategoria(
  categoriaId: string,
): Promise<CategoriaMedida[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categoria_medidas")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllCategoriaMedidas(): Promise<
  Record<string, CategoriaMedida[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categoria_medidas")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped: Record<string, CategoriaMedida[]> = {};
  for (const medida of data ?? []) {
    if (!grouped[medida.categoria_id]) {
      grouped[medida.categoria_id] = [];
    }
    grouped[medida.categoria_id].push(medida);
  }
  return grouped;
}

// ─── Sucursales ────────────────────────────────────────────────────────────

export async function getSucursales(): Promise<Sucursal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Productos ─────────────────────────────────────────────────────────────

export interface GetProductosOptions {
  page?: number;
  perPage?: number;
  categoriaId?: string | null;
  disponible?: boolean | null;
  search?: string;
}

export interface ProductosPaginados {
  data: ProductoConCategoria[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getProductos(
  options: GetProductosOptions = {},
): Promise<ProductosPaginados> {
  const supabase = await createClient();
  const { page = 1, perPage = 10, categoriaId, disponible, search } = options;

  let query = supabase
    .from("productos")
    .select("*, categorias(id, nombre)", { count: "exact" });

  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
  }
  if (disponible !== null && disponible !== undefined) {
    query = query.eq("disponible", disponible);
  }
  if (search) {
    query = query.ilike("nombre", `%${search}%`);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await query
    .order("nombre", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data as ProductoConCategoria[]) ?? [],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProducto(
  id: string,
): Promise<ProductoConCategoria | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, categorias(id, nombre)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProductoConCategoria;
}

export async function getProductoCompleto(
  id: string,
): Promise<ProductoCompleto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select(
      `*,
      categorias(id, nombre),
      producto_variantes(*, categoria_medidas(nombre)),
      producto_sucursal(*)`,
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProductoCompleto;
}

export async function getTotalProductos(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

// ─── Pizza Sabores ─────────────────────────────────────────────────────────

export async function getPizzaSaboresByCategoria(
  categoriaId: string,
): Promise<PizzaSaborConIngredientes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pizza_sabores")
    .select("*, sabor_ingredientes(*)")
    .eq("categoria_id", categoriaId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PizzaSaborConIngredientes[];
}

export async function getAllPizzaSabores(): Promise<
  Record<string, PizzaSaborConIngredientes[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pizza_sabores")
    .select("*, sabor_ingredientes(*)")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped: Record<string, PizzaSaborConIngredientes[]> = {};
  for (const sabor of (data ?? []) as PizzaSaborConIngredientes[]) {
    if (!grouped[sabor.categoria_id]) {
      grouped[sabor.categoria_id] = [];
    }
    grouped[sabor.categoria_id].push(sabor);
  }
  return grouped;
}

export async function createPizzaSabor(data: {
  categoria_id: string;
  nombre: string;
  descripcion?: string | null;
  disponible?: boolean;
  orden?: number;
}): Promise<PizzaSabor> {
  const supabase = await createClient();
  const { data: sabor, error } = await supabase
    .from("pizza_sabores")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return sabor;
}

export async function updatePizzaSabor(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string | null;
    disponible?: boolean;
    orden?: number;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pizza_sabores")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deletePizzaSabor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pizza_sabores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertSaborIngredientes(
  saborId: string,
  ingredientes: { nombre: string; es_principal: boolean; orden: number }[],
): Promise<void> {
  const supabase = await createClient();

  // Eliminar los existentes y reinsertar
  const { error: delError } = await supabase
    .from("sabor_ingredientes")
    .delete()
    .eq("sabor_id", saborId);

  if (delError) throw new Error(delError.message);

  if (ingredientes.length === 0) return;

  const { error: insError } = await supabase.from("sabor_ingredientes").insert(
    ingredientes.map((ing) => ({
      sabor_id: saborId,
      nombre: ing.nombre,
      es_principal: ing.es_principal,
      orden: ing.orden,
    })),
  );

  if (insError) throw new Error(insError.message);
}

// ─── Producto Extras ───────────────────────────────────────────────────────

export async function getProductoExtrasByCategoria(
  categoriaId: string,
): Promise<ProductoExtra[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_extras")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllProductoExtras(): Promise<
  Record<string, ProductoExtra[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_extras")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped: Record<string, ProductoExtra[]> = {};
  for (const extra of data ?? []) {
    if (!grouped[extra.categoria_id]) {
      grouped[extra.categoria_id] = [];
    }
    grouped[extra.categoria_id].push(extra);
  }
  return grouped;
}

export async function createProductoExtra(data: {
  categoria_id: string;
  nombre: string;
  precio: number;
  disponible?: boolean;
  orden?: number;
}): Promise<ProductoExtra> {
  const supabase = await createClient();
  const { data: extra, error } = await supabase
    .from("producto_extras")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return extra;
}

export async function updateProductoExtra(
  id: string,
  data: {
    nombre?: string;
    precio?: number;
    disponible?: boolean;
    orden?: number;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("producto_extras")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteProductoExtra(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("producto_extras")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
