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
import { cerrarSesionAction } from "@/actions/caja-sesiones";
import { cancelarOrdenesAlCerrarCaja } from "@/app/(dashboard)/ordenes/actions";
import { useCurrency } from "@/hooks/use-currency";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  monto_contado_efectivo: z
    .number({ invalid_type_error: "Ingresa el monto contado" })
    .min(0, "El monto no puede ser negativo"),
  notas_cierre: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sesionId: string;
  montoEsperado: number;
  onSuccess: () => void;
};

export function CerrarCajaDialog({
  open,
  onOpenChange,
  sesionId,
  montoEsperado,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const { formatCurrency, simbolo } = useCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monto_contado_efectivo: 0, notas_cierre: "" },
  });

  const montoContadoWatch = form.watch("monto_contado_efectivo");
  const diffPreview =
    typeof montoContadoWatch === "number"
      ? Math.round((montoContadoWatch - montoEsperado) * 100) / 100
      : null;

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = await cerrarSesionAction({
        sesion_id: sesionId,
        monto_contado_efectivo: values.monto_contado_efectivo,
        notas_cierre: values.notas_cierre || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Caja cerrada correctamente");

      // Cancelar órdenes activas pendientes y liberar sus mesas
      const limpieza = await cancelarOrdenesAlCerrarCaja();
      if (!limpieza.error && (limpieza.data?.canceladas ?? 0) > 0) {
        toast.info(
          `Se cancelaron ${limpieza.data!.canceladas} orden${limpieza.data!.canceladas === 1 ? "" : "es"} activas y se liberaron sus mesas.`,
        );
      }

      form.reset();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1 mb-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Efectivo esperado en caja</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(montoEsperado)}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto_contado_efectivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Monto contado en caja — efectivo real ({simbolo})
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

            {/* Preview diferencia */}
            {diffPreview !== null && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl p-3 text-sm font-medium",
                  diffPreview === 0
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : diffPreview > 0
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                )}
              >
                {diffPreview === 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {diffPreview === 0
                    ? "La caja cuadra perfectamente"
                    : diffPreview > 0
                      ? `Sobrante: ${formatCurrency(diffPreview)}`
                      : `Faltante: ${formatCurrency(Math.abs(diffPreview))}`}
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="notas_cierre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de cierre (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observaciones del cierre..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 font-semibold"
                variant="destructive"
                disabled={loading}
              >
                {loading ? "Cerrando..." : "Cerrar caja"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
