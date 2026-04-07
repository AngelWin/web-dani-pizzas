import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Categoria = Database["public"]["Tables"]["categorias"]["Row"];
export type Producto = Database["public"]["Tables"]["productos"]["Row"];
export type CategoriaMedida =
  Database["public"]["Tables"]["categoria_medidas"]["Row"];
export type ProductoVariante =
  Database["public"]["Tables"]["producto_variantes"]["Row"] & {
    categoria_medidas: Pick<CategoriaMedida, "nombre"> | null;
  };
export type ProductoSucursal =
  Database["public"]["Tables"]["producto_sucursal"]["Row"];
export type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

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
