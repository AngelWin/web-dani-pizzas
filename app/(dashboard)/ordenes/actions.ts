"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarEstadoOrden,
  actualizarEstadoDelivery,
  cancelarOrdenConMotivo,
  type EstadoOrden,
  type EstadoDelivery,
} from "@/lib/services/ordenes";
import { cobrarOrden } from "@/lib/services/ventas";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { cobrarOrdenSchema } from "@/lib/validations/ventas";
import type { Venta } from "@/lib/services/ventas";
import type { ActionResult } from "@/types";

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

export async function cancelarOrdenAction(
  ordenId: string,
  motivo: string,
): Promise<{ error?: string }> {
  try {
    await cancelarOrdenConMotivo(ordenId, motivo);
    revalidatePath("/ordenes");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cancelar" };
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

export async function cobrarOrdenAction(
  ordenId: string,
  rawData: unknown,
): Promise<ActionResult<Venta>> {
  const supabase = await createClient();

  const [{ data: rolNombre }, { data: sucursalId }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "No autenticado" };
  if (!sucursalId) return { data: null, error: "Sin sucursal asignada" };
  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Solo cajero o administrador pueden cobrar" };
  }

  const parsed = cobrarOrdenSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  const [{ data: orden, error: ordenError }, config] = await Promise.all([
    supabase
      .from("ordenes")
      .select("*, orden_items(*)")
      .eq("id", ordenId)
      .single(),
    getConfiguracionNegocio(),
  ]);

  if (ordenError || !orden) return { data: null, error: "Orden no encontrada" };

  // Validar estado según modelo de negocio:
  // Modo simple → cobra desde en_preparacion (salta el estado "lista")
  // Modo cocina_independiente → requiere estado "lista"
  const estadosCobrables =
    config.modelo_negocio === "simple"
      ? ["en_preparacion", "lista"]
      : ["lista"];

  if (!estadosCobrables.includes(orden.estado)) {
    const mensaje =
      config.modelo_negocio === "simple"
        ? "La orden debe estar en preparación para cobrar"
        : "La orden debe estar en estado 'lista' para cobrar";
    return { data: null, error: mensaje };
  }

  if (
    parsed.data.metodo_pago === "efectivo" &&
    (parsed.data.monto_recibido ?? 0) < orden.total
  ) {
    return { data: null, error: "El monto recibido es menor al total" };
  }

  try {
    const venta = await cobrarOrden({
      orden_id: ordenId,
      cajero_id: user.id,
      sucursal_origen_id: sucursalId,
      metodo_pago: parsed.data.metodo_pago,
      monto_recibido: parsed.data.monto_recibido ?? null,
      tipo_pedido: orden.tipo_pedido,
      subtotal: orden.subtotal,
      descuento: orden.descuento,
      delivery_fee: orden.delivery_fee,
      total: orden.total,
      notas: orden.notas,
      mesa_referencia: orden.mesa_referencia,
      delivery_method: orden.delivery_method,
      delivery_address: orden.delivery_address,
      delivery_referencia: orden.delivery_referencia,
      repartidor_id: orden.repartidor_id,
      third_party_name: orden.third_party_name,
      items: orden.orden_items.map((i) => ({
        producto_id: i.producto_id,
        variante_id: i.variante_id,
        cantidad: i.cantidad,
        producto_nombre: i.producto_nombre,
        variante_nombre: i.variante_nombre,
        precio_unitario: i.precio_unitario,
        subtotal: i.subtotal,
      })),
    });

    await actualizarEstadoOrden(ordenId, "entregada");
    revalidatePath("/ordenes");
    return { data: venta, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cobrar",
    };
  }
}
