import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Venta = Database["public"]["Tables"]["ventas"]["Row"];
export type VentaItem = Database["public"]["Tables"]["venta_items"]["Row"];
export type DeliveryFeeConfig =
  Database["public"]["Tables"]["delivery_fees_config"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Tipo enriquecido para el catálogo del POS
export type ProductoPOS = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen_url: string | null;
  disponible: boolean | null;
  categoria_id: string | null;
  categorias: { id: string; nombre: string } | null;
  producto_variantes: {
    id: string;
    medida_id: string;
    precio: number;
    disponible: boolean;
    orden: number;
    categoria_medidas: { nombre: string } | null;
  }[];
};

// ─── Catálogo para el POS ──────────────────────────────────────────────────

export async function getProductosPOS(
  sucursalId: string,
): Promise<ProductoPOS[]> {
  const supabase = await createClient();

  // Productos disponibles globalmente
  const { data: productos, error } = await supabase
    .from("productos")
    .select(
      `id, nombre, descripcion, precio, imagen_url, disponible, categoria_id,
       categorias(id, nombre),
       producto_variantes(id, medida_id, precio, disponible, orden, categoria_medidas(nombre))`,
    )
    .eq("disponible", true)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  if (!productos) return [];

  // Filtrar por disponibilidad en la sucursal
  const { data: disponibilidades } = await supabase
    .from("producto_sucursal")
    .select("producto_id, disponible")
    .eq("sucursal_id", sucursalId);

  const dispMap = new Map<string, boolean>();
  for (const d of disponibilidades ?? []) {
    dispMap.set(d.producto_id, d.disponible);
  }

  // Un producto aparece si:
  // - No tiene registro en producto_sucursal (disponible en todas) → se incluye
  // - Tiene registro con disponible = true → se incluye
  // - Tiene registro con disponible = false → se excluye
  const filtrados = productos.filter((p) => {
    const disp = dispMap.get(p.id);
    if (disp === undefined) return true; // sin registro: disponible en todas
    return disp === true;
  });

  // Filtrar variantes no disponibles
  return filtrados.map((p) => ({
    ...p,
    categorias: Array.isArray(p.categorias)
      ? (p.categorias[0] ?? null)
      : (p.categorias as { id: string; nombre: string } | null),
    producto_variantes: (p.producto_variantes ?? []).filter(
      (v) => v.disponible,
    ),
  })) as ProductoPOS[];
}

// ─── Categorías (para filtro del POS) ─────────────────────────────────────

export async function getCategoriasConProductos(
  sucursalId: string,
): Promise<{ id: string; nombre: string }[]> {
  const productos = await getProductosPOS(sucursalId);
  const seen = new Set<string>();
  const categorias: { id: string; nombre: string }[] = [];

  for (const p of productos) {
    if (p.categorias && !seen.has(p.categorias.id)) {
      seen.add(p.categorias.id);
      categorias.push(p.categorias);
    }
  }

  return categorias;
}

// ─── Repartidores de la sucursal ───────────────────────────────────────────

export async function getRepartidoresSucursal(
  sucursalId: string,
): Promise<Pick<Profile, "id" | "nombre" | "apellido_paterno">[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre, apellido_paterno, roles!inner(nombre)")
    .eq("sucursal_id", sucursalId)
    .eq("estado", "activo")
    .eq("roles.nombre", "repartidor")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    apellido_paterno: p.apellido_paterno,
  }));
}

// ─── Tarifas de delivery ───────────────────────────────────────────────────

export async function getDeliveryFeesSucursal(
  sucursalId: string,
): Promise<{ propio: number; tercero: number }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("delivery_fees_config")
    .select("tipo, monto")
    .eq("sucursal_id", sucursalId);

  const fees = { propio: 3, tercero: 4 }; // defaults

  for (const row of data ?? []) {
    if (row.tipo === "propio") fees.propio = row.monto;
    if (row.tipo === "tercero") fees.tercero = row.monto;
  }

  return fees;
}

// ─── Crear venta ───────────────────────────────────────────────────────────

export type CrearVentaData = {
  cajero_id: string;
  sucursal_origen_id: string;
  tipo_pedido: Database["public"]["Enums"]["tipo_pedido"];
  metodo_pago: Database["public"]["Enums"]["metodo_pago"];
  subtotal: number;
  descuento: number;
  total: number;
  notas?: string | null;
  mesa_referencia?: string | null;
  // Delivery
  delivery_method?: string | null;
  delivery_fee?: number | null;
  delivery_address?: string | null;
  delivery_referencia?: string | null;
  repartidor_id?: string | null;
  third_party_name?: string | null;
  // Items
  items: {
    producto_id: string;
    variante_id?: string | null;
    cantidad: number;
    producto_nombre: string;
    variante_nombre?: string | null;
    producto_precio: number;
    subtotal: number;
  }[];
};

export async function crearVenta(data: CrearVentaData): Promise<Venta> {
  const supabase = await createClient();

  const { items, ...ventaData } = data;

  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      cajero_id: ventaData.cajero_id,
      sucursal_origen_id: ventaData.sucursal_origen_id,
      tipo_pedido: ventaData.tipo_pedido,
      metodo_pago: ventaData.metodo_pago,
      subtotal: ventaData.subtotal,
      descuento: ventaData.descuento,
      total: ventaData.total,
      notas: ventaData.notas ?? null,
      mesa_referencia: ventaData.mesa_referencia ?? null,
      delivery_method: ventaData.delivery_method ?? null,
      delivery_fee: ventaData.delivery_fee ?? null,
      delivery_address: ventaData.delivery_address ?? null,
      delivery_referencia: ventaData.delivery_referencia ?? null,
      repartidor_id: ventaData.repartidor_id ?? null,
      third_party_name: ventaData.third_party_name ?? null,
      delivery_status:
        ventaData.tipo_pedido === "delivery" ? "pendiente" : null,
      delivery_status_updated_at:
        ventaData.tipo_pedido === "delivery" ? new Date().toISOString() : null,
      estado_pago_v2: "pagado",
    })
    .select()
    .single();

  if (ventaError) throw new Error(ventaError.message);

  const ventaItems = items.map((item) => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    variante_id: item.variante_id ?? null,
    cantidad: item.cantidad,
    producto_nombre: item.producto_nombre,
    variante_nombre: item.variante_nombre ?? null,
    producto_precio: item.producto_precio,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from("venta_items")
    .insert(ventaItems);

  if (itemsError) throw new Error(itemsError.message);

  return venta;
}
