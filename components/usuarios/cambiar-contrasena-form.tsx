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
  cambiarContrasenaSchema,
  type CambiarContrasenaFormData,
} from "@/lib/validations/usuarios";
import { cambiarContrasenaAction } from "@/actions/usuarios";

export function CambiarContrasenaForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CambiarContrasenaFormData>({
    resolver: zodResolver(cambiarContrasenaSchema),
    defaultValues: {
      nueva_password: "",
      confirmar_password: "",
    },
  });

  function onSubmit(values: CambiarContrasenaFormData) {
    startTransition(async () => {
      const result = await cambiarContrasenaAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Contraseña actualizada correctamente");
        form.reset();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nueva_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmar_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl"
          >
            {isPending ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
