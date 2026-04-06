"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import type { Categoria, Producto } from "@/lib/services/productos";
import { ImageUpload } from "@/components/productos/image-upload";

interface ProductoFormProps {
  producto?: Producto | null;
  categorias: Categoria[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductoForm({
  producto,
  categorias,
  onSuccess,
  onCancel,
}: ProductoFormProps) {
  const isEditing = !!producto;
  const [isImageUploading, setIsImageUploading] = useState(false);

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    mode: "onChange",
    defaultValues: {
      nombre: producto?.nombre ?? "",
      descripcion: producto?.descripcion ?? "",
      precio: producto?.precio ? Number(producto.precio) : ("" as unknown as number),
      categoria_id: producto?.categoria_id ?? null,
      imagen_url: producto?.imagen_url ?? "",
      disponible: producto?.disponible ?? true,
    },
  });

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del producto..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="precio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (S/) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="flex justify-end gap-2 pt-2">
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
              form.formState.isSubmitting ||
              isImageUploading ||
              !form.formState.isValid
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
