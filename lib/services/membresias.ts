import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type NivelMembresia =
  Database["public"]["Tables"]["membresias_niveles"]["Row"];
export type ReglaPuntos = Database["public"]["Tables"]["reglas_puntos"]["Row"];

// ─── Niveles de membresía ─────────────────────────────────────────────────────

export async function getNivelesMembresia(): Promise<NivelMembresia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membresias_niveles")
    .select("*")
    .order("puntos_requeridos", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createNivelMembresia(data: {
  nombre: string;
  beneficios?: string | null;
  descuento_porcentaje: number;
  puntos_requeridos: number;
  orden?: number | null;
}): Promise<NivelMembresia> {
  const supabase = await createClient();
  const { data: nivel, error } = await supabase
    .from("membresias_niveles")
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return nivel;
}

export async function updateNivelMembresia(
  id: string,
  data: {
    nombre: string;
    beneficios?: string | null;
    descuento_porcentaje: number;
    puntos_requeridos: number;
    orden?: number | null;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membresias_niveles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteNivelMembresia(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membresias_niveles")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Reglas de puntos ─────────────────────────────────────────────────────────

export async function getReglasPuntos(): Promise<ReglaPuntos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglas_puntos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getReglasPuntosActivas(): Promise<ReglaPuntos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglas_puntos")
    .select("*")
    .eq("activa", true)
    .order("soles_por_punto", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createReglaPuntos(data: {
  nombre: string;
  descripcion?: string | null;
  puntos_otorgados: number;
  soles_por_punto: number;
  activa: boolean;
}): Promise<ReglaPuntos> {
  const supabase = await createClient();
  const { data: regla, error } = await supabase
    .from("reglas_puntos")
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return regla;
}

export async function updateReglaPuntos(
  id: string,
  data: {
    nombre: string;
    descripcion?: string | null;
    puntos_otorgados: number;
    soles_por_punto: number;
    activa: boolean;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reglas_puntos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReglaPuntos(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reglas_puntos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleReglaPuntosActiva(
  id: string,
  activa: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reglas_puntos")
    .update({ activa, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Membresías de clientes ─────────────────────────────────────────────

export type MembresiaConCliente = {
  id: string;
  cliente_id: string;
  nivel_id: string;
  activa: boolean;
  puntos_acumulados: number;
  tipo_plan: string | null;
  monto_pagado: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_ultimo_pago: string | null;
  cliente: {
    nombre: string;
    apellido: string | null;
    dni: string | null;
  } | null;
  nivel: { nombre: string; descuento_porcentaje: number | null } | null;
};

export async function getMembresiasConCliente(): Promise<
  MembresiaConCliente[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membresias")
    .select(
      `*, cliente:clientes!membresias_cliente_id_fkey(nombre, apellido, dni),
       nivel:membresias_niveles!membresias_nivel_id_fkey(nombre, descuento_porcentaje)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MembresiaConCliente[];
}

export async function asignarMembresia(data: {
  cliente_id: string;
  nivel_id: string;
  tipo_plan: string;
  monto_pagado: number;
}): Promise<void> {
  const supabase = await createClient();
  const now = new Date();

  // Calcular fecha_fin según plan
  const fechaFin = new Date(now);
  if (data.tipo_plan === "mensual") fechaFin.setMonth(fechaFin.getMonth() + 1);
  else if (data.tipo_plan === "trimestral")
    fechaFin.setMonth(fechaFin.getMonth() + 3);
  else if (data.tipo_plan === "anual")
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);

  // Desactivar membresías anteriores del cliente
  await supabase
    .from("membresias")
    .update({ activa: false, updated_at: now.toISOString() })
    .eq("cliente_id", data.cliente_id);

  // Crear nueva membresía
  const { data: membresia, error } = await supabase
    .from("membresias")
    .insert({
      cliente_id: data.cliente_id,
      nivel_id: data.nivel_id,
      activa: true,
      puntos_acumulados: 0,
      tipo_plan: data.tipo_plan,
      monto_pagado: data.monto_pagado,
      fecha_inicio: now.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      fecha_ultimo_pago: now.toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Registrar pago
  const { error: pagoError } = await supabase.from("membresia_pagos").insert({
    membresia_id: membresia.id,
    monto: data.monto_pagado,
    tipo_plan: data.tipo_plan,
    fecha_pago: now.toISOString(),
    periodo_inicio: now.toISOString().split("T")[0],
    periodo_fin: fechaFin.toISOString().split("T")[0],
  });

  if (pagoError) throw new Error(pagoError.message);
}

export type PagoMembresia = {
  id: string;
  monto: number;
  tipo_plan: string;
  fecha_pago: string;
  periodo_inicio: string;
  periodo_fin: string;
};

export async function getPagosMembresia(
  membresiaId: string,
): Promise<PagoMembresia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membresia_pagos")
    .select("id, monto, tipo_plan, fecha_pago, periodo_inicio, periodo_fin")
    .eq("membresia_id", membresiaId)
    .order("fecha_pago", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PagoMembresia[];
}

export async function registrarPago(data: {
  membresia_id: string;
  monto: number;
  tipo_plan: string;
}): Promise<void> {
  const supabase = await createClient();
  const now = new Date();

  const fechaFin = new Date(now);
  if (data.tipo_plan === "mensual") fechaFin.setMonth(fechaFin.getMonth() + 1);
  else if (data.tipo_plan === "trimestral")
    fechaFin.setMonth(fechaFin.getMonth() + 3);
  else if (data.tipo_plan === "anual")
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);

  // Registrar pago
  const { error: pagoError } = await supabase.from("membresia_pagos").insert({
    membresia_id: data.membresia_id,
    monto: data.monto,
    tipo_plan: data.tipo_plan,
    fecha_pago: now.toISOString(),
    periodo_inicio: now.toISOString().split("T")[0],
    periodo_fin: fechaFin.toISOString().split("T")[0],
  });
  if (pagoError) throw new Error(pagoError.message);

  // Actualizar membresía
  await supabase
    .from("membresias")
    .update({
      fecha_ultimo_pago: now.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      monto_pagado: data.monto,
      updated_at: now.toISOString(),
    })
    .eq("id", data.membresia_id);
}

export async function desactivarMembresia(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membresias")
    .update({ activa: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Acumula puntos al cliente después de una venta.
 * Si supera el umbral del siguiente nivel, hace upgrade automático.
 */
export async function acumularPuntosCliente(
  clienteId: string,
  totalVenta: number,
): Promise<{ puntosGanados: number; nuevoNivel: string | null }> {
  // Usar adminClient para bypasear RLS (cajeros no tienen permiso de escritura en membresias)
  const supabase = createAdminClient();

  // 1. Buscar membresía activa del cliente
  const { data: membresia } = await supabase
    .from("membresias")
    .select("id, nivel_id, puntos_acumulados")
    .eq("cliente_id", clienteId)
    .eq("activa", true)
    .limit(1)
    .single();

  if (!membresia) return { puntosGanados: 0, nuevoNivel: null };

  // 2. Buscar regla de puntos para el nivel del cliente (o global)
  const { data: reglas } = await supabase
    .from("reglas_puntos")
    .select("*")
    .eq("activa", true)
    .order("soles_por_punto", { ascending: true });

  if (!reglas || reglas.length === 0)
    return { puntosGanados: 0, nuevoNivel: null };

  // Priorizar regla del nivel, luego global
  const reglaDelNivel = reglas.find(
    (r) => r.nivel_membresia_id === membresia.nivel_id,
  );
  const reglaGlobal = reglas.find((r) => !r.nivel_membresia_id);
  const regla = reglaDelNivel ?? reglaGlobal;

  if (!regla) return { puntosGanados: 0, nuevoNivel: null };

  // 3. Calcular puntos (soles_por_punto viene como string de Supabase numeric)
  const solesPorPunto = Number(regla.soles_por_punto);
  const puntosGanados =
    Math.floor(totalVenta / solesPorPunto) * regla.puntos_otorgados;
  if (puntosGanados <= 0) return { puntosGanados: 0, nuevoNivel: null };

  const nuevosPuntos = membresia.puntos_acumulados + puntosGanados;

  // 4. Actualizar puntos
  await supabase
    .from("membresias")
    .update({
      puntos_acumulados: nuevosPuntos,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membresia.id);

  // 5. Verificar upgrade de nivel
  const { data: niveles } = await supabase
    .from("membresias_niveles")
    .select("id, nombre, puntos_requeridos")
    .order("puntos_requeridos", { ascending: false });

  let nuevoNivel: string | null = null;

  if (niveles) {
    // Buscar el nivel más alto que el cliente puede alcanzar
    const nivelAlcanzable = niveles.find(
      (n) => nuevosPuntos >= n.puntos_requeridos,
    );
    if (nivelAlcanzable && nivelAlcanzable.id !== membresia.nivel_id) {
      await supabase
        .from("membresias")
        .update({
          nivel_id: nivelAlcanzable.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membresia.id);
      nuevoNivel = nivelAlcanzable.nombre;
    }
  }

  return { puntosGanados, nuevoNivel };
}

// Re-export funciones puras desde utils (sin dependencias de servidor)
export {
  calcularPuntosVenta,
  calcularDescuentoNivel,
} from "@/lib/membresias-utils";
