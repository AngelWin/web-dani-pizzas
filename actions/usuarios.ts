"use server";

import { revalidatePath } from "next/cache";
import {
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarContrasena,
  actualizarNombrePerfil,
  countAdmins,
} from "@/lib/services/usuarios";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  cambiarContrasenaSchema,
  actualizarNombreSchema,
} from "@/lib/validations/usuarios";
import type { ActionResult } from "@/types";

export async function crearUsuarioAction(
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = crearUsuarioSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await crearUsuario(parsed.data);
    revalidatePath("/usuarios");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear usuario",
    };
  }
}

export async function actualizarUsuarioAction(
  profileId: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = actualizarUsuarioSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await actualizarUsuario(profileId, parsed.data);
    revalidatePath("/usuarios");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar usuario",
    };
  }
}

export async function eliminarUsuarioAction(
  profileId: string,
  esAdmin: boolean,
): Promise<ActionResult<null>> {
  if (esAdmin) {
    // Verificar que no es el último admin
    const totalAdmins = await countAdmins();
    if (totalAdmins <= 1) {
      return {
        data: null,
        error: "No puedes eliminar al único administrador del sistema",
      };
    }
  }

  try {
    await eliminarUsuario(profileId);
    revalidatePath("/usuarios");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al eliminar usuario",
    };
  }
}

export async function cambiarContrasenaAction(
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = cambiarContrasenaSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await cambiarContrasena(parsed.data.nueva_password);
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al cambiar la contraseña",
    };
  }
}

export async function actualizarNombreAction(
  profileId: string,
  formData: unknown,
): Promise<ActionResult<null>> {
  const parsed = actualizarNombreSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  try {
    await actualizarNombrePerfil(
      profileId,
      parsed.data.nombre,
      parsed.data.apellido_paterno,
    );
    revalidatePath("/perfil");
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar nombre",
    };
  }
}
