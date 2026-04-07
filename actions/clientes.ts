"use server";

import { buscarClientePorDni } from "@/lib/services/clientes";
import type { ClienteConMembresia } from "@/lib/services/clientes";
import type { ActionResult } from "@/types";

export async function buscarClienteAction(
  dni: string,
): Promise<ActionResult<ClienteConMembresia | null>> {
  if (!dni || dni.trim().length < 7) {
    return {
      data: null,
      error: "Ingresa un DNI o CE válido (mínimo 7 dígitos)",
    };
  }

  try {
    const cliente = await buscarClientePorDni(dni.trim());
    return { data: cliente, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al buscar cliente",
    };
  }
}
