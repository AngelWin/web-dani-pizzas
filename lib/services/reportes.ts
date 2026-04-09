import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIPO_PEDIDO } from "@/lib/constants";

// ─── Constantes ───────────────────────────────────────────────────────────────

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltrosReporte = {
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string; // YYYY-MM-DD
  sucursalId?: string | null;
  tipoPedido?: string | null;
  esAdmin?: boolean;
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

import { TIPO_PEDIDO_LABELS } from "@/lib/constants";

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

// ─── Resultado completo del reporte ──────────────────────────────────────────

export type ReporteCompleto = {
  resumen: ResumenVentas;
  ventasPorDia: VentaPorDia[];
  ventasPorTipo: VentaPorTipo[];
  ventasPorSucursal: VentaPorSucursal[];
  detalleDelivery: DetalleDelivery[];
  ventasDetalle: VentaDetalle[];
  topProductos: TopProducto[];
};

// ─── Funciones de servicio ────────────────────────────────────────────────────

/**
 * Obtiene TODOS los datos del reporte en 2 queries (ventas + venta_items).
 * Antes eran 6 queries idénticas a `ventas` + 1 a `venta_items`.
 */
export async function getReporteCompleto(
  filtros: FiltrosReporte,
  esAdmin: boolean,
  topLimit = 10,
  detalleLimit = 50,
): Promise<ReporteCompleto> {
  const supabase = filtros.esAdmin ? createAdminClient() : await createClient();
  const { desde, hasta } = rangoFechasUTC(
    filtros.fechaDesde,
    filtros.fechaHasta,
  );

  // === 1 sola query principal a ventas (sin filtros de sucursal ni tipo para máxima reutilización) ===
  const { data: rawData, error } = await supabase
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

  if (error) throw new Error(error.message);
  const todasLasVentas = (rawData ?? []) as unknown as VentaRaw[];

  // Filtrar según los parámetros del usuario
  const ventasFiltradas = todasLasVentas.filter((v) => {
    if (filtros.sucursalId && v.sucursal_origen_id !== filtros.sucursalId)
      return false;
    if (filtros.tipoPedido && v.ordenes?.tipo_pedido !== filtros.tipoPedido)
      return false;
    return true;
  });

  // Ventas sin filtro de tipoPedido (para desglose por tipo)
  const ventasSinFiltroTipo = filtros.sucursalId
    ? todasLasVentas.filter((v) => v.sucursal_origen_id === filtros.sucursalId)
    : todasLasVentas;

  // === Resumen ===
  const total_ventas = ventasFiltradas.reduce((s, v) => s + v.total, 0);
  const num_ventas = ventasFiltradas.length;
  const deliveries = ventasFiltradas.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.DELIVERY,
  );

  const resumen: ResumenVentas = {
    total_ventas,
    num_ventas,
    promedio_venta: num_ventas > 0 ? total_ventas / num_ventas : 0,
    total_delivery_fees: deliveries.reduce(
      (s, v) => s + (v.delivery_fee ?? 0),
      0,
    ),
    num_delivery: deliveries.length,
    num_local: ventasFiltradas.filter(
      (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.EN_LOCAL,
    ).length,
    num_para_llevar: ventasFiltradas.filter(
      (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.PARA_LLEVAR,
    ).length,
  };

  // === Ventas por día ===
  const porDia: Record<string, { total: number; cantidad: number }> = {};
  for (const v of ventasFiltradas) {
    if (!v.created_at) continue;
    const fecha = utcToFechaLima(v.created_at);
    if (!porDia[fecha]) porDia[fecha] = { total: 0, cantidad: 0 };
    porDia[fecha].total += v.total;
    porDia[fecha].cantidad += 1;
  }
  const ventasPorDia = Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, stats]) => ({
      fecha,
      fecha_label: formatFechaLabel(fecha),
      ...stats,
    }));

  // === Ventas por tipo (sin filtro de tipoPedido) ===
  const totalGeneral = ventasSinFiltroTipo.reduce((s, v) => s + v.total, 0);
  const tipos = Object.values(TIPO_PEDIDO);
  const ventasPorTipo = tipos.map((tipo) => {
    const ventasTipo = ventasSinFiltroTipo.filter(
      (v) => v.ordenes?.tipo_pedido === tipo,
    );
    const total = ventasTipo.reduce((s, v) => s + v.total, 0);
    const cantidad = ventasTipo.length;
    return {
      tipo,
      label:
        TIPO_PEDIDO_LABELS[tipo as keyof typeof TIPO_PEDIDO_LABELS] ?? tipo,
      total,
      cantidad,
      porcentaje: totalGeneral > 0 ? (total / totalGeneral) * 100 : 0,
    };
  });

  // === Ventas por sucursal (sin filtro de sucursal, solo admin) ===
  let ventasPorSucursal: VentaPorSucursal[] = [];
  if (esAdmin) {
    const porSucursal: Record<
      string,
      { nombre: string; total: number; cantidad: number }
    > = {};
    for (const v of todasLasVentas) {
      const id = v.sucursal_origen_id;
      const nombre = v.sucursal?.nombre ?? "Desconocida";
      if (!porSucursal[id]) porSucursal[id] = { nombre, total: 0, cantidad: 0 };
      porSucursal[id].total += v.total;
      porSucursal[id].cantidad += 1;
    }
    ventasPorSucursal = Object.entries(porSucursal).map(([id, stats]) => ({
      sucursal_id: id,
      sucursal_nombre: stats.nombre,
      total: stats.total,
      cantidad: stats.cantidad,
      promedio: stats.cantidad > 0 ? stats.total / stats.cantidad : 0,
    }));
  }

  // === Detalle delivery ===
  const ventasDelivery = ventasFiltradas.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.DELIVERY,
  );
  const propio = ventasDelivery.filter((v) => v.delivery_method === "propio");
  const tercero = ventasDelivery.filter((v) => v.delivery_method === "tercero");

  const calcDelivery = (
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

  const detalleDelivery = [
    calcDelivery(propio, "propio", "Delivery Propio"),
    calcDelivery(tercero, "tercero", "Delivery Tercero"),
  ];

  // === Detalle de ventas ===
  const ventasDetalle = ventasFiltradas.slice(0, detalleLimit).map((v) => ({
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

  // === 2da query: Top productos ===
  type VentaItemRaw = {
    producto_id: string;
    producto_nombre: string;
    cantidad: number;
    subtotal: number;
    venta: { sucursal_origen_id: string } | null;
  };

  const { data: itemsData, error: itemsError } = await supabase
    .from("venta_items")
    .select(
      "producto_id, producto_nombre, cantidad, subtotal, venta:ventas!venta_items_venta_id_fkey(sucursal_origen_id, created_at)",
    )
    .gte("venta.created_at", desde)
    .lte("venta.created_at", hasta);

  if (itemsError) throw new Error(itemsError.message);
  const items = (itemsData ?? []) as unknown as VentaItemRaw[];

  const itemsFiltrados = filtros.sucursalId
    ? items.filter((i) => i.venta?.sucursal_origen_id === filtros.sucursalId)
    : items;

  const porProducto: Record<
    string,
    { nombre: string; cantidad: number; total: number }
  > = {};
  for (const item of itemsFiltrados) {
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

  const topProductos = Object.entries(porProducto)
    .map(([id, stats]) => ({
      producto_id: id,
      producto_nombre: stats.nombre,
      cantidad: stats.cantidad,
      total: stats.total,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, topLimit);

  return {
    resumen,
    ventasPorDia,
    ventasPorTipo,
    ventasPorSucursal,
    detalleDelivery,
    ventasDetalle,
    topProductos,
  };
}
