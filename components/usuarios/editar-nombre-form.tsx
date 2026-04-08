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
import {
  actualizarNombreSchema,
  type ActualizarNombreFormData,
} from "@/lib/validations/usuarios";
import { actualizarNombreAction } from "@/actions/usuarios";

type Props = {
  profileId: string;
  nombre: string;
  apellidoPaterno: string;
};

export function EditarNombreForm({
  profileId,
  nombre,
  apellidoPaterno,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ActualizarNombreFormData>({
    resolver: zodResolver(actualizarNombreSchema),
    defaultValues: {
      nombre,
      apellido_paterno: apellidoPaterno,
    },
  });

  function onSubmit(values: ActualizarNombreFormData) {
    startTransition(async () => {
      const result = await actualizarNombreAction(profileId, values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Nombre actualizado");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
            name="apellido_paterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido paterno</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl"
          >
            {isPending ? "Guardando..." : "Actualizar nombre"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
