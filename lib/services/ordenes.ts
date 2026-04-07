import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Orden = Database["public"]["Tables"]["ordenes"]["Row"];
export type OrdenItem = Database["public"]["Tables"]["orden_items"]["Row"];
export type EstadoOrden = Database["public"]["Enums"]["estado_orden"];
export type TipoPedido = Database["public"]["Enums"]["tipo_pedido"];
export type DeliveryMethod =
  Database["public"]["Enums"]["delivery_method_tipo"];
export type EstadoDelivery = Database["public"]["Enums"]["estado_delivery"];

export type OrdenConItems = Orden & {
  orden_items: OrdenItem[];
  cajero: { nombre: string; apellido_paterno: string } | null;
  repartidor: { nombre: string; apellido_paterno: string } | null;
};

export type FiltroEstadoOrden = EstadoOrden | "todas" | "activas";

// ─── Consultas ─────────────────────────────────────────────────────────────

export async function getOrdenes(
  sucursalId: string | null,
  filtroEstado: FiltroEstadoOrden = "activas",
): Promise<OrdenConItems[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ordenes")
    .select(
      `
      *,
      orden_items (*),
      cajero:profiles!ordenes_cajero_id_fkey (nombre, apellido_paterno),
      repartidor:profiles!ordenes_repartidor_id_fkey (nombre, apellido_paterno)
    `,
    )
    .order("created_at", { ascending: false });

  if (sucursalId) {
    query = query.eq("sucursal_id", sucursalId);
  }

  if (filtroEstado === "activas") {
    query = query.not("estado", "in", '("entregada","cancelada")');
  } else if (filtroEstado !== "todas") {
    query = query.eq("estado", filtroEstado);
  }

  const { data, error } = await query.limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrdenConItems[];
}

export async function actualizarEstadoOrden(
  ordenId: string,
  estado: EstadoOrden,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ordenes")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", ordenId);

  if (error) throw new Error(error.message);
}

export async function actualizarEstadoDelivery(
  ordenId: string,
  deliveryStatus: EstadoDelivery,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ordenes")
    .update({
      delivery_status: deliveryStatus,
      delivery_status_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ordenId);

  if (error) throw new Error(error.message);
}

// ─── Crear orden ───────────────────────────────────────────────────────────

export type CrearOrdenData = {
  cajero_id: string;
  sucursal_id: string;
  tipo_pedido: TipoPedido;
  notas?: string | null;
  mesa_referencia?: string | null;
  // Delivery
  delivery_method?: DeliveryMethod | null;
  delivery_fee?: number;
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
    precio_unitario: number;
    subtotal: number;
    notas_item?: string | null;
  }[];
};

export async function crearOrden(data: CrearOrdenData): Promise<Orden> {
  const supabase = await createClient();

  const { items, ...ordenData } = data;

  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const deliveryFee = ordenData.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const { data: orden, error: ordenError } = await supabase
    .from("ordenes")
    .insert({
      cajero_id: ordenData.cajero_id,
      sucursal_id: ordenData.sucursal_id,
      tipo_pedido: ordenData.tipo_pedido,
      estado: "confirmada",
      subtotal,
      descuento: 0,
      delivery_fee: deliveryFee,
      total,
      notas: ordenData.notas ?? null,
      mesa_referencia: ordenData.mesa_referencia ?? null,
      delivery_method: ordenData.delivery_method ?? null,
      delivery_address: ordenData.delivery_address ?? null,
      delivery_referencia: ordenData.delivery_referencia ?? null,
      repartidor_id: ordenData.repartidor_id ?? null,
      third_party_name: ordenData.third_party_name ?? null,
      delivery_status:
        ordenData.tipo_pedido === "delivery" ? "pendiente" : null,
      delivery_status_updated_at:
        ordenData.tipo_pedido === "delivery" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (ordenError) throw new Error(ordenError.message);

  const { error: itemsError } = await supabase.from("orden_items").insert(
    items.map((item) => ({
      orden_id: orden.id,
      producto_id: item.producto_id,
      variante_id: item.variante_id ?? null,
      cantidad: item.cantidad,
      producto_nombre: item.producto_nombre,
      variante_nombre: item.variante_nombre ?? null,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
      notas_item: item.notas_item ?? null,
    })),
  );

  if (itemsError) throw new Error(itemsError.message);

  return orden;
}
