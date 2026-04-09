"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  categoriaSchema,
  categoriaMedidaSchema,
  productoSchema,
  type CategoriaFormValues,
  type CategoriaMedidaFormValues,
  type ProductoFormValues,
} from "@/lib/validations/productos";
import { getProductoCompleto } from "@/lib/services/productos";
import type { ActionResult } from "@/types";
import type { ProductoCompleto } from "@/lib/services/productos";

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

// ─── Medidas por categoría ─────────────────────────────────────────────────

export async function createMedidaAction(
  categoriaId: string,
  values: CategoriaMedidaFormValues,
): Promise<ActionResult<null>> {
  const parsed = categoriaMedidaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categoria_medidas").insert({
    ...parsed.data,
    categoria_id: categoriaId,
  });

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function updateMedidaAction(
  id: string,
  values: CategoriaMedidaFormValues,
): Promise<ActionResult<null>> {
  const parsed = categoriaMedidaSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categoria_medidas")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function deleteMedidaAction(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("producto_variantes")
    .select("*", { count: "exact", head: true })
    .eq("medida_id", id);

  if (count && count > 0) {
    return {
      data: null,
      error: `No se puede eliminar: ${count} producto(s) usan esta medida`,
    };
  }

  const { error } = await supabase
    .from("categoria_medidas")
    .delete()
    .eq("id", id);
  if (error) return { data: null, error: error.message };

  revalidatePath("/productos");
  return { data: null, error: null };
}

// ─── Productos ─────────────────────────────────────────────────────────────

export async function getProductoCompletoAction(
  id: string,
): Promise<ActionResult<ProductoCompleto>> {
  const producto = await getProductoCompleto(id);
  if (!producto) return { data: null, error: "Producto no encontrado" };
  return { data: producto, error: null };
}

