import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, format } from "date-fns";
import { TIPO_PEDIDO } from "@/lib/constants";

export type StatsHoy = {
  total_ventas: number;
  num_pedidos: number;
  promedio_venta: number;
  total_delivery: number;
  num_delivery: number;
};

export type DesgloseTipo = {
  tipo: string;
  label: string;
  total: number;
  cantidad: number;
};

export type VentaPorHora = {
  hora: string;
  total: number;
  cantidad: number;
};

export type PedidoReciente = {
  id: string;
  numero_venta: number;
  tipo_pedido: string;
  total: number;
  metodo_pago: string;
  delivery_status: string | null;
  created_at: string;
  cajero_nombre: string | null;
};

type VentaStats = {
  total: number;
  tipo_pedido: string;
  delivery_fee: number;
};

type VentaHora = {
  total: number;
  created_at: string;
};

type VentaRecienteRaw = {
  id: string;
  numero_venta: number;
  tipo_pedido: string;
  total: number;
  metodo_pago: string;
  delivery_status: string | null;
  created_at: string;
  cajero: { nombre: string; apellido_paterno: string } | null;
};

function getTodayRange() {
  const now = new Date();
  return {
    desde: startOfDay(now).toISOString(),
    hasta: endOfDay(now).toISOString(),
  };
}

export async function getStatsHoy(
  sucursalId?: string | null,
): Promise<StatsHoy> {
  const supabase = await createClient();
  const { desde, hasta } = getTodayRange();

  const base = supabase
    .from("ventas")
    .select("total, tipo_pedido, delivery_fee")
    .gte("created_at", desde)
    .lte("created_at", hasta);

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as VentaStats[] | null;

  if (error || !data || data.length === 0) {
    return {
      total_ventas: 0,
      num_pedidos: 0,
      promedio_venta: 0,
      total_delivery: 0,
      num_delivery: 0,
    };
  }

  const total_ventas = data.reduce((sum, v) => sum + (v.total ?? 0), 0);
  const num_pedidos = data.length;
  const promedio_venta = num_pedidos > 0 ? total_ventas / num_pedidos : 0;
  const deliveries = data.filter((v) => v.tipo_pedido === TIPO_PEDIDO.DELIVERY);
  const total_delivery = deliveries.reduce(
    (sum, v) => sum + (v.delivery_fee ?? 0),
    0,
  );
  const num_delivery = deliveries.length;

  return {
    total_ventas,
    num_pedidos,
    promedio_venta,
    total_delivery,
    num_delivery,
  };
}

const TIPO_LABELS: Record<string, string> = {
  [TIPO_PEDIDO.EN_LOCAL]: "En Local",
  [TIPO_PEDIDO.PARA_LLEVAR]: "Para Llevar",
  [TIPO_PEDIDO.DELIVERY]: "Delivery",
};

export async function getDesglosePorTipo(
  sucursalId?: string | null,
): Promise<DesgloseTipo[]> {
  const supabase = await createClient();
  const { desde, hasta } = getTodayRange();

  const base = supabase
    .from("ventas")
    .select("tipo_pedido, total")
    .gte("created_at", desde)
    .lte("created_at", hasta);

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as { tipo_pedido: string; total: number }[] | null;

  if (error || !data) return [];

  const tipos = Object.values(TIPO_PEDIDO);
  return tipos.map((tipo) => {
    const ventas = data.filter((v) => v.tipo_pedido === tipo);
    return {
      tipo,
      label: TIPO_LABELS[tipo] ?? tipo,
      total: ventas.reduce((sum, v) => sum + (v.total ?? 0), 0),
      cantidad: ventas.length,
    };
  });
}

export async function getVentasPorHora(
  sucursalId?: string | null,
): Promise<VentaPorHora[]> {
  const supabase = await createClient();
  const { desde, hasta } = getTodayRange();

  const base = supabase
    .from("ventas")
    .select("total, created_at")
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .order("created_at");

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as VentaHora[] | null;

  if (error || !data) return [];

  const porHora: Record<string, { total: number; cantidad: number }> = {};
  for (const venta of data) {
    const hora = format(new Date(venta.created_at), "HH:00");
    if (!porHora[hora]) porHora[hora] = { total: 0, cantidad: 0 };
    porHora[hora].total += venta.total ?? 0;
    porHora[hora].cantidad += 1;
  }

  return Object.entries(porHora)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, stats]) => ({ hora, ...stats }));
}

export async function getPedidosRecientes(
  sucursalId?: string | null,
  limit = 8,
): Promise<PedidoReciente[]> {
  const supabase = await createClient();

  const base = supabase
    .from("ventas")
    .select(
      `id, numero_venta, tipo_pedido, total, metodo_pago, delivery_status, created_at,
       cajero:profiles!ventas_cajero_id_fkey(nombre, apellido_paterno)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as VentaRecienteRaw[] | null;

  if (error || !data) return [];

  return data.map((v) => ({
    id: v.id,
    numero_venta: v.numero_venta,
    tipo_pedido: v.tipo_pedido,
    total: v.total,
    metodo_pago: v.metodo_pago,
    delivery_status: v.delivery_status,
    created_at: v.created_at,
    cajero_nombre: v.cajero
      ? `${v.cajero.nombre} ${v.cajero.apellido_paterno}`
      : null,
  }));
}
