import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DetalleDelivery } from "@/lib/services/reportes";

type Props = {
  data: DetalleDelivery[];
};

export function TablaDetalleDelivery({ data }: Props) {
  const totalDeliveries = data.reduce((s, d) => s + d.cantidad, 0);
  const totalFees = data.reduce((s, d) => s + d.total_fees, 0);

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bike className="h-4 w-4 text-orange-500" />
          Detalle de delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalDeliveries === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Bike className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin pedidos delivery en el período</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.map((item) => (
                <div
                  key={item.metodo}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm text-foreground">
                      {item.label}
                    </p>
                    <span className="text-xs rounded-full bg-muted px-2.5 py-1 font-medium">
                      {item.cantidad} pedidos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total en fees
                      </p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(item.total_fees)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Promedio por delivery
                      </p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(item.promedio_fee)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  Total deliveries
                </span>
                <span className="font-bold">{totalDeliveries}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">
                  Total fees cobrados
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totalFees)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
