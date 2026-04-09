"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { VentaPorSucursal } from "@/lib/services/reportes";

type Props = {
  data: VentaPorSucursal[];
};

export function TablaSucursales({ data }: Props) {
  const { formatCurrency } = useCurrency();
  const maxTotal = Math.max(...data.map((s) => s.total), 1);

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="h-4 w-4 text-primary" />
          Rendimiento por sucursal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin datos en el período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data
              .sort((a, b) => b.total - a.total)
              .map((sucursal) => (
                <div key={sucursal.sucursal_id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {sucursal.sucursal_nombre}
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(sucursal.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${(sucursal.total / maxTotal) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{sucursal.cantidad} ventas</span>
                    <span>Prom: {formatCurrency(sucursal.promedio)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
