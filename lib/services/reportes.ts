import { createClient } from "@/lib/supabase/server";
import { TIPO_PEDIDO } from "@/lib/constants";

// ─── Constantes ───────────────────────────────────────────────────────────────

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltrosReporte = {
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string; // YYYY-MM-DD
  sucursalId?: string | null;
  tipoPedido?: string | null;
};

export type ResumenVentas = {
  total_ventas: number;
  num_ventas: number;
  promedio_venta: number;
  total_delivery_fees: number;
  num_delivery: number;
  num_local: number;
  num_para_llevar: number;
};

export type VentaPorDia = {
  fecha: string; // YYYY-MM-DD
  fecha_label: string; // "Lun 7 Abr"
  total: number;
  cantidad: number;
};

export type VentaPorTipo = {
  tipo: string;
  label: string;
  total: number;
  cantidad: number;
  porcentaje: number;
};

export type VentaPorSucursal = {
  sucursal_id: string;
  sucursal_nombre: string;
  total: number;
  cantidad: number;
  promedio: number;
};

export type DetalleDelivery = {
  metodo: "propio" | "tercero";
  label: string;
  cantidad: number;
  total_fees: number;
  promedio_fee: number;
};

export type TopProducto = {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  total: number;
};

export type VentaDetalle = {
  id: string;
  numero_venta: number;
  fecha: string;
  tipo_pedido: string;
  metodo_pago: string;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  cajero_nombre: string | null;
  sucursal_nombre: string | null;
  delivery_method: string | null;
  third_party_name: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fechaLimaToRangoUTC(fecha: string): {
  desde: string;
  hasta: string;
} {
  // fecha: YYYY-MM-DD en horario Lima (UTC-5)
  const [y, m, d] = fecha.split("-").map(Number);
  // Medianoche Lima = UTC 05:00
  const desde = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
  // Fin día Lima 23:59:59.999 = UTC 04:59:59.999 del día siguiente
  const hasta = new Date(Date.UTC(y, m - 1, d + 1, 4, 59, 59, 999));
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

function rangoFechasUTC(
  fechaDesde: string,
  fechaHasta: string,
): { desde: string; hasta: string } {
  const { desde } = fechaLimaToRangoUTC(fechaDesde);
  const { hasta } = fechaLimaToRangoUTC(fechaHasta);
  return { desde, hasta };
}

function utcToFechaLima(isoString: string): string {
  const utcMs = new Date(isoString).getTime();
  const limaDate = new Date(utcMs - LIMA_OFFSET_MS);
  const y = limaDate.getUTCFullYear();
  const m = String(limaDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(limaDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFechaLabel(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const TIPO_LABELS: Record<string, string> = {
  [TIPO_PEDIDO.EN_LOCAL]: "En Local",
  [TIPO_PEDIDO.PARA_LLEVAR]: "Para Llevar",
  [TIPO_PEDIDO.DELIVERY]: "Delivery",
};

// ─── Tipos raw de Supabase ────────────────────────────────────────────────────

type VentaRaw = {
  id: string;
  numero_venta: number;
  created_at: string | null;
  subtotal: number;
  total: number;
  delivery_fee: number | null;
  delivery_method: string | null;
  third_party_name: string | null;
  metodo_pago: string | null;
  sucursal_origen_id: string;
  ordenes: { tipo_pedido: string } | null;
  cajero: { nombre: string; apellido_paterno: string } | null;
  sucursal: { nombre: string } | null;
};

// ─── Funciones de servicio ────────────────────────────────────────────────────

async function getVentasBase(filtros: FiltrosReporte): Promise<VentaRaw[]> {
  const supabase = await createClient();
  const { desde, hasta } = rangoFechasUTC(
    filtros.fechaDesde,
    filtros.fechaHasta,
  );

  let query = supabase
    .from("ventas")
    .select(
      `id, numero_venta, created_at, subtotal, total, delivery_fee, delivery_method, third_party_name, metodo_pago, sucursal_origen_id,
       ordenes!ventas_orden_id_fkey(tipo_pedido),
       cajero:profiles!ventas_cajero_id_fkey(nombre, apellido_paterno),
       sucursal:sucursales!ventas_sucursal_origen_id_fkey(nombre)`,
    )
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .order("created_at", { ascending: false });

  if (filtros.sucursalId) {
    query = query.eq("sucursal_origen_id", filtros.sucursalId);
  }

  if (filtros.tipoPedido) {
    // filtrar por tipo de pedido a través de ordenes
    // Se filtra en memoria porque el join anidado no permite filter directo
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const raw = (data ?? []) as unknown as VentaRaw[];

  if (filtros.tipoPedido) {
    return raw.filter((v) => v.ordenes?.tipo_pedido === filtros.tipoPedido);
  }

  return raw;
}

export async function getResumenVentas(
  filtros: FiltrosReporte,
): Promise<ResumenVentas> {
  const ventas = await getVentasBase(filtros);

  if (ventas.length === 0) {
    return {
      total_ventas: 0,
      num_ventas: 0,
      promedio_venta: 0,
      total_delivery_fees: 0,
      num_delivery: 0,
      num_local: 0,
      num_para_llevar: 0,
    };
  }

  const total_ventas = ventas.reduce((s, v) => s + v.total, 0);
  const num_ventas = ventas.length;
  const promedio_venta = total_ventas / num_ventas;

  const deliveries = ventas.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.DELIVERY,
  );
  const total_delivery_fees = deliveries.reduce(
    (s, v) => s + (v.delivery_fee ?? 0),
    0,
  );
  const num_delivery = deliveries.length;
  const num_local = ventas.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.EN_LOCAL,
  ).length;
  const num_para_llevar = ventas.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.PARA_LLEVAR,
  ).length;

  return {
    total_ventas,
    num_ventas,
    promedio_venta,
    total_delivery_fees,
    num_delivery,
    num_local,
    num_para_llevar,
  };
}

export async function getVentasPorDia(
  filtros: FiltrosReporte,
): Promise<VentaPorDia[]> {
  const ventas = await getVentasBase(filtros);

  const porDia: Record<string, { total: number; cantidad: number }> = {};

  for (const v of ventas) {
    if (!v.created_at) continue;
    const fecha = utcToFechaLima(v.created_at);
    if (!porDia[fecha]) porDia[fecha] = { total: 0, cantidad: 0 };
    porDia[fecha].total += v.total;
    porDia[fecha].cantidad += 1;
  }

  return Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, stats]) => ({
      fecha,
      fecha_label: formatFechaLabel(fecha),
      ...stats,
    }));
}

export async function getVentasPorTipo(
  filtros: FiltrosReporte,
): Promise<VentaPorTipo[]> {
  const ventasAll = await getVentasBase({ ...filtros, tipoPedido: null });
  const totalGeneral = ventasAll.reduce((s, v) => s + v.total, 0);

  const tipos = Object.values(TIPO_PEDIDO);
  return tipos.map((tipo) => {
    const ventasTipo = ventasAll.filter((v) => v.ordenes?.tipo_pedido === tipo);
    const total = ventasTipo.reduce((s, v) => s + v.total, 0);
    const cantidad = ventasTipo.length;
    return {
      tipo,
      label: TIPO_LABELS[tipo] ?? tipo,
      total,
      cantidad,
      porcentaje: totalGeneral > 0 ? (total / totalGeneral) * 100 : 0,
    };
  });
}

export async function getVentasPorSucursal(
  filtros: FiltrosReporte,
): Promise<VentaPorSucursal[]> {
  // Para admin: sin filtro de sucursal
  const ventasAll = await getVentasBase({ ...filtros, sucursalId: null });

  const porSucursal: Record<
    string,
    { nombre: string; total: number; cantidad: number }
  > = {};

  for (const v of ventasAll) {
    const id = v.sucursal_origen_id;
    const nombre = v.sucursal?.nombre ?? "Desconocida";
    if (!porSucursal[id]) porSucursal[id] = { nombre, total: 0, cantidad: 0 };
    porSucursal[id].total += v.total;
    porSucursal[id].cantidad += 1;
  }

  return Object.entries(porSucursal).map(([id, stats]) => ({
    sucursal_id: id,
    sucursal_nombre: stats.nombre,
    total: stats.total,
    cantidad: stats.cantidad,
    promedio: stats.cantidad > 0 ? stats.total / stats.cantidad : 0,
  }));
}

export async function getDetalleDelivery(
  filtros: FiltrosReporte,
): Promise<DetalleDelivery[]> {
  const ventas = await getVentasBase({
    ...filtros,
    tipoPedido: TIPO_PEDIDO.DELIVERY,
  });

  const propio = ventas.filter((v) => v.delivery_method === "propio");
  const tercero = ventas.filter((v) => v.delivery_method === "tercero");

  const calcular = (
    lista: VentaRaw[],
    metodo: "propio" | "tercero",
    label: string,
  ): DetalleDelivery => {
    const cantidad = lista.length;
    const total_fees = lista.reduce((s, v) => s + (v.delivery_fee ?? 0), 0);
    return {
      metodo,
      label,
      cantidad,
      total_fees,
      promedio_fee: cantidad > 0 ? total_fees / cantidad : 0,
    };
  };

  return [
    calcular(propio, "propio", "Delivery Propio"),
    calcular(tercero, "tercero", "Delivery Tercero"),
  ];
}

export async function getTopProductos(
  filtros: FiltrosReporte,
  limit = 10,
): Promise<TopProducto[]> {
  const supabase = await createClient();
  const { desde, hasta } = rangoFechasUTC(
    filtros.fechaDesde,
    filtros.fechaHasta,
  );

  type VentaItemRaw = {
    producto_id: string;
    producto_nombre: string;
    cantidad: number;
    subtotal: number;
    venta: { sucursal_origen_id: string } | null;
  };

  let query = supabase
    .from("venta_items")
    .select(
      "producto_id, producto_nombre, cantidad, subtotal, venta:ventas!venta_items_venta_id_fkey(sucursal_origen_id, created_at)",
    )
    .gte("venta.created_at", desde)
    .lte("venta.created_at", hasta);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []) as unknown as VentaItemRaw[];

  const filtrados = filtros.sucursalId
    ? items.filter((i) => i.venta?.sucursal_origen_id === filtros.sucursalId)
    : items;

  const porProducto: Record<
    string,
    { nombre: string; cantidad: number; total: number }
  > = {};
  for (const item of filtrados) {
    if (!porProducto[item.producto_id]) {
      porProducto[item.producto_id] = {
        nombre: item.producto_nombre,
        cantidad: 0,
        total: 0,
      };
    }
    porProducto[item.producto_id].cantidad += item.cantidad;
    porProducto[item.producto_id].total += item.subtotal;
  }

  return Object.entries(porProducto)
    .map(([id, stats]) => ({
      producto_id: id,
      producto_nombre: stats.nombre,
      cantidad: stats.cantidad,
      total: stats.total,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
}

export async function getVentasDetalle(
  filtros: FiltrosReporte,
  limit = 50,
): Promise<VentaDetalle[]> {
  const ventas = await getVentasBase(filtros);

  return ventas.slice(0, limit).map((v) => ({
    id: v.id,
    numero_venta: v.numero_venta,
    fecha: v.created_at ? utcToFechaLima(v.created_at) : "",
    tipo_pedido: v.ordenes?.tipo_pedido ?? "",
    metodo_pago: v.metodo_pago ?? "—",
    subtotal: v.subtotal,
    delivery_fee: v.delivery_fee,
    total: v.total,
    cajero_nombre: v.cajero
      ? `${v.cajero.nombre} ${v.cajero.apellido_paterno}`
      : null,
    sucursal_nombre: v.sucursal?.nombre ?? null,
    delivery_method: v.delivery_method,
    third_party_name: v.third_party_name,
  }));
}
