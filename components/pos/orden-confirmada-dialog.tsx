"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { Orden } from "@/lib/services/ordenes";

type Props = {
  orden: Orden | null;
  open: boolean;
  onNuevoPedido: () => void;
};

import { TIPO_PEDIDO_LABELS } from "@/lib/constants";

const TIPO_PEDIDO_COLOR: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  local: "secondary",
  para_recojo: "default",
  delivery: "destructive",
};

export function OrdenConfirmadaDialog({ orden, open, onNuevoPedido }: Props) {
  const { formatCurrency } = useCurrency();
  if (!orden) return null;

  const esDelivery = orden.tipo_pedido === "delivery";
  const tieneDelivery = esDelivery && orden.delivery_fee > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onNuevoPedido()}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            ¡Pedido confirmado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Número de orden */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-muted-foreground text-sm">N° de orden</p>
            <span className="text-5xl font-bold text-primary">
              #{orden.numero_orden}
            </span>
          </div>

          {/* Tipo de pedido y referencias */}
          <div className="flex justify-center gap-2 flex-wrap">
            {orden.tipo_pedido && (
              <Badge
                variant={TIPO_PEDIDO_COLOR[orden.tipo_pedido] ?? "default"}
              >
                {TIPO_PEDIDO_LABELS[
                  orden.tipo_pedido as keyof typeof TIPO_PEDIDO_LABELS
                ] ?? orden.tipo_pedido}
              </Badge>
            )}
            {orden.mesa_referencia && (
              <Badge variant="outline">{orden.mesa_referencia}</Badge>
            )}
            {esDelivery && orden.delivery_method && (
              <Badge variant="outline">
                {orden.delivery_method === "propio" ? "Propio" : "Tercero"}
                {orden.third_party_name ? ` - ${orden.third_party_name}` : ""}
              </Badge>
            )}
          </div>

          {/* Resumen de totales */}
          <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(orden.subtotal)}
              </span>
            </div>
            {orden.descuento > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                <span>Descuento</span>
                <span className="font-medium">
                  - {formatCurrency(orden.descuento)}
                </span>
              </div>
            )}
            {tieneDelivery && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">
                  {formatCurrency(orden.delivery_fee)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-1.5 mt-0.5">
              <span className="font-bold text-base">Total</span>
              <span className="font-bold text-base text-primary">
                {formatCurrency(orden.total)}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            El cobro se realizará cuando el pedido esté listo
          </p>
        </div>

        <Button className="w-full h-12 text-base" onClick={onNuevoPedido}>
          Nuevo pedido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
