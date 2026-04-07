"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { crearVentaSchema } from "@/lib/validations/ventas";
import { crearVenta } from "@/lib/services/ventas";
import type { ActionResult } from "@/types";
import type { Venta } from "@/lib/services/ventas";

export async function crearVentaAction(
  rawData: unknown,
): Promise<ActionResult<Venta>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autenticado" };
  }

  // Obtener perfil del cajero
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, sucursal_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { data: null, error: "Perfil no encontrado" };
  }

  if (!profile.sucursal_id) {
    return { data: null, error: "No tienes una sucursal asignada" };
  }

  const parsed = crearVentaSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return { data: null, error: firstError };
  }

  const { items, ...resto } = parsed.data;

  try {
    const venta = await crearVenta({
      cajero_id: profile.id,
      sucursal_origen_id: profile.sucursal_id,
      tipo_pedido: resto.tipo_pedido,
      metodo_pago: resto.metodo_pago,
      notas: resto.notas ?? null,
      mesa_referencia: resto.mesa_referencia ?? null,
      delivery_method: resto.delivery_method ?? null,
      delivery_fee: resto.delivery_fee ?? null,
      delivery_address: resto.delivery_address ?? null,
      delivery_referencia: resto.delivery_referencia ?? null,
      repartidor_id: resto.repartidor_id ?? null,
      third_party_name: resto.third_party_name ?? null,
      subtotal: items.reduce((acc, i) => acc + i.subtotal, 0),
      descuento: 0,
      total:
        items.reduce((acc, i) => acc + i.subtotal, 0) +
        (resto.delivery_fee ?? 0),
      items,
    });

    revalidatePath("/dashboard");
    return { data: venta, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear venta";
    return { data: null, error: message };
  }
}
