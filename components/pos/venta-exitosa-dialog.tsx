"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Venta } from "@/lib/services/ventas";

type Props = {
  venta: Venta | null;
  open: boolean;
  onNuevoPedido: () => void;
};

const TIPO_PEDIDO_LABEL: Record<string, string> = {
  local: "En local",
  para_llevar: "Para llevar",
  delivery: "Delivery",
};

const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
};

export function VentaExitosaDialog({ venta, open, onNuevoPedido }: Props) {
  if (!venta) return null;

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
          <DialogTitle className="text-xl">¡Venta registrada!</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <p className="text-muted-foreground text-sm">
            N° de venta:{" "}
            <span className="font-semibold text-foreground">
              #{venta.numero_venta}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">
            Tipo:{" "}
            <span className="font-medium text-foreground">
              {venta.tipo_pedido
                ? (TIPO_PEDIDO_LABEL[venta.tipo_pedido] ?? venta.tipo_pedido)
                : "-"}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">
            Pago:{" "}
            <span className="font-medium text-foreground">
              {venta.metodo_pago
                ? (METODO_PAGO_LABEL[venta.metodo_pago] ?? venta.metodo_pago)
                : "-"}
            </span>
          </p>
          <p className="text-2xl font-bold text-primary pt-2">
            {formatCurrency(venta.total)}
          </p>
        </div>

        <Button className="w-full h-14 text-base" onClick={onNuevoPedido}>
          Nuevo pedido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
