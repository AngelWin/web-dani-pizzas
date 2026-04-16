import { createClient } from "@/lib/supabase/server";
import {
  updateEstadoMesa,
  liberarMesaSiCorresponde,
} from "@/lib/services/mesas";
import { getHoyLima } from "@/lib/utils/fecha";
import type { Database } from "@/types/database";

export type Orden = Database["public"]["Tables"]["ordenes"]["Row"];
export type OrdenItem = Database["public"]["Tables"]["orden_items"]["Row"];
export type OrdenEstadoHistorial =
  Database["public"]["Tables"]["orden_estado_historial"]["Row"];
export type EstadoOrden = Database["public"]["Enums"]["estado_orden"];
export type TipoPedido = Database["public"]["Enums"]["tipo_pedido"];
export type DeliveryMethod =
  Database["public"]["Enums"]["delivery_method_tipo"];
export type EstadoDelivery = Database["public"]["Enums"]["estado_delivery"];

export type HistorialConUsuario = OrdenEstadoHistorial & {
  cambiado_por_profile: { nombre: string; apellido_paterno: string } | null;
};

export type OrdenConItems = Orden & {
  orden_items: OrdenItem[];
  cajero: { nombre: string; apellido_paterno: string } | null;
  repartidor: { nombre: string; apellido_paterno: string } | null;
  cliente: { nombre: string; apellido: string | null } | null;
  orden_estado_historial: HistorialConUsuario[];
  sucursal: { nombre: string } | null;
};

export type FiltroEstadoOrden = EstadoOrden | "todas" | "activas";

// ─── Consultas ─────────────────────────────────────────────────────────────

export type OrdenProgramadaResumen = {
  id: string;
  numero_orden: number;
  entrega_programada_at: string;
  total: number;
  tipo_pedido: TipoPedido;
  estado: EstadoOrden;
  cliente: { nombre: string; apellido: string | null } | null;
  sucursal: { nombre: string } | null;
};

