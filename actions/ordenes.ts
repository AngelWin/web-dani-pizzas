"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { crearOrdenSchema } from "@/lib/validations/ordenes";
import { crearOrden } from "@/lib/services/ordenes";
import type { ActionResult } from "@/types";
import type { Orden } from "@/lib/services/ordenes";
import type { DeliveryMethod } from "@/lib/services/ordenes";

export async function crearOrdenAction(
  rawData: unknown,
): Promise<ActionResult<Orden>> {
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
  if (!["administrador", "cajero", "mesero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permiso para crear órdenes" };
  }

  const parsed = crearOrdenSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  const { items, ...resto } = parsed.data;

  try {
    const orden = await crearOrden({
      cajero_id: user.id,
      sucursal_id: sucursalId,
      cliente_id: resto.cliente_id ?? null,
      tipo_pedido: resto.tipo_pedido,
      notas: resto.notas ?? null,
      mesa_referencia: resto.mesa_referencia ?? null,
      delivery_method: (resto.delivery_method as DeliveryMethod) ?? null,
      delivery_fee: resto.delivery_fee ?? 0,
      delivery_address: resto.delivery_address ?? null,
      delivery_referencia: resto.delivery_referencia ?? null,
      repartidor_id: resto.repartidor_id ?? null,
      third_party_name: resto.third_party_name ?? null,
      descuento: resto.descuento ?? 0,
      items: items.map((i) => ({
        producto_id: i.producto_id,
        variante_id: i.variante_id ?? null,
        cantidad: i.cantidad,
        producto_nombre: i.producto_nombre,
        variante_nombre: i.variante_nombre ?? null,
        precio_unitario: i.precio_unitario,
        subtotal: i.subtotal,
        notas_item: i.notas_item ?? null,
        sabores: i.sabores ?? null,
        extras: i.extras ?? null,
        acompanante: i.acompanante ?? null,
      })),
    });

    revalidatePath("/ordenes");
    return { data: orden, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear orden";
    return { data: null, error: message };
  }
}
