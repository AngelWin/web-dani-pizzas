import { createClient } from "@/lib/supabase/server";

// ─── Constantes ───────────────────────────────────────────────────────────────

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltrosEntregas = {
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string; // YYYY-MM-DD
  sucursalId?: string | null;
};

export type EntregaDetalle = {
  orden_id: string;
  numero_orden: number;
  delivery_address: string | null;
  delivery_fee: number;
  delivery_status: string;
  entregado_at: string | null; // ISO timestamp
  hora_entregado: string | null; // HH:mm formato Lima
};

export type RepartidorEntregas = {
  repartidor_id: string;
  nombre: string;
  entregas_completadas: number;
  entregas_pendientes: number;
  entregas_en_camino: number;
  total_a_pagar: number;
  entregas: EntregaDetalle[];
};

export type ResumenEntregas = {
  total_entregas: number;
  total_completadas: number;
  total_a_pagar: number;
  repartidores_activos: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fechaLimaToRangoUTC(fecha: string): { desde: string; hasta: string } {
  const [y, m, d] = fecha.split("-").map(Number);
  const desde = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
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

function utcToHoraLima(isoString: string): string {
  const utcMs = new Date(isoString).getTime();
  const limaDate = new Date(utcMs - LIMA_OFFSET_MS);
  const h = String(limaDate.getUTCHours()).padStart(2, "0");
  const min = String(limaDate.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// ─── Tipos raw ───────────────────────────────────────────────────────────────

type OrdenDeliveryRaw = {
  id: string;
  numero_orden: number;
  repartidor_id: string | null;
  third_party_name: string | null;
  delivery_address: string | null;
  delivery_fee: number | null;
  delivery_status: string;
  delivery_status_updated_at: string | null;
  created_at: string;
  repartidor: { nombre: string; apellido_paterno: string } | null;
};

// ─── Servicio ────────────────────────────────────────────────────────────────

export async function getEntregasPorRepartidor(
  filtros: FiltrosEntregas,
  repartidorIdFijo?: string | null,
): Promise<{
  resumen: ResumenEntregas;
  repartidores: RepartidorEntregas[];
}> {
  const supabase = await createClient();
  const { desde, hasta } = rangoFechasUTC(
    filtros.fechaDesde,
    filtros.fechaHasta,
  );

  let query = supabase
    .from("ordenes")
    .select(
      `id, numero_orden, repartidor_id, third_party_name, delivery_address,
       delivery_fee, delivery_status, delivery_status_updated_at, created_at,
       repartidor:profiles!ordenes_repartidor_id_fkey(nombre, apellido_paterno)`,
    )
    .eq("tipo_pedido", "delivery")
    .eq("delivery_method", "propio")
    .neq("estado", "cancelada")
    .gte("created_at", desde)
    .lte("created_at", hasta);

  if (filtros.sucursalId) {
    query = query.eq("sucursal_id", filtros.sucursalId);
  }

  if (repartidorIdFijo) {
    query = query.eq("repartidor_id", repartidorIdFijo);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const ordenes = (data ?? []) as unknown as OrdenDeliveryRaw[];

  // Agrupar por repartidor (perfil) o por nombre del servicio de delivery
  const porRepartidor = new Map<
    string,
    { nombre: string; entregas: OrdenDeliveryRaw[] }
  >();

  for (const o of ordenes) {
    // Clave: repartidor_id si existe, sino third_party_name
    const clave = o.repartidor_id ?? o.third_party_name;
    if (!clave) continue;

    const existing = porRepartidor.get(clave);
    if (existing) {
      existing.entregas.push(o);
    } else {
      const nombre = o.repartidor
        ? `${o.repartidor.nombre} ${o.repartidor.apellido_paterno}`
        : (o.third_party_name ?? "Sin nombre");
      porRepartidor.set(clave, { nombre, entregas: [o] });
    }
  }

  // Construir resultado
  const repartidores: RepartidorEntregas[] = [];
  let totalEntregas = 0;
  let totalCompletadas = 0;
  let totalAPagar = 0;

  for (const [repartidorId, { nombre, entregas }] of porRepartidor) {
    const completadas = entregas.filter(
      (e) => e.delivery_status === "entregado",
    );
    const pendientes = entregas.filter(
      (e) => e.delivery_status === "pendiente",
    );
    const enCamino = entregas.filter((e) => e.delivery_status === "en_camino");
    const totalFees = completadas.reduce(
      (s, e) => s + (e.delivery_fee ?? 0),
      0,
    );

    totalEntregas += entregas.length;
    totalCompletadas += completadas.length;
    totalAPagar += totalFees;

    repartidores.push({
      repartidor_id: repartidorId,
      nombre,
      entregas_completadas: completadas.length,
      entregas_pendientes: pendientes.length,
      entregas_en_camino: enCamino.length,
      total_a_pagar: totalFees,
      entregas: entregas.map((e) => ({
        orden_id: e.id,
        numero_orden: e.numero_orden,
        delivery_address: e.delivery_address,
        delivery_fee: e.delivery_fee ?? 0,
        delivery_status: e.delivery_status,
        entregado_at: e.delivery_status_updated_at,
        hora_entregado:
          e.delivery_status === "entregado" && e.delivery_status_updated_at
            ? utcToHoraLima(e.delivery_status_updated_at)
            : null,
      })),
    });
  }

  // Ordenar por más entregas completadas primero
  repartidores.sort((a, b) => b.entregas_completadas - a.entregas_completadas);

  return {
    resumen: {
      total_entregas: totalEntregas,
      total_completadas: totalCompletadas,
      total_a_pagar: totalAPagar,
      repartidores_activos: repartidores.length,
    },
    repartidores,
  };
}
