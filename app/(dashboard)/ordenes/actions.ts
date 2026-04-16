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
import { getSesionActivaPorSucursal } from "@/lib/services/caja-sesiones";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { liberarMesaSiCorresponde } from "@/lib/services/mesas";
import { acumularPuntosCliente } from "@/lib/services/membresias";
import { cobrarOrdenSchema } from "@/lib/validations/ventas";
import type { Venta } from "@/lib/services/ventas";
import type { ActionResult } from "@/types";

export async function cambiarEstadoOrdenAction(
  ordenId: string,
  estado: EstadoOrden,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const [
    { data: rolNombre },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.auth.getUser(),
  ]);

  if (!user) return { data: null, error: "No autenticado" };
  if (!["administrador", "cajero", "mesero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permisos para cambiar estado de orden" };
  }

  try {
    await actualizarEstadoOrden(ordenId, estado);
    revalidatePath("/ordenes");
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function cancelarOrdenAction(
  ordenId: string,
  motivo: string,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const [
    { data: rolNombre },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.auth.getUser(),
  ]);

  if (!user) return { data: null, error: "No autenticado" };
  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permisos para cancelar órdenes" };
  }

  try {
    await cancelarOrdenConMotivo(ordenId, motivo);
    revalidatePath("/ordenes");
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cancelar",
    };
  }
}

