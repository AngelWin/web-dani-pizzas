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

export async function createPromocionAction(
  formData: unknown,
): Promise<ActionResult<Promocion>> {
  const parsed = promocionSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    const promo = await createPromocion({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      tipo_descuento: parsed.data.tipo_descuento,
      valor_descuento: parsed.data.valor_descuento,
      fecha_inicio: parsed.data.fecha_inicio,
      fecha_fin: parsed.data.fecha_fin,
      activa: parsed.data.activa,
      productos_ids: parsed.data.productos_ids ?? [],
    });
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
    await updatePromocion(id, {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      tipo_descuento: parsed.data.tipo_descuento,
      valor_descuento: parsed.data.valor_descuento,
      fecha_inicio: parsed.data.fecha_inicio,
      fecha_fin: parsed.data.fecha_fin,
      activa: parsed.data.activa,
      productos_ids: parsed.data.productos_ids ?? [],
    });
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
