"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { VentaDetalle } from "@/lib/services/reportes";

type Props = {
  data: VentaDetalle[];
  mostrarSucursal: boolean;
};

import { TIPO_PEDIDO_LABELS } from "@/lib/constants";

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transf.",
};

export function TablaVentasDetalle({ data, mostrarSucursal }: Props) {
  const { formatCurrency } = useCurrency();
  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Detalle de ventas
          <span className="text-xs font-normal text-muted-foreground">
            (últimas {data.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin ventas en el período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Pago
                  </th>
                  {mostrarSucursal && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Sucursal
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Cajero
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((venta) => (
                  <tr
                    key={venta.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs font-medium text-primary">
                      #{venta.numero_venta}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {venta.fecha}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {TIPO_PEDIDO_LABELS[
                        venta.tipo_pedido as keyof typeof TIPO_PEDIDO_LABELS
                      ] ?? venta.tipo_pedido}
                      {venta.tipo_pedido === "delivery" &&
                        venta.delivery_method && (
                          <span className="ml-1 text-muted-foreground">
                            (
                            {venta.delivery_method === "propio"
                              ? "propio"
                              : (venta.third_party_name ?? "tercero")}
                            )
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {METODO_LABELS[venta.metodo_pago] ?? venta.metodo_pago}
                    </td>
                    {mostrarSucursal && (
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {venta.sucursal_nombre ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {venta.cajero_nombre ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold">
                      {formatCurrency(venta.total)}
                      {venta.delivery_fee != null && venta.delivery_fee > 0 && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          +{formatCurrency(venta.delivery_fee)} delivery
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