export async function createProductoAction(
  values: ProductoFormValues,
): Promise<ActionResult<null>> {
  const parsed = productoSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { variantes, sucursales_ids, ...productoData } = parsed.data;
  const variantesArray = variantes ?? [];
  const sucursalesArray = sucursales_ids ?? [];
  const tieneVariantes = variantesArray.length > 0;

  if (!tieneVariantes && !productoData.precio) {
    return {
      data: null,
      error: "El precio es requerido para productos sin variantes",
    };
  }

  const supabase = await createClient();

  const payload = {
    nombre: productoData.nombre,
    descripcion: productoData.descripcion ?? null,
    precio: tieneVariantes ? null : productoData.precio,
    categoria_id: productoData.categoria_id ?? null,
    imagen_url: productoData.imagen_url || null,
    disponible: productoData.disponible,
  };

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .insert(payload)
    .select("id")
    .single();

  if (productoError) return { data: null, error: productoError.message };

  const productoId = producto.id;

  if (variantesArray.length > 0) {
    const variantesPayload = variantesArray.map((v, idx) => ({
      producto_id: productoId,
      medida_id: v.medida_id,
      precio: v.precio,
      disponible: v.disponible,
      orden: idx,
    }));
    const { error: variantesError } = await supabase
      .from("producto_variantes")
      .insert(variantesPayload);
    if (variantesError) return { data: null, error: variantesError.message };
  }

  if (sucursalesArray.length > 0) {
    const sucursalesPayload = sucursalesArray.map((sucursalId) => ({
      producto_id: productoId,
      sucursal_id: sucursalId,
      disponible: true,
    }));
    const { error: sucursalesError } = await supabase
      .from("producto_sucursal")
      .insert(sucursalesPayload);
    if (sucursalesError) return { data: null, error: sucursalesError.message };
  }

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

  const { variantes, sucursales_ids, ...productoData } = parsed.data;
  const variantesArray = variantes ?? [];
  const sucursalesArray = sucursales_ids ?? [];
  const tieneVariantes = variantesArray.length > 0;

  if (!tieneVariantes && !productoData.precio) {
    return {
      data: null,
      error: "El precio es requerido para productos sin variantes",
    };
  }

  const supabase = await createClient();

  const payload = {
    nombre: productoData.nombre,
    descripcion: productoData.descripcion ?? null,
    precio: tieneVariantes ? null : productoData.precio,
    categoria_id: productoData.categoria_id ?? null,
    imagen_url: productoData.imagen_url || null,
    disponible: productoData.disponible,
  };

  const { error: productoError } = await supabase
    .from("productos")
    .update(payload)
    .eq("id", id);

  if (productoError) return { data: null, error: productoError.message };

  // Actualizar variantes preservando IDs (para no romper FK de orden_items)
  if (variantesArray.length > 0) {
    const { data: existentes } = await supabase
      .from("producto_variantes")
      .select("id, medida_id")
      .eq("producto_id", id);

    const existentesMap = new Map(
      (existentes ?? []).map((v) => [v.medida_id, v.id]),
    );

    const toUpdate: {
      id: string;
      precio: number;
      disponible: boolean;
      orden: number;
    }[] = [];
    const toInsert: {
      producto_id: string;
      medida_id: string;
      precio: number;
      disponible: boolean;
      orden: number;
    }[] = [];

    variantesArray.forEach((v, idx) => {
      const existenteId = existentesMap.get(v.medida_id);
      if (existenteId) {
        toUpdate.push({
          id: existenteId,
          precio: v.precio,
          disponible: v.disponible,
          orden: idx,
        });
      } else {
        toInsert.push({
          producto_id: id,
          medida_id: v.medida_id,
          precio: v.precio,
          disponible: v.disponible,
          orden: idx,
        });
      }
    });

    for (const v of toUpdate) {
      const { error } = await supabase
        .from("producto_variantes")
        .update({ precio: v.precio, disponible: v.disponible, orden: v.orden })
        .eq("id", v.id);
      if (error) return { data: null, error: error.message };
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("producto_variantes")
        .insert(toInsert);
      if (error) return { data: null, error: error.message };
    }
  }

  // Reemplazar disponibilidad por sucursal: borrar y reinsertar
  const { error: deleteSucursalesError } = await supabase
    .from("producto_sucursal")
    .delete()
    .eq("producto_id", id);
  if (deleteSucursalesError)
    return { data: null, error: deleteSucursalesError.message };

  if (sucursalesArray.length > 0) {
    const sucursalesPayload = sucursalesArray.map((sucursalId) => ({
      producto_id: id,
      sucursal_id: sucursalId,
      disponible: true,
    }));
    const { error: sucursalesError } = await supabase
      .from("producto_sucursal")
      .insert(sucursalesPayload);
    if (sucursalesError) return { data: null, error: sucursalesError.message };
  }

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

// ─── Pizza Sabores ─────────────────────────────────────────────────────────

export async function createPizzaSaborAction(data: {
  categoria_id: string;
  nombre: string;
  descripcion?: string | null;
  disponible?: boolean;
  orden?: number;
}): Promise<ActionResult<{ id: string }>> {
  if (!data.nombre?.trim()) {
    return { data: null, error: "El nombre es requerido" };
  }
  const supabase = await createClient();
  const { data: sabor, error } = await supabase
    .from("pizza_sabores")
    .insert(data)
    .select("id")
    .single();
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: { id: sabor.id }, error: null };
}

export async function updatePizzaSaborAction(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string | null;
    disponible?: boolean;
    orden?: number;
  },
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pizza_sabores")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function deletePizzaSaborAction(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("pizza_sabores").delete().eq("id", id);
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function upsertSaborIngredientesAction(
  saborId: string,
  ingredientes: { nombre: string; es_principal: boolean; orden: number }[],
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("sabor_ingredientes")
    .delete()
    .eq("sabor_id", saborId);
  if (delError) return { data: null, error: delError.message };

  if (ingredientes.length > 0) {
    const { error: insError } = await supabase
      .from("sabor_ingredientes")
      .insert(
        ingredientes.map((ing) => ({
          sabor_id: saborId,
          nombre: ing.nombre,
          es_principal: ing.es_principal,
          orden: ing.orden,
        })),
      );
    if (insError) return { data: null, error: insError.message };
  }

  revalidatePath("/productos");
  return { data: null, error: null };
}

// ─── Producto Extras ───────────────────────────────────────────────────────

export async function createProductoExtraAction(data: {
  categoria_id: string;
  nombre: string;
  precio: number;
  disponible?: boolean;
  orden?: number;
}): Promise<ActionResult<null>> {
  if (!data.nombre?.trim()) {
    return { data: null, error: "El nombre es requerido" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("producto_extras").insert(data);
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function updateProductoExtraAction(
  id: string,
  data: {
    nombre?: string;
    precio?: number;
    disponible?: boolean;
    orden?: number;
  },
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("producto_extras")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: null, error: null };
}

export async function deleteProductoExtraAction(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("producto_extras")
    .delete()
    .eq("id", id);
  if (error) return { data: null, error: error.message };
  revalidatePath("/productos");
  return { data: null, error: null };
}
