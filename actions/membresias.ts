"use server";

import { revalidatePath } from "next/cache";
import {
  createNivelMembresia,
  updateNivelMembresia,
  deleteNivelMembresia,
  createReglaPuntos,
  updateReglaPuntos,
  deleteReglaPuntos,
  toggleReglaPuntosActiva,
  asignarMembresia,
  desactivarMembresia,
  registrarPago,
} from "@/lib/services/membresias";
import {
  nivelMembresiaSchema,
  reglaPuntosSchema,
  asignarMembresiaSchema,
} from "@/lib/validations/membresias";
import type { ActionResult } from "@/types";
import type { NivelMembresia, ReglaPuntos } from "@/lib/services/membresias";

// ─── Niveles ──────────────────────────────────────────────────────────────────

export async function createNivelMembresiaAction(
  formData: unknown,
): Promise<ActionResult<NivelMembresia>> {
  const parsed = nivelMembresiaSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  try {
    const nivel = await createNivelMembresia({
      nombre: parsed.data.nombre,
      beneficios: parsed.data.beneficios ?? null,
      descuento_porcentaje: parsed.data.descuento_porcentaje,
      puntos_requeridos: parsed.data.puntos_requeridos,
      orden: parsed.data.orden ?? null,
    });
    revalidatePath("/membresias");
    return { data: nivel, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear nivel",
    };
  }
}

export async function updateNivelMembresiaAction(
  id: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = nivelMembresiaSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  try {
    await updateNivelMembresia(id, {
      nombre: parsed.data.nombre,
      beneficios: parsed.data.beneficios ?? null,
      descuento_porcentaje: parsed.data.descuento_porcentaje,
      puntos_requeridos: parsed.data.puntos_requeridos,
      orden: parsed.data.orden ?? null,
    });
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar nivel",
    };
  }
}

export async function deleteNivelMembresiaAction(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteNivelMembresia(id);
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al eliminar nivel",
    };
  }
}

// ─── Reglas de puntos ─────────────────────────────────────────────────────────

export async function createReglaPuntosAction(
  formData: unknown,
): Promise<ActionResult<ReglaPuntos>> {
  const parsed = reglaPuntosSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  try {
    const regla = await createReglaPuntos({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      puntos_otorgados: parsed.data.puntos_otorgados,
      soles_por_punto: parsed.data.soles_por_punto,
      activa: parsed.data.activa,
    });
    revalidatePath("/membresias");
    return { data: regla, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear regla",
    };
  }
}

export async function updateReglaPuntosAction(
  id: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = reglaPuntosSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  try {
    await updateReglaPuntos(id, {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      puntos_otorgados: parsed.data.puntos_otorgados,
      soles_por_punto: parsed.data.soles_por_punto,
      activa: parsed.data.activa,
    });
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar regla",
    };
  }
}

export async function deleteReglaPuntosAction(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteReglaPuntos(id);
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al eliminar regla",
    };
  }
}

export async function toggleReglaPuntosActivaAction(
  id: string,
  activa: boolean,
): Promise<ActionResult<null>> {
  try {
    await toggleReglaPuntosActiva(id, activa);
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al cambiar estado",
    };
  }
}

// ─── Membresías de clientes ─────────────────────────────────────────────

export async function asignarMembresiaAction(
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = asignarMembresiaSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await asignarMembresia(parsed.data);
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al asignar membresía",
    };
  }
}

export async function desactivarMembresiaAction(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await desactivarMembresia(id);
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al desactivar membresía",
    };
  }
}

export async function registrarPagoAction(
  membresiaId: string,
  monto: number,
  tipoPlan: string,
): Promise<ActionResult<null>> {
  try {
    await registrarPago({
      membresia_id: membresiaId,
      monto,
      tipo_plan: tipoPlan,
    });
    revalidatePath("/membresias");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al registrar pago",
    };
  }
}
