"use server";

import { revalidatePath } from "next/cache";
import { createSucursal, updateSucursal } from "@/lib/services/sucursales";
import { sucursalSchema } from "@/lib/validations/sucursales";
import type { ActionResult } from "@/types";

export async function createSucursalAction(
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = sucursalSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await createSucursal(parsed.data);
    revalidatePath("/sucursales");
    revalidatePath("/configuracion");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear",
    };
  }
}

export async function updateSucursalAction(
  id: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = sucursalSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await updateSucursal(id, parsed.data);
    revalidatePath("/sucursales");
    revalidatePath("/configuracion");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al guardar",
    };
  }
}
