import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

type VentaStatsRaw = {
  total: number;
  delivery_fee: number | null;
  ordenes: { tipo_pedido: string } | null;
};

type VentaHoraRaw = {
  total: number;
  created_at: string;
};

type VentaRecienteRaw = {
  id: string;
  numero_venta: number;
  total: number;
  metodo_pago: string;
  created_at: string;
  ordenes: { tipo_pedido: string; delivery_status: string | null } | null;
  cajero: { nombre: string; apellido_paterno: string } | null;
};

// Peru (Lima) es UTC-5, sin horario de verano
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

function getTodayRangePeru() {
  const now = new Date();
  // Calcular la fecha actual en Lima restando 5 horas al UTC
  const limaNow = new Date(now.getTime() - LIMA_OFFSET_MS);

  const y = limaNow.getUTCFullYear();
  const m = limaNow.getUTCMonth();
  const d = limaNow.getUTCDate();

  // Medianoche Lima = UTC + 5h
  const desde = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  desde.setTime(desde.getTime() + LIMA_OFFSET_MS);

  // Fin del día Lima 23:59:59.999 = UTC + 5h
  const hasta = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  hasta.setTime(hasta.getTime() + LIMA_OFFSET_MS);

  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

import { TIPO_PEDIDO_LABELS } from "@/lib/constants";

/**
 * Obtiene stats y desglose en una sola query (antes eran 2 queries idénticas).
 */
export async function getStatsYDesglose(
  sucursalId?: string | null,
  esAdmin = false,
): Promise<{ stats: StatsHoy; desglose: DesgloseTipo[] }> {
  const supabase = esAdmin ? createAdminClient() : await createClient();
  const { desde, hasta } = getTodayRangePeru();

  const base = supabase
    .from("ventas")
    .select("total, delivery_fee, ordenes!ventas_orden_id_fkey(tipo_pedido)")
    .gte("created_at", desde)
    .lte("created_at", hasta);

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as VentaStatsRaw[] | null;

  if (error || !data || data.length === 0) {
    const emptyStats: StatsHoy = {
      total_ventas: 0,
      num_pedidos: 0,
      promedio_venta: 0,
      total_delivery: 0,
      num_delivery: 0,
    };
    const emptyDesglose = Object.values(TIPO_PEDIDO).map((tipo) => ({
      tipo,
      label:
        TIPO_PEDIDO_LABELS[tipo as keyof typeof TIPO_PEDIDO_LABELS] ?? tipo,
      total: 0,
      cantidad: 0,
    }));
    return { stats: emptyStats, desglose: emptyDesglose };
  }

  // Stats
  const total_ventas = data.reduce((sum, v) => sum + (v.total ?? 0), 0);
  const num_pedidos = data.length;
  const promedio_venta = num_pedidos > 0 ? total_ventas / num_pedidos : 0;
  const deliveries = data.filter(
    (v) => v.ordenes?.tipo_pedido === TIPO_PEDIDO.DELIVERY,
  );
  const total_delivery = deliveries.reduce(
    (sum, v) => sum + (v.delivery_fee ?? 0),
    0,
  );
  const num_delivery = deliveries.length;

  const stats: StatsHoy = {
    total_ventas,
    num_pedidos,
    promedio_venta,
    total_delivery,
    num_delivery,
  };

  // Desglose por tipo
  const tipos = Object.values(TIPO_PEDIDO);
  const desglose = tipos.map((tipo) => {
    const ventas = data.filter((v) => v.ordenes?.tipo_pedido === tipo);
    return {
      tipo,
      label:
        TIPO_PEDIDO_LABELS[tipo as keyof typeof TIPO_PEDIDO_LABELS] ?? tipo,
      total: ventas.reduce((sum, v) => sum + (v.total ?? 0), 0),
      cantidad: ventas.length,
    };
  });

  return { stats, desglose };
}

export async function getVentasPorHora(
  sucursalId?: string | null,
  esAdmin = false,
): Promise<VentaPorHora[]> {
  const supabase = esAdmin ? createAdminClient() : await createClient();
  const { desde, hasta } = getTodayRangePeru();

  const base = supabase
    .from("ventas")
    .select("total, created_at")
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .order("created_at");

  const { data: raw, error } = await (sucursalId
    ? base.eq("sucursal_origen_id", sucursalId)
    : base);

  const data = raw as VentaHoraRaw[] | null;

  if (error || !data) return [];

  const porHora: Record<string, { total: number; cantidad: number }> = {};
  for (const venta of data) {
    // Convertir a hora Lima
    const utcMs = new Date(venta.created_at).getTime();
    const limaDate = new Date(utcMs - LIMA_OFFSET_MS);
    const hora = `${String(limaDate.getUTCHours()).padStart(2, "0")}:00`;
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
  esAdmin = false,
): Promise<PedidoReciente[]> {
  const supabase = esAdmin ? createAdminClient() : await createClient();

  const base = supabase
    .from("ventas")
    .select(
      `id, numero_venta, total, metodo_pago, created_at,
       ordenes!ventas_orden_id_fkey(tipo_pedido, delivery_status),
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
    tipo_pedido: v.ordenes?.tipo_pedido ?? "",
    total: v.total,
    metodo_pago: v.metodo_pago,
    delivery_status: v.ordenes?.delivery_status ?? null,
    created_at: v.created_at,
    cajero_nombre: v.cajero
      ? `${v.cajero.nombre} ${v.cajero.apellido_paterno}`
      : null,
  }));
}