export async function cambiarEstadoDeliveryAction(
  ordenId: string,
  deliveryStatus: EstadoDelivery,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const [
    { data: rolNombre },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.auth.getUser(),
  ]);

  if (!user) return { data: null, error: "No autenticado" };
  if (!["administrador", "cajero", "repartidor"].includes(rolNombre ?? "")) {
    return {
      data: null,
      error: "Sin permisos para actualizar estado de delivery",
    };
  }

  try {
    await actualizarEstadoDelivery(ordenId, deliveryStatus);
    revalidatePath("/ordenes");
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
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

  const [{ data: orden, error: ordenError }, config, sesionActiva] =
    await Promise.all([
      supabase
        .from("ordenes")
        .select("*, orden_items(*)")
        .eq("id", ordenId)
        .single(),
      getConfiguracionNegocio(),
      getSesionActivaPorSucursal(sucursalId).catch(() => null),
    ]);

  if (ordenError || !orden) return { data: null, error: "Orden no encontrada" };

  // Validar estado según modelo de negocio:
  // Modo simple → cobra desde en_preparacion (salta el estado "lista")
  // Modo cocina_independiente → requiere estado "lista"
  const estadosCobrables =
    (config?.modelo_negocio ?? "simple") === "simple"
      ? ["en_preparacion", "lista"]
      : ["lista"];

  if (!estadosCobrables.includes(orden.estado)) {
    const mensaje =
      (config?.modelo_negocio ?? "simple") === "simple"
        ? "La orden debe estar en preparación para cobrar"
        : "La orden debe estar en estado 'lista' para cobrar";
    return { data: null, error: mensaje };
  }

  // El descuento de membresía ya viene incluido en orden.descuento y orden.total (R21)
  const totalFinal = orden.total;

  if (
    parsed.data.metodo_pago === "efectivo" &&
    (parsed.data.monto_recibido ?? 0) < totalFinal
  ) {
    return { data: null, error: "El monto recibido es menor al total" };
  }

  try {
    const venta = await cobrarOrden({
      orden_id: ordenId,
      cajero_id: user.id,
      sucursal_origen_id: sucursalId,
      caja_sesion_id: sesionActiva?.id ?? null,
      metodo_pago: parsed.data.metodo_pago,
      monto_recibido: parsed.data.monto_recibido ?? null,
      tipo_pedido: orden.tipo_pedido,
      subtotal: orden.subtotal,
      descuento: orden.descuento,
      delivery_fee: orden.delivery_fee,
      total: totalFinal,
      notas: orden.notas,
      promocion_id: orden.promocion_id,
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

    // Liberar mesa si no tiene más órdenes activas
    if (orden.mesa_id) {
      await liberarMesaSiCorresponde(orden.mesa_id);
    }

    // Acumular puntos de membresía si el cliente tiene membresía activa
    if (orden.cliente_id) {
      try {
        await acumularPuntosCliente(orden.cliente_id, totalFinal);
      } catch {
        // No bloquear el cobro si falla la acumulación de puntos
      }
    }

    revalidatePath("/ordenes");
    return { data: venta, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cobrar",
    };
  }
}

/**
 * Cobra todas las órdenes cobrables de una mesa en secuencia.
 * Genera 1 venta por orden (no agrupa en 1 sola venta).
 * Libera la mesa al final si no quedan órdenes activas.
 */
export async function cobrarMesaAction(
  mesaId: string,
  rawData: unknown,
): Promise<ActionResult<{ cobradas: number; total: number }>> {
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

  // Buscar sesión activa y configuración en paralelo
  const [config, sesionActivaMesa] = await Promise.all([
    getConfiguracionNegocio(),
    getSesionActivaPorSucursal(sucursalId).catch(() => null),
  ]);
  const estadosCobrablesMesa =
    (config?.modelo_negocio ?? "simple") === "simple"
      ? (["en_preparacion", "lista"] as const)
      : (["lista"] as const);

  // Filtrar órdenes de las últimas 36 horas para no arrastrar órdenes de días
  // anteriores que puedan quedar atascadas en estado cobrable
  const hace36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

  const { data: ordenesMesa, error: queryError } = await supabase
    .from("ordenes")
    .select("*, orden_items(*)")
    .eq("mesa_id", mesaId)
    .in("estado", estadosCobrablesMesa)
    .gte("created_at", hace36h);

  if (queryError) return { data: null, error: queryError.message };
  if (!ordenesMesa || ordenesMesa.length === 0)
    return { data: null, error: "No hay órdenes cobrables en esta mesa" };

  const totalOrdenesMesa = ordenesMesa.reduce((acc, o) => acc + o.total, 0);

  if (
    parsed.data.metodo_pago === "efectivo" &&
    (parsed.data.monto_recibido ?? 0) < totalOrdenesMesa
  ) {
    return {
      data: null,
      error: `El monto recibido es menor al total de la mesa (${totalOrdenesMesa.toFixed(2)})`,
    };
  }

  let cobradas = 0;
  let totalCobrado = 0;

  try {
    for (const orden of ordenesMesa) {
      const totalOrden = orden.total;

      await cobrarOrden({
        orden_id: orden.id,
        cajero_id: user.id,
        sucursal_origen_id: sucursalId,
        caja_sesion_id: sesionActivaMesa?.id ?? null,
        metodo_pago: parsed.data.metodo_pago,
        monto_recibido:
          cobradas === 0 ? (parsed.data.monto_recibido ?? null) : null,
        tipo_pedido: orden.tipo_pedido,
        subtotal: orden.subtotal,
        descuento: orden.descuento,
        delivery_fee: orden.delivery_fee,
        total: totalOrden,
        notas: orden.notas,
        promocion_id: orden.promocion_id,
        mesa_referencia: orden.mesa_referencia,
        delivery_method: orden.delivery_method,
        delivery_address: orden.delivery_address,
        delivery_referencia: orden.delivery_referencia,
        repartidor_id: orden.repartidor_id,
        third_party_name: orden.third_party_name,
        items: orden.orden_items.map(
          (i: {
            producto_id: string;
            variante_id: string | null;
            cantidad: number;
            producto_nombre: string;
            variante_nombre: string | null;
            precio_unitario: number;
            subtotal: number;
          }) => ({
            producto_id: i.producto_id,
            variante_id: i.variante_id,
            cantidad: i.cantidad,
            producto_nombre: i.producto_nombre,
            variante_nombre: i.variante_nombre,
            precio_unitario: i.precio_unitario,
            subtotal: i.subtotal,
          }),
        ),
      });

      await actualizarEstadoOrden(orden.id, "entregada");

      if (orden.cliente_id) {
        try {
          await acumularPuntosCliente(orden.cliente_id, totalOrden);
        } catch {
          // No bloquear
        }
      }

      cobradas++;
      totalCobrado += totalOrden;
    }

    // Liberar mesa
    await liberarMesaSiCorresponde(mesaId);

    revalidatePath("/ordenes");
    return { data: { cobradas, total: totalCobrado }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error al cobrar mesa",
    };
  }
}
