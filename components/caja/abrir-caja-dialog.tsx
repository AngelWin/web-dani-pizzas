"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { abrirSesionAction } from "@/actions/caja-sesiones";
import { Vault } from "lucide-react";

const schema = z.object({
  monto_inicial: z
    .string()
    .min(1, "Ingresa el monto inicial")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Debe ser un número mayor o igual a 0",
    }),
  notas_apertura: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  sucursalId: string;
  onSuccess: () => void;
};

export function AbrirCajaDialog({ open, sucursalId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monto_inicial: "0", notas_apertura: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = await abrirSesionAction({
        sucursal_id: sucursalId,
        monto_inicial: Number(values.monto_inicial),
        notas_apertura: values.notas_apertura || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Caja abierta correctamente");
      form.reset();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vault className="h-5 w-5 text-primary" />
            Abrir caja
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto_inicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto inicial en caja (efectivo)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-12 text-lg"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas_apertura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observaciones de apertura..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Abriendo..." : "Abrir caja"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
