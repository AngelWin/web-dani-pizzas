import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export type ClienteConMembresia = Cliente & {
  membresias: {
    activa: boolean;
    puntos_acumulados: number;
    nivel: { nombre: string; descuento_porcentaje: number | null } | null;
  } | null;
};

export async function buscarClientePorDni(
  dni: string,
): Promise<ClienteConMembresia | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select(
      `
      *,
      membresias (
        activa,
        puntos_acumulados,
        nivel:membresias_niveles!membresias_nivel_id_fkey (nombre, descuento_porcentaje)
      )
    `,
    )
    .eq("dni", dni.trim())
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  // Tomar solo la membresía activa
  const membresiasArr = Array.isArray(data.membresias) ? data.membresias : [];
  const membresiaActiva = membresiasArr.find((m) => m.activa) ?? null;

  return {
    ...data,
    membresias: membresiaActiva
      ? {
          activa: membresiaActiva.activa,
          puntos_acumulados: membresiaActiva.puntos_acumulados,
          nivel: membresiaActiva.nivel ?? null,
        }
      : null,
  } as ClienteConMembresia;
}
