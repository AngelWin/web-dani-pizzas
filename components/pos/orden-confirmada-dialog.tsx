"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Printer } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { buildTicketOrdenResumen } from "@/lib/printing/ticket-builder";
import type { Orden } from "@/lib/services/ordenes";

const PrintPreviewDialog = dynamic(
  () =>
    import("@/components/printing/print-preview-dialog").then(
      (mod) => mod.PrintPreviewDialog,
    ),
  { ssr: false },
);

type Props = {
  orden: Orden | null;
  open: boolean;
  onNuevoPedido: () => void;
  sucursalNombre?: string;
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

export function OrdenConfirmadaDialog({
  orden,
  open,
  onNuevoPedido,
  sucursalNombre = "",
}: Props) {
  const { formatCurrency } = useCurrency();
  const [printOpen, setPrintOpen] = useState(false);

  const lineasTicket = useMemo(
    () =>
      orden
        ? buildTicketOrdenResumen(orden, sucursalNombre, formatCurrency)
        : [],
    [orden, sucursalNombre, formatCurrency],
  );

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

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl"
            onClick={() => setPrintOpen(true)}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Imprimir
          </Button>
          <Button
            className="h-12 flex-1 rounded-xl text-base"
            onClick={onNuevoPedido}
          >
            Nuevo pedido
          </Button>
        </div>

        {printOpen && (
          <PrintPreviewDialog
            lineasTicket={lineasTicket}
            open={printOpen}
            onOpenChange={setPrintOpen}
            sucursalNombre={sucursalNombre}
            referencia={`Orden${orden.numero_orden}`}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
