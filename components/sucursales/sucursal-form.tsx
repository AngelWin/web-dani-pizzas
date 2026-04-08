"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  sucursalSchema,
  type SucursalFormData,
} from "@/lib/validations/sucursales";
import {
  createSucursalAction,
  updateSucursalAction,
} from "@/actions/sucursales";
import type { Sucursal } from "@/lib/services/sucursales";

type Props = {
  sucursal?: Sucursal;
  onSuccess?: () => void;
};

export function SucursalForm({ sucursal, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!sucursal;

  const form = useForm<SucursalFormData>({
    resolver: zodResolver(sucursalSchema),
    defaultValues: {
      nombre: sucursal?.nombre ?? "",
      direccion: sucursal?.direccion ?? "",
      telefono: sucursal?.telefono ?? "",
      activa: sucursal?.activa ?? true,
    },
  });

  function onSubmit(values: SucursalFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateSucursalAction(sucursal.id, values)
        : await createSucursalAction(values);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Sucursal actualizada" : "Sucursal creada");
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input {...field} className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ej: 043-123456"
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activa"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <FormLabel className="text-sm font-medium">Activa</FormLabel>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Las sucursales inactivas no aparecen en el POS
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl"
          >
            {isPending
              ? isEditing
                ? "Guardando..."
                : "Creando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear sucursal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
