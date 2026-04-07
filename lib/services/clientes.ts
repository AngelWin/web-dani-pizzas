import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export type NivelMembresia = {
  nombre: string;
  descuento_porcentaje: number | null;
};

export type ResumenMembresia = {
  activa: boolean;
  puntos_acumulados: number;
  nivel: NivelMembresia | null;
};

export type ClienteConMembresia = Cliente & {
  membresias: ResumenMembresia | null;
};

export async function buscarClientePorDni(
  dni: string,
): Promise<ClienteConMembresia | null> {
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select(
      `
      *,
      membresias!membresias_cliente_id_fkey (
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
  if (!cliente) return null;

  // Tomar solo la membresía activa (un cliente puede tener a lo sumo una activa)
  const membresiasArr = Array.isArray(cliente.membresias)
    ? cliente.membresias
    : cliente.membresias
      ? [cliente.membresias]
      : [];

  const membresiaActiva = membresiasArr.find((m) => m.activa) ?? null;

  let membresiaResumen: ResumenMembresia | null = null;
  if (membresiaActiva) {
    const nivelRaw = membresiaActiva.nivel;
    const nivel: NivelMembresia | null = Array.isArray(nivelRaw)
      ? (nivelRaw[0] ?? null)
      : (nivelRaw ?? null);

    membresiaResumen = {
      activa: membresiaActiva.activa,
      puntos_acumulados: membresiaActiva.puntos_acumulados,
      nivel,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { membresias: _, ...clienteBase } = cliente as typeof cliente & {
    membresias: unknown;
  };

  return { ...(clienteBase as Cliente), membresias: membresiaResumen };
}
