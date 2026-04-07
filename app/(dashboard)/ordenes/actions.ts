"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarEstadoOrden,
  actualizarEstadoDelivery,
  type EstadoOrden,
  type EstadoDelivery,
} from "@/lib/services/ordenes";

export async function cambiarEstadoOrdenAction(
  ordenId: string,
  estado: EstadoOrden,
): Promise<{ error?: string }> {
  try {
    await actualizarEstadoOrden(ordenId, estado);
    revalidatePath("/ordenes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function cambiarEstadoDeliveryAction(
  ordenId: string,
  deliveryStatus: EstadoDelivery,
): Promise<{ error?: string }> {
  try {
    await actualizarEstadoDelivery(ordenId, deliveryStatus);
    revalidatePath("/ordenes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
