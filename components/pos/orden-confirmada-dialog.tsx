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
import { formatCurrency } from "@/lib/utils";
import type { Orden } from "@/lib/services/ordenes";

type Props = {
  orden: Orden | null;
  open: boolean;
  onNuevoPedido: () => void;
};

const TIPO_PEDIDO_LABEL: Record<string, string> = {
  local: "En local",
  para_llevar: "Para llevar",
  delivery: "Delivery",
};

const TIPO_PEDIDO_COLOR: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  local: "secondary",
  para_llevar: "default",
  delivery: "destructive",
};

export function OrdenConfirmadaDialog({ orden, open, onNuevoPedido }: Props) {
  if (!orden) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm text-center"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-xl">¡Pedido confirmado!</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">N° de orden</p>
            <span className="text-4xl font-bold text-primary">
              #{orden.numero_orden}
            </span>
          </div>

          <div className="flex justify-center gap-2">
            {orden.tipo_pedido && (
              <Badge
                variant={TIPO_PEDIDO_COLOR[orden.tipo_pedido] ?? "default"}
              >
                {TIPO_PEDIDO_LABEL[orden.tipo_pedido] ?? orden.tipo_pedido}
              </Badge>
            )}
            {orden.mesa_referencia && (
              <Badge variant="outline">{orden.mesa_referencia}</Badge>
            )}
            {orden.third_party_name && (
              <Badge variant="outline">{orden.third_party_name}</Badge>
            )}
          </div>

          <div className="rounded-xl border p-3 space-y-1 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(orden.subtotal)}</span>
            </div>
            {orden.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatCurrency(orden.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(orden.total)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            El cobro se realizará cuando el pedido esté listo
          </p>
        </div>

        <Button className="w-full h-14 text-base" onClick={onNuevoPedido}>
          Nuevo pedido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