/** Próximas N órdenes con entrega_programada_at futura (no canceladas ni entregadas) */
export async function getOrdenesProgramadasProximas(
  sucursalId: string | null,
  limit = 5,
): Promise<OrdenProgramadaResumen[]> {
  const supabase = await createClient();

  const ahora = new Date().toISOString();

  let query = supabase
    .from("ordenes")
    .select(
      `id, numero_orden, entrega_programada_at, total, tipo_pedido, estado,
       cliente:clientes!ordenes_cliente_id_fkey(nombre, apellido),
       sucursal:sucursales!ordenes_sucursal_id_fkey(nombre)`,
    )
    .not("entrega_programada_at", "is", null)
    .gte("entrega_programada_at", ahora)
    .not("estado", "in", '("entregada","cancelada")')
    .order("entrega_programada_at", { ascending: true })
    .limit(limit);

  if (sucursalId) {
    query = query.eq("sucursal_id", sucursalId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrdenProgramadaResumen[];
}

export async function getOrdenes(
  sucursalId: string | null,
  filtroEstado: FiltroEstadoOrden = "activas",
  fecha?: string, // formato YYYY-MM-DD (hora Lima UTC-5)
  mesaId?: string, // filtrar por mesa específica
): Promise<OrdenConItems[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ordenes")
    .select(
      `
      *,
      orden_items (*),
      cajero:profiles!ordenes_cajero_id_fkey (nombre, apellido_paterno),
      repartidor:profiles!ordenes_repartidor_id_fkey (nombre, apellido_paterno),
      cliente:clientes!ordenes_cliente_id_fkey (nombre, apellido),
      sucursal:sucursales!ordenes_sucursal_id_fkey (nombre),
      orden_estado_historial (
        *,
        cambiado_por_profile:profiles!orden_estado_historial_cambiado_por_fkey (nombre, apellido_paterno)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (sucursalId) {
    query = query.eq("sucursal_id", sucursalId);
  }

  if (mesaId) {
    query = query.eq("mesa_id", mesaId);
  }

  if (filtroEstado === "activas") {
    query = query.not("estado", "in", '("entregada","cancelada")');
  } else if (filtroEstado !== "todas") {
    query = query.eq("estado", filtroEstado);
  }

  // Filtro por día (Lima UTC-5): 00:00 Lima = 05:00 UTC, 23:59 Lima = 04:59 UTC siguiente
  if (fecha) {
    const inicioLima = `${fecha}T00:00:00-05:00`;
    const finLima = `${fecha}T23:59:59.999-05:00`;
    query = query.gte("created_at", inicioLima).lte("created_at", finLima);
  }

  const { data, error } = await query.limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrdenConItems[];
}

export async function getHistorialOrden(
  ordenId: string,
): Promise<HistorialConUsuario[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orden_estado_historial")
    .select(
      `
      *,
      cambiado_por_profile:profiles!orden_estado_historial_cambiado_por_fkey (nombre, apellido_paterno)
    `,
    )
    .eq("orden_id", ordenId)
    .order("cambiado_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as HistorialConUsuario[];
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

export async function cancelarOrdenConMotivo(
  ordenId: string,
  motivo: string,
): Promise<void> {
  const supabase = await createClient();

  // Obtener mesa_id antes de cancelar para poder liberarla después
  const { data: ordenPrevia, error: ordenPreviaError } = await supabase
    .from("ordenes")
    .select("mesa_id")
    .eq("id", ordenId)
    .maybeSingle();

  if (ordenPreviaError) throw new Error(ordenPreviaError.message);

  // 1. Actualizar estado → el trigger creará la entrada del historial
  const { error: updateError } = await supabase
    .from("ordenes")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", ordenId);

  if (updateError) throw new Error(updateError.message);

  // 2. Actualizar la entrada del historial recién creada con el motivo
  const { error: historialError } = await supabase
    .from("orden_estado_historial")
    .update({ notas: motivo })
    .eq("orden_id", ordenId)
    .eq("estado_hasta", "cancelada")
    .order("cambiado_at", { ascending: false })
    .limit(1);

  // No lanzar error si falla la nota — el estado ya fue actualizado
  if (historialError) {
    console.error(
      "No se pudo guardar el motivo de cancelación:",
      historialError.message,
    );
  }

  // 3. Liberar mesa si no tiene más órdenes activas
  if (ordenPrevia?.mesa_id) {
    await liberarMesaSiCorresponde(ordenPrevia.mesa_id);
  }
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
  cliente_id?: string | null;
  tipo_pedido: TipoPedido;
  notas?: string | null;
  mesa_id?: string | null;
  mesa_referencia?: string | null;
  // Delivery
  delivery_method?: DeliveryMethod | null;
  delivery_fee?: number;
  delivery_address?: string | null;
  delivery_referencia?: string | null;
  repartidor_id?: string | null;
  third_party_name?: string | null;
  // Promoción
  promocion_id?: string | null;
  descuento?: number;
  // Pedido programado
  entrega_programada_at?: string | null;
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
    sabores?:
      | {
          sabor_id: string;
          sabor_nombre: string;
          proporcion: string;
          exclusiones: string[];
        }[]
      | null;
    extras?: { extra_id: string; nombre: string; precio: number }[] | null;
    acompanante?: {
      variante_id: string;
      variante_nombre: string;
      sabor_id: string;
      sabor_nombre: string;
    } | null;
  }[];
};

export async function crearOrden(data: CrearOrdenData): Promise<Orden> {
  const supabase = await createClient();

  const { items, ...ordenData } = data;

  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const deliveryFee = ordenData.delivery_fee ?? 0;
  const descuento = ordenData.descuento ?? 0;
  const total = Math.max(0, subtotal - descuento + deliveryFee);

  const { data: orden, error: ordenError } = await supabase
    .from("ordenes")
    .insert({
      cajero_id: ordenData.cajero_id,
      sucursal_id: ordenData.sucursal_id,
      cliente_id: ordenData.cliente_id ?? null,
      tipo_pedido: ordenData.tipo_pedido,
      estado: "confirmada",
      subtotal,
      descuento,
      delivery_fee: deliveryFee,
      total,
      notas: ordenData.notas ?? null,
      promocion_id: ordenData.promocion_id ?? null,
      mesa_id: ordenData.mesa_id ?? null,
      mesa_referencia: ordenData.mesa_referencia ?? null,
      delivery_method: ordenData.delivery_method ?? null,
      delivery_address: ordenData.delivery_address ?? null,
      delivery_referencia: ordenData.delivery_referencia ?? null,
      repartidor_id: ordenData.repartidor_id ?? null,
      third_party_name: ordenData.third_party_name ?? null,
      entrega_programada_at: ordenData.entrega_programada_at ?? null,
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
      sabores: item.sabores ?? null,
      extras: item.extras ?? null,
      acompanante: item.acompanante ?? null,
    })),
  );

  if (itemsError) throw new Error(itemsError.message);

  // Marcar mesa como ocupada
  if (ordenData.mesa_id) {
    await updateEstadoMesa(ordenData.mesa_id, "ocupada");
  }

  return orden;
}

/**
 * Retorna el número de órdenes activas (no entregadas, no canceladas) de una sucursal.
 * Usado para mostrar advertencia antes de cerrar la sesión de caja.
 */
export async function contarOrdenesActivasSucursal(
  sucursalId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("ordenes")
    .select("id", { count: "exact", head: true })
    .eq("sucursal_id", sucursalId)
    .not("estado", "in", '("entregada","cancelada")');

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Cancela TODAS las órdenes activas (no entregadas, no canceladas) de una sucursal,
 * sin importar la fecha. Libera las mesas asociadas si corresponde.
 * Se ejecuta al cerrar la sesión de caja para limpiar el estado al final del turno.
 * Retorna la cantidad de órdenes canceladas.
 */
export async function cancelarTodasOrdenesActivasSucursal(
  sucursalId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: ordenes, error: queryError } = await supabase
    .from("ordenes")
    .select("id, mesa_id")
    .eq("sucursal_id", sucursalId)
    .not("estado", "in", '("entregada","cancelada")');

  if (queryError) throw new Error(queryError.message);
  if (!ordenes || ordenes.length === 0) return 0;

  const ordenIds = ordenes.map((o) => o.id);

  const { error: cancelError } = await supabase
    .from("ordenes")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .in("id", ordenIds);

  if (cancelError) throw new Error(cancelError.message);

  const mesaIds = [
    ...new Set(
      ordenes.filter((o) => o.mesa_id).map((o) => o.mesa_id as string),
    ),
  ];
  await Promise.all(mesaIds.map((mesaId) => liberarMesaSiCorresponde(mesaId)));

  return ordenes.length;
}

/**
 * Cancela todas las órdenes activas (no entregadas, no canceladas) de una sucursal
 * cuya fecha de creación sea anterior al día de hoy en Lima (UTC-5).
 * Libera las mesas asociadas si corresponde.
 * Retorna la cantidad de órdenes canceladas.
 */
export async function cancelarOrdenesAntiguasSucursal(
  sucursalId: string,
): Promise<number> {
  const supabase = await createClient();

  // Medianoche Lima de hoy = inicio del día actual en UTC-5
  const hoy = getHoyLima();
  const inicioDiaHoy = `${hoy}T00:00:00-05:00`;

  const { data: ordenes, error: queryError } = await supabase
    .from("ordenes")
    .select("id, mesa_id")
    .eq("sucursal_id", sucursalId)
    .not("estado", "in", '("entregada","cancelada")')
    .lt("created_at", inicioDiaHoy);

  if (queryError) throw new Error(queryError.message);
  if (!ordenes || ordenes.length === 0) return 0;

  const ordenIds = ordenes.map((o) => o.id);

  const { error: cancelError } = await supabase
    .from("ordenes")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .in("id", ordenIds);

  if (cancelError) throw new Error(cancelError.message);

  // Liberar mesas únicas que tenían órdenes canceladas
  const mesaIds = [
    ...new Set(
      ordenes.filter((o) => o.mesa_id).map((o) => o.mesa_id as string),
    ),
  ];
  await Promise.all(mesaIds.map((mesaId) => liberarMesaSiCorresponde(mesaId)));

  return ordenes.length;
}
