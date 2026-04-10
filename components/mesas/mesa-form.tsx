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
import { mesaSchema, type MesaFormValues } from "@/lib/validations/mesas";
import { createMesaAction, updateMesaAction } from "@/actions/mesas";
import type { Mesa } from "@/lib/services/mesas";

type Props = {
  sucursalId: string;
  mesa?: Mesa;
  onSuccess?: () => void;
};

export function MesaForm({ sucursalId, mesa, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!mesa;

  const form = useForm<MesaFormValues>({
    resolver: zodResolver(mesaSchema),
    defaultValues: {
      numero: mesa?.numero ?? 1,
      sillas: mesa?.sillas ?? 4,
      activa: mesa?.activa ?? true,
    },
  });

  function onSubmit(values: MesaFormValues) {
    startTransition(async () => {
      const result = isEditing
        ? await updateMesaAction(mesa.id, values)
        : await createMesaAction(sucursalId, values);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Mesa actualizada" : "Mesa creada");
        form.reset({
          numero: (values.numero ?? 0) + 1,
          sillas: 4,
          activa: true,
        });
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de mesa</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    className="h-11 rounded-xl"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sillas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sillas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    className="h-11 rounded-xl"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="activa"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <FormLabel className="text-sm font-medium">Activa</FormLabel>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Las mesas inactivas no aparecen en el POS
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

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 px-5 rounded-xl"
          >
            {isPending
              ? isEditing
                ? "Guardando..."
                : "Creando..."
              : isEditing
                ? "Guardar"
                : "Crear mesa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
