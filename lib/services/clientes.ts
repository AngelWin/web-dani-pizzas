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

  // 1. Buscar cliente por DNI
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("dni", dni.trim())
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!cliente) return null;

  // 2. Si el cliente tiene cuenta de usuario, buscar su membresía activa
  //    membresias.perfil_id = profiles.id = auth_user_id
  let membresiaResumen: ResumenMembresia | null = null;

  if (cliente.auth_user_id) {
    const { data: membresia } = await supabase
      .from("membresias")
      .select(
        `
        activa,
        puntos_acumulados,
        nivel:membresias_niveles!membresias_nivel_id_fkey (nombre, descuento_porcentaje)
      `,
      )
      .eq("perfil_id", cliente.auth_user_id)
      .eq("activa", true)
      .maybeSingle();

    if (membresia) {
      const nivelRaw = membresia.nivel;
      const nivel: NivelMembresia | null = Array.isArray(nivelRaw)
        ? (nivelRaw[0] ?? null)
        : (nivelRaw ?? null);

      membresiaResumen = {
        activa: membresia.activa,
        puntos_acumulados: membresia.puntos_acumulados,
        nivel,
      };
    }
  }

  return { ...cliente, membresias: membresiaResumen };
}
