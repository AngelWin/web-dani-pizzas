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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InputNumerico } from "@/components/ui/input-numerico";
import { abrirSesionAction } from "@/actions/caja-sesiones";
import { useCurrency } from "@/hooks/use-currency";
import { Vault } from "lucide-react";
import { useRouter } from "next/navigation";

const schema = z.object({
  monto_inicial: z
    .number({ invalid_type_error: "Ingresa el monto inicial" })
    .min(0, "El monto no puede ser negativo"),
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
  const { simbolo } = useCurrency();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monto_inicial: 0, notas_apertura: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = await abrirSesionAction({
        sucursal_id: sucursalId,
        monto_inicial: values.monto_inicial,
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
        showCloseButton={false}
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
                  <FormLabel>
                    Monto inicial en caja — efectivo ({simbolo})
                  </FormLabel>
                  <FormControl>
                    <InputNumerico
                      variante="precio"
                      className="h-12 text-lg"
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
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

            <Button
              type="button"
              variant="ghost"
              className="w-full h-10 text-sm text-muted-foreground"
              disabled={loading}
              onClick={() => router.push("/dashboard")}
            >
              Ir al dashboard sin abrir caja
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
