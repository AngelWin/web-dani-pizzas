import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CajaSesion = Database["public"]["Tables"]["caja_sesiones"]["Row"];

export type CajaSesionConRelaciones = CajaSesion & {
  abierta_por_profile: { nombre: string; apellido_paterno: string } | null;
  cerrada_por_profile: { nombre: string; apellido_paterno: string } | null;
  sucursales: { nombre: string } | null;
};

export type ResumenSesion = {
  sesion: CajaSesionConRelaciones;
  total_ventas: number;
  total_efectivo: number;
  total_no_efectivo: number;
  por_metodo: Record<string, number>;
  total_descuentos: number;
  cantidad_ventas: number;
  monto_esperado_efectivo: number;
};

/** Obtiene la sesión activa de una sucursal (null si no hay ninguna) */
export async function getSesionActivaPorSucursal(
  sucursalId: string,
): Promise<CajaSesionConRelaciones | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("caja_sesiones")
    .select(
      `*,
       abierta_por_profile:profiles!caja_sesiones_abierta_por_fkey(nombre, apellido_paterno),
       cerrada_por_profile:profiles!caja_sesiones_cerrada_por_fkey(nombre, apellido_paterno),
       sucursales(nombre)`,
    )
    .eq("sucursal_id", sucursalId)
    .eq("estado", "abierta")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CajaSesionConRelaciones | null;
}

/** Abre una nueva sesión de caja para una sucursal */
export async function abrirSesion(params: {
  sucursal_id: string;
  abierta_por: string;
  monto_inicial: number;
  notas_apertura?: string | null;
}): Promise<CajaSesion> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("caja_sesiones")
    .insert({
      sucursal_id: params.sucursal_id,
      abierta_por: params.abierta_por,
      monto_inicial: params.monto_inicial,
      notas_apertura: params.notas_apertura ?? null,
      estado: "abierta",
    })
    .select()
    .single();

  if (error) {
    // Unique index violation → ya hay una sesión abierta
    if (error.code === "23505") {
      throw new Error(
        "Ya existe una sesión de caja abierta para esta sucursal",
      );
    }
    throw new Error(error.message);
  }

  return data;
}

/** Cierra una sesión de caja, calcula diferencia */
export async function cerrarSesion(params: {
  sesion_id: string;
  cerrada_por: string;
  monto_contado_efectivo: number;
  notas_cierre?: string | null;
}): Promise<CajaSesion> {
  const supabase = await createClient();

  // Calcular monto esperado en efectivo (suma de ventas en efectivo de la sesión)
  const { data: ventasEfectivo } = await supabase
    .from("ventas")
    .select("total, descuento")
    .eq("caja_sesion_id", params.sesion_id)
    .eq("metodo_pago", "efectivo")
    .eq("estado_pago_v2", "pagado");

  const { data: sesion, error: sesionError } = await supabase
    .from("caja_sesiones")
    .select("monto_inicial")
    .eq("id", params.sesion_id)
    .maybeSingle();

  if (sesionError) throw new Error(sesionError.message);

  const totalVentasEfectivo = (ventasEfectivo ?? []).reduce(
    (acc, v) => acc + v.total,
    0,
  );
  const montoEsperado = (sesion?.monto_inicial ?? 0) + totalVentasEfectivo;
  const diferencia =
    Math.round((params.monto_contado_efectivo - montoEsperado) * 100) / 100;

  const { data, error } = await supabase
    .from("caja_sesiones")
    .update({
      cerrada_por: params.cerrada_por,
      cerrada_at: new Date().toISOString(),
      monto_contado_efectivo: params.monto_contado_efectivo,
      diferencia,
      notas_cierre: params.notas_cierre ?? null,
      estado: "cerrada",
    })
    .eq("id", params.sesion_id)
    .eq("estado", "abierta")
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sesión no encontrada o ya cerrada");

  return data;
}

export type VentaSinSesion = {
  id: string;
  total: number;
  metodo_pago: string | null;
  descuento: number | null;
  created_at: string;
  sucursal_id: string | null;
  sucursal_nombre: string | null;
};

export type ResumenVentasSinSesion = {
  total_ventas: number;
  cantidad: number;
  por_metodo: Record<string, number>;
  ventas: VentaSinSesion[];
};

