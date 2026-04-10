"use server";

import { revalidatePath } from "next/cache";
import {
  createPromocion,
  updatePromocion,
  deletePromocion,
  togglePromocionActiva,
} from "@/lib/services/promociones";
import { promocionSchema } from "@/lib/validations/promociones";
import type { ActionResult } from "@/types";
import type { Promocion } from "@/lib/services/promociones";

function buildPromoData(parsed: ReturnType<typeof promocionSchema.safeParse>) {
  if (!parsed.success) throw new Error("Invalid data");
  const d = parsed.data;

  // Derivar tipo_descuento para backward compatibility
  const tipo_descuento =
    d.tipo_promocion === "descuento_porcentaje"
      ? "porcentaje"
      : d.tipo_promocion === "descuento_fijo"
        ? "fijo"
        : d.tipo_promocion;

  return {
    nombre: d.nombre,
    descripcion: d.descripcion ?? null,
    tipo_promocion: d.tipo_promocion,
    tipo_descuento,
    valor_descuento: d.valor_descuento ?? 0,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin,
    activa: d.activa,
    dias_semana:
      d.dias_semana && d.dias_semana.length > 0 ? d.dias_semana : null,
    hora_inicio: d.hora_inicio || null,
    hora_fin: d.hora_fin || null,
    pedido_minimo: d.pedido_minimo || null,
    precio_combo: d.precio_combo || null,
    productos_ids: d.productos_ids ?? [],
    sucursales_ids: d.sucursales_ids ?? [],
  };
}

export async function createPromocionAction(
  formData: unknown,
): Promise<ActionResult<Promocion>> {
  const parsed = promocionSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    const promo = await createPromocion(buildPromoData(parsed));
    revalidatePath("/promociones");
    return { data: promo, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear promoción",
    };
  }
}

export async function updatePromocionAction(
  id: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = promocionSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await updatePromocion(id, buildPromoData(parsed));
    revalidatePath("/promociones");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar promoción",
    };
  }
}

export async function deletePromocionAction(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deletePromocion(id);
    revalidatePath("/promociones");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al eliminar promoción",
    };
  }
}

export async function togglePromocionActivaAction(
  id: string,
  activa: boolean,
): Promise<ActionResult<null>> {
  try {
    await togglePromocionActiva(id, activa);
    revalidatePath("/promociones");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al cambiar estado",
    };
  }
}
