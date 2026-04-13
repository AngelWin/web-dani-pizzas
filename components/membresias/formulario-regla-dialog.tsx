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
import { InputNumerico } from "@/components/ui/input-numerico";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  reglaPuntosSchema,
  type ReglaPuntosFormValues,
} from "@/lib/validations/membresias";
import {
  createReglaPuntosAction,
  updateReglaPuntosAction,
} from "@/actions/membresias";
import type { ReglaPuntos } from "@/lib/services/membresias";
import { useCurrency } from "@/hooks/use-currency";

type Props = {
  open: boolean;
  onClose: () => void;
  regla?: ReglaPuntos | null;
};

export function FormularioReglaDialog({ open, onClose, regla }: Props) {
  const esEdicion = !!regla;
  const { simbolo } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReglaPuntosFormValues>({
    resolver: zodResolver(reglaPuntosSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      puntos_otorgados: 1,
      soles_por_punto: 1,
      activa: true,
    },
  });

  useEffect(() => {
    if (open && regla) {
      form.reset({
        nombre: regla.nombre,
        descripcion: regla.descripcion ?? "",
        puntos_otorgados: regla.puntos_otorgados,
        soles_por_punto: regla.soles_por_punto,
        activa: regla.activa ?? true,
      });
    } else if (open && !regla) {
      form.reset({
        nombre: "",
        descripcion: "",
        puntos_otorgados: 1,
        soles_por_punto: 1,
        activa: true,
      });
    }
  }, [open, regla, form]);

  async function onSubmit(data: ReglaPuntosFormValues) {
    setIsSubmitting(true);
    try {
      const result = esEdicion
        ? await updateReglaPuntosAction(regla!.id, data)
        : await createReglaPuntosAction(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(esEdicion ? "Regla actualizada" : "Regla creada");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const solesPorPunto = form.watch("soles_por_punto");
  const puntosOtorgados = form.watch("puntos_otorgados");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar regla" : "Nueva regla de puntos"}
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
                      placeholder={`Ej: 1 punto por cada ${simbolo} 5`}
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
                name="soles_por_punto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto por punto ({simbolo})</FormLabel>
                    <FormControl>
                      <InputNumerico
                        variante="precio"
                        min={0.01}
                        className="h-12"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="puntos_otorgados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntos otorgados</FormLabel>
                    <FormControl>
                      <InputNumerico
                        variante="entero"
                        min={1}
                        className="h-12"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {solesPorPunto > 0 && puntosOtorgados > 0 && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Por cada{" "}
                <span className="font-medium text-foreground">
                  {simbolo} {solesPorPunto}
                </span>{" "}
                de compra el cliente acumula{" "}
                <span className="font-medium text-foreground">
                  {puntosOtorgados} punto{puntosOtorgados !== 1 ? "s" : ""}
                </span>
              </p>
            )}

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales de la regla..."
                      className="resize-none"
                      rows={2}
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
              name="activa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Activa
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Solo las reglas activas acumulan puntos en el POS
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
                    : "Crear regla"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