/** Ventas sin sesión de caja (caja_sesion_id IS NULL) agrupadas y desglosadas */
export async function getVentasSinSesion(
  sucursalId: string | null,
  filtros?: { desde?: string; hasta?: string },
): Promise<ResumenVentasSinSesion> {
  const supabase = await createClient();

  let query = supabase
    .from("ventas")
    .select(
      `id, total, metodo_pago, descuento, created_at, sucursal_origen_id,
       sucursal:sucursales!ventas_sucursal_origen_id_fkey(nombre)`,
    )
    .is("caja_sesion_id", null)
    .eq("estado_pago_v2", "pagado")
    .order("created_at", { ascending: false });

  if (sucursalId) {
    query = query.eq("sucursal_origen_id", sucursalId);
  }

  if (filtros?.desde) {
    query = query.gte("created_at", filtros.desde);
  }

  if (filtros?.hasta) {
    query = query.lte("created_at", filtros.hasta);
  }

  const { data, error } = await query.limit(200);
  if (error) throw new Error(error.message);

  const ventas: VentaSinSesion[] = (data ?? []).map(
    (v: Record<string, unknown>) => ({
      id: v.id as string,
      total: v.total as number,
      metodo_pago: v.metodo_pago as string | null,
      descuento: v.descuento as number | null,
      created_at: v.created_at as string,
      sucursal_id: v.sucursal_origen_id as string | null,
      sucursal_nombre:
        (v.sucursal as { nombre: string } | null)?.nombre ?? null,
    }),
  );

  const por_metodo: Record<string, number> = {};
  let total_ventas = 0;

  for (const v of ventas) {
    const metodo = v.metodo_pago ?? "sin_metodo";
    por_metodo[metodo] = (por_metodo[metodo] ?? 0) + v.total;
    total_ventas += v.total;
  }

  return {
    total_ventas: Math.round(total_ventas * 100) / 100,
    cantidad: ventas.length,
    por_metodo,
    ventas,
  };
}

/** Historial de sesiones por sucursal con filtros opcionales */
export async function getSesionesPorSucursal(
  sucursalId: string | null,
  filtros?: {
    desde?: string;
    hasta?: string;
    estado?: "abierta" | "cerrada";
    limit?: number;
  },
): Promise<CajaSesionConRelaciones[]> {
  const supabase = await createClient();

  let query = supabase
    .from("caja_sesiones")
    .select(
      `*,
       abierta_por_profile:profiles!caja_sesiones_abierta_por_fkey(nombre, apellido_paterno),
       cerrada_por_profile:profiles!caja_sesiones_cerrada_por_fkey(nombre, apellido_paterno),
       sucursales(nombre)`,
    )
    .order("abierta_at", { ascending: false });

  if (sucursalId) {
    query = query.eq("sucursal_id", sucursalId);
  }

  if (filtros?.estado) {
    query = query.eq("estado", filtros.estado);
  }

  if (filtros?.desde) {
    query = query.gte("abierta_at", filtros.desde);
  }

  if (filtros?.hasta) {
    query = query.lte("abierta_at", filtros.hasta);
  }

  if (filtros?.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as CajaSesionConRelaciones[];
}

/** Resumen detallado de una sesión (totales por método, diferencia, etc.) */
export async function getResumenSesion(
  sesionId: string,
): Promise<ResumenSesion> {
  const supabase = await createClient();

  const [sesionResult, ventasResult] = await Promise.all([
    supabase
      .from("caja_sesiones")
      .select(
        `*,
         abierta_por_profile:profiles!caja_sesiones_abierta_por_fkey(nombre, apellido_paterno),
         cerrada_por_profile:profiles!caja_sesiones_cerrada_por_fkey(nombre, apellido_paterno),
         sucursales(nombre)`,
      )
      .eq("id", sesionId)
      .single(),
    supabase
      .from("ventas")
      .select("total, metodo_pago, descuento, estado_pago_v2")
      .eq("caja_sesion_id", sesionId)
      .eq("estado_pago_v2", "pagado"),
  ]);

  if (sesionResult.error) throw new Error(sesionResult.error.message);
  if (!sesionResult.data) throw new Error("Sesión no encontrada");

  const sesion = sesionResult.data as CajaSesionConRelaciones;
  const ventas = ventasResult.data ?? [];

  const por_metodo: Record<string, number> = {};
  let total_efectivo = 0;
  let total_no_efectivo = 0;
  let total_descuentos = 0;

  for (const v of ventas) {
    const metodo = v.metodo_pago ?? "sin_metodo";
    por_metodo[metodo] = (por_metodo[metodo] ?? 0) + v.total;
    if (metodo === "efectivo") {
      total_efectivo += v.total;
    } else {
      total_no_efectivo += v.total;
    }
    total_descuentos += v.descuento ?? 0;
  }

  const total_ventas = ventas.reduce((acc, v) => acc + v.total, 0);
  const monto_esperado_efectivo = sesion.monto_inicial + total_efectivo;

  return {
    sesion,
    total_ventas: Math.round(total_ventas * 100) / 100,
    total_efectivo: Math.round(total_efectivo * 100) / 100,
    total_no_efectivo: Math.round(total_no_efectivo * 100) / 100,
    por_metodo,
    total_descuentos: Math.round(total_descuentos * 100) / 100,
    cantidad_ventas: ventas.length,
    monto_esperado_efectivo: Math.round(monto_esperado_efectivo * 100) / 100,
  };
}
