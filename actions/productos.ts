"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  categoriaSchema,
  productoSchema,
  type CategoriaFormValues,
  type ProductoFormValues,
} from "@/lib/validations/productos";
import type { ActionResult } from "@/types";

// ─── Imágenes ──────────────────────────────────────────────────────────────

export async function uploadProductoImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  const categoriaId = formData.get("categoriaId");

  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: "Archivo no válido" };
  }

  if (!file.type.startsWith("image/")) {
    return { data: null, error: "El archivo debe ser una imagen" };
  }

  const supabase = await createClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const uuid = crypto.randomUUID();
  const folder =
    typeof categoriaId === "string" && categoriaId
      ? categoriaId
      : "sin-categoria";
  const path = `${folder}/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadErr } = await supabase.storage
    .from("productos")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) return { data: null, error: uploadErr.message };

  const { data } = supabase.storage.from("productos").getPublicUrl(path);

  return { data: { url: data.publicUrl }, error: null };
}

// ─── Categorías ────────────────────────────────────────────────────────────

export async function createCategoriaAction(
  values: CategoriaFormValues,
): Promise<ActionResult<null>> {
  const parsed = categoriaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert(parsed.data);

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function updateCategoriaAction(
  id: string,
  values: CategoriaFormValues,
): Promise<ActionResult<null>> {
  const parsed = categoriaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function deleteCategoriaAction(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  // Verificar si hay productos asociados
  const { count } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("categoria_id", id);

  if (count && count > 0) {
    return {
      data: null,
      error: `No se puede eliminar: hay ${count} producto(s) en esta categoría`,
    };
  }

  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

// ─── Productos ─────────────────────────────────────────────────────────────

export async function createProductoAction(
  values: ProductoFormValues,
): Promise<ActionResult<null>> {
  const parsed = productoSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    imagen_url: parsed.data.imagen_url || null,
  };

  const { error } = await supabase.from("productos").insert(payload);
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function updateProductoAction(
  id: string,
  values: ProductoFormValues,
): Promise<ActionResult<null>> {
  const parsed = productoSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    imagen_url: parsed.data.imagen_url || null,
  };

  const { error } = await supabase
    .from("productos")
    .update(payload)
    .eq("id", id);

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function deleteProductoAction(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function toggleDisponibleAction(
  id: string,
  disponible: boolean,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({ disponible })
    .eq("id", id);

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}
