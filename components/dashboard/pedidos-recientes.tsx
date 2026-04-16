"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { TIPO_PEDIDO, DELIVERY_STATUS } from "@/lib/constants";
import type { PedidoReciente } from "@/lib/services/dashboard";

type PedidosRecientesProps = {
  pedidos: PedidoReciente[];
};

import { TIPO_PEDIDO_LABELS } from "@/lib/constants";

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transf.",
};

function TipoBadge({ tipo }: { tipo: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    [TIPO_PEDIDO.EN_LOCAL]: "default",
    [TIPO_PEDIDO.RECOJO]: "secondary",
    [TIPO_PEDIDO.DELIVERY]: "destructive",
  };
  return (
    <Badge variant={variants[tipo] ?? "outline"} className="text-xs">
      {TIPO_PEDIDO_LABELS[tipo as keyof typeof TIPO_PEDIDO_LABELS] ?? tipo}
    </Badge>
  );
}

function DeliveryStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    [DELIVERY_STATUS.PENDIENTE]: {
      label: "Pendiente",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    [DELIVERY_STATUS.EN_CAMINO]: {
      label: "En camino",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    [DELIVERY_STATUS.ENTREGADO]: {
      label: "Entregado",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
  };
  const info = map[status];
  if (!info) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${info.className}`}
    >
      {info.label}
    </span>
  );
}

export function PedidosRecientes({ pedidos }: PedidosRecientesProps) {
  const { formatCurrency } = useCurrency();
  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Pedidos recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <ShoppingBag className="h-10 w-10 opacity-30" />
            <p className="text-sm">No hay pedidos registrados aún</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                    #{pedido.numero_venta}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TipoBadge tipo={pedido.tipo_pedido} />
                      {pedido.delivery_status && (
                        <DeliveryStatusBadge status={pedido.delivery_status} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {formatDateTime(pedido.created_at)}
                      {pedido.cajero_nombre && ` · ${pedido.cajero_nombre}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">
                    {formatCurrency(pedido.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {METODO_LABELS[pedido.metodo_pago] ?? pedido.metodo_pago}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
