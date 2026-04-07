"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { cancelarOrdenAction } from "@/app/(dashboard)/ordenes/actions";
import type { OrdenConItems } from "@/lib/services/ordenes";

type Props = {
  orden: OrdenConItems;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelarOrdenDialog({ orden, open, onOpenChange }: Props) {
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  const motivoValido = motivo.trim().length >= 3;
  const enPreparacion = orden.estado === "en_preparacion";

  function handleCancelar() {
    if (!motivoValido) return;
    startTransition(async () => {
      const result = await cancelarOrdenAction(orden.id, motivo.trim());
      if (result.error) {
        toast.error("Error al cancelar orden", { description: result.error });
      } else {
        toast.success(`Orden #${orden.numero_orden} cancelada`);
        setMotivo("");
        onOpenChange(false);
      }
    });
  }

  function handleClose() {
    if (pending) return;
    setMotivo("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                enPreparacion ? "text-amber-500" : "text-destructive",
              )}
            />
            Cancelar orden #{orden.numero_orden}
          </DialogTitle>
        </DialogHeader>

        {/* Advertencia si está en preparación */}
        {enPreparacion && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Esta orden ya está siendo preparada en cocina. Asegúrate de
            comunicar la cancelación al personal.
          </div>
        )}

        {/* Resumen de la orden */}
        <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Contenido de la orden
          </p>
          {orden.orden_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                <span className="font-medium">{item.cantidad}×</span>{" "}
                {item.producto_nombre}
                {item.variante_nombre && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({item.variante_nombre})
                  </span>
                )}
              </span>
              <span className="shrink-0 pl-2 text-muted-foreground">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}

          <Separator className="my-1" />

          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(orden.total)}</span>
          </div>
        </div>

        {/* Motivo obligatorio */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Motivo de cancelación <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Describe el motivo de la cancelación..."
            className="resize-none"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={pending}
            autoFocus
          />
          {motivo.length > 0 && !motivoValido && (
            <p className="text-xs text-destructive">
              El motivo debe tener al menos 3 caracteres
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={handleClose}
            disabled={pending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 flex-1"
            onClick={handleCancelar}
            disabled={!motivoValido || pending}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Confirmar cancelación"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
