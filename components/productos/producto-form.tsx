"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DollarSign, Layers } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  productoSchema,
  type ProductoFormValues,
} from "@/lib/validations/productos";
import {
  createProductoAction,
  updateProductoAction,
} from "@/actions/productos";
import type {
  Categoria,
  CategoriaMedida,
  ProductoCompleto,
  Sucursal,
} from "@/lib/services/productos";
import { ImageUpload } from "@/components/productos/image-upload";

interface ProductoFormProps {
  producto?: ProductoCompleto | null;
  isDuplicate?: boolean;
  categorias: Categoria[];
  categoriaMedidas: Record<string, CategoriaMedida[]>;
  sucursales: Sucursal[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductoForm({
  producto,
  isDuplicate = false,
  categorias,
  categoriaMedidas,
  sucursales,
  onSuccess,
  onCancel,
}: ProductoFormProps) {
  const isEditing = !!producto && !isDuplicate;
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Medidas de la categoría seleccionada actualmente
  const categoriaIdInicial = producto?.categoria_id ?? null;
  const medidasIniciales = categoriaIdInicial
    ? (categoriaMedidas[categoriaIdInicial] ?? [])
    : [];

  // Variantes iniciales al editar
  const variantesIniciales = medidasIniciales.map((medida) => {
    const variante = producto?.producto_variantes?.find(
      (v) => v.medida_id === medida.id,
    );
    return {
      medida_id: medida.id,
      medida_nombre: medida.nombre,
      precio: variante?.precio ?? 0,
      disponible: variante?.disponible ?? true,
    };
  });

  // Sucursales disponibles iniciales al editar
  const sucursalesIniciales =
    producto?.producto_sucursal?.map((ps) => ps.sucursal_id) ?? [];

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    mode: "onChange",
    defaultValues: {
      nombre: isDuplicate ? "" : (producto?.nombre ?? ""),
      descripcion: producto?.descripcion ?? "",
      precio: producto?.precio != null ? Number(producto.precio) : null,
      categoria_id: categoriaIdInicial,
      imagen_url: producto?.imagen_url ?? "",
      disponible: producto?.disponible ?? true,
      variantes: variantesIniciales,
      sucursales_ids: sucursalesIniciales,
    },
  });

  const { fields: varianteFields, replace: replaceVariantes } = useFieldArray({
    control: form.control,
    name: "variantes",
  });

  const categoriaIdActual = form.watch("categoria_id");
  const medidasActuales = categoriaIdActual
    ? (categoriaMedidas[categoriaIdActual] ?? [])
    : [];
  const tieneVariantes = medidasActuales.length > 0;

  const nombreValue = form.watch("nombre");
  const imagenValue = form.watch("imagen_url");
  const variantesValue = form.watch("variantes");
  const precioValue = form.watch("precio");

  const isFormReady =
    !!nombreValue?.trim() &&
    !!imagenValue &&
    (tieneVariantes
      ? (variantesValue?.length ?? 0) > 0 &&
        variantesValue!.every((v) => (v.precio ?? -1) >= 0)
      : precioValue != null && precioValue > 0);

  // Cuando cambia la categoría, reconstruir las variantes
  useEffect(() => {
    const medidas = categoriaIdActual
      ? (categoriaMedidas[categoriaIdActual] ?? [])
      : [];

    if (medidas.length === 0) {
      replaceVariantes([]);
      return;
    }

    // Al editar o duplicar, si la categoría no cambió, mantener los precios existentes
    const esCategoriaSinCambio =
      (isEditing || isDuplicate) &&
      categoriaIdActual === producto?.categoria_id;

    const nuevasVariantes = medidas.map((medida) => {
      if (esCategoriaSinCambio) {
        const varianteExistente = producto?.producto_variantes?.find(
          (v) => v.medida_id === medida.id,
        );
        return {
          medida_id: medida.id,
          medida_nombre: medida.nombre,
          precio: varianteExistente?.precio ?? 0,
          disponible: varianteExistente?.disponible ?? true,
        };
      }
      return {
        medida_id: medida.id,
        medida_nombre: medida.nombre,
        precio: 0,
        disponible: true,
      };
    });

    replaceVariantes(nuevasVariantes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaIdActual]);

  const onSubmit = async (values: ProductoFormValues) => {
    const result = isEditing
      ? await updateProductoAction(producto.id, values)
      : await createProductoAction(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Producto actualizado" : "Producto creado");
    onSuccess();
  };

  const sucursalesSeleccionadas = form.watch("sucursales_ids") ?? [];

  const toggleSucursal = (sucursalId: string, checked: boolean) => {
    const actuales = form.getValues("sucursales_ids") ?? [];
    if (checked) {
      form.setValue("sucursales_ids", [...actuales, sucursalId]);
    } else {
      form.setValue(
        "sucursales_ids",
        actuales.filter((id) => id !== sucursalId),
      );
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* Nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Pizza Margarita" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del producto..."
                  rows={2}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoría */}
        <FormField
          control={form.control}
          name="categoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                value={field.value ?? "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                      {(categoriaMedidas[c.id]?.length ?? 0) > 0 && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({categoriaMedidas[c.id].length} medidas)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Precio base (solo si la categoría no tiene medidas) */}
        {!tieneVariantes && (
          <FormField
            control={form.control}
            name="precio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Precio (S/) *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? "" : Number(val));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Variantes por medida (si la categoría tiene medidas) */}
        {tieneVariantes && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium">Precios por medida *</p>
            </div>
            <div className="rounded-xl border divide-y">
              {varianteFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{field.medida_nombre}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name={`variantes.${index}.precio`}
                    render={({ field: f }) => (
                      <FormItem className="w-28 space-y-0">
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              S/
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-7 text-right"
                              {...f}
                              value={f.value || ""}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                f.onChange(val === "" ? 0 : Number(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variantes.${index}.disponible`}
                    render={({ field: f }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Switch
                            checked={f.value}
                            onCheckedChange={f.onChange}
                            title="Disponible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              El switch indica si esa variante está disponible en el POS.
            </p>
          </div>
        )}

        {/* Imagen */}
        <FormField
          control={form.control}
          name="imagen_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del producto</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  categoriaId={form.watch("categoria_id")}
                  onChange={(url) => field.onChange(url ?? "")}
                  onUploadingChange={setIsImageUploading}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Disponibilidad por sucursal */}
        {sucursales.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Disponible en sucursales</p>
            <div className="rounded-xl border divide-y">
              {sucursales.map((suc) => (
                <div key={suc.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    id={`suc-${suc.id}`}
                    checked={sucursalesSeleccionadas.includes(suc.id)}
                    onCheckedChange={(checked) =>
                      toggleSucursal(suc.id, !!checked)
                    }
                  />
                  <label
                    htmlFor={`suc-${suc.id}`}
                    className="text-sm cursor-pointer select-none flex-1"
                  >
                    {suc.nombre}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Si no seleccionas ninguna, el producto no aparece en el POS.
            </p>
          </div>
        )}

        {/* Disponible global */}
        <FormField
          control={form.control}
          name="disponible"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-3">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div>
                <FormLabel className="cursor-pointer">Disponible</FormLabel>
                <p className="text-muted-foreground text-xs">
                  El producto aparece en el POS
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting || isImageUploading || !isFormReady
            }
          >
            {form.formState.isSubmitting
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
