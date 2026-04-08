"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  nivelMembresiaSchema,
  type NivelMembresiaFormValues,
} from "@/lib/validations/membresias";
import {
  createNivelMembresiaAction,
  updateNivelMembresiaAction,
} from "@/actions/membresias";
import type { NivelMembresia } from "@/lib/services/membresias";

type Props = {
  open: boolean;
  onClose: () => void;
  nivel?: NivelMembresia | null;
};

export function FormularioNivelDialog({ open, onClose, nivel }: Props) {
  const esEdicion = !!nivel;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NivelMembresiaFormValues>({
    resolver: zodResolver(nivelMembresiaSchema),
    defaultValues: {
      nombre: "",
      beneficios: "",
      descuento_porcentaje: 0,
      puntos_requeridos: 0,
      orden: null,
    },
  });

  useEffect(() => {
    if (open && nivel) {
      form.reset({
        nombre: nivel.nombre,
        beneficios: nivel.beneficios ?? "",
        descuento_porcentaje: nivel.descuento_porcentaje ?? 0,
        puntos_requeridos: nivel.puntos_requeridos,
        orden: nivel.orden ?? null,
      });
    } else if (open && !nivel) {
      form.reset({
        nombre: "",
        beneficios: "",
        descuento_porcentaje: 0,
        puntos_requeridos: 0,
        orden: null,
      });
    }
  }, [open, nivel, form]);

  async function onSubmit(data: NivelMembresiaFormValues) {
    setIsSubmitting(true);
    try {
      const result = esEdicion
        ? await updateNivelMembresiaAction(nivel!.id, data)
        : await createNivelMembresiaAction(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(esEdicion ? "Nivel actualizado" : "Nivel creado");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar nivel" : "Nuevo nivel de membresía"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Bronce, Plata, Oro"
                      className="h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="puntos_requeridos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntos requeridos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descuento_porcentaje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="beneficios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficios (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los beneficios de este nivel..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orden"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden de visualización (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Ej: 1, 2, 3..."
                      className="h-12"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear nivel"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
