import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TopProducto } from "@/lib/services/reportes";

type Props = {
  data: TopProducto[];
};

export function TablaTopProductos({ data }: Props) {
  const maxCantidad = data[0]?.cantidad ?? 1;

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top productos más vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Trophy className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin datos en el período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, idx) => (
              <div key={item.producto_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 text-xs font-bold w-5 text-center ${
                        idx === 0
                          ? "text-yellow-500"
                          : idx === 1
                            ? "text-slate-400"
                            : idx === 2
                              ? "text-amber-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {item.producto_nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <span className="text-xs text-muted-foreground">
                      {item.cantidad} uds.
                    </span>
                    <span className="text-xs font-semibold">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(item.cantidad / maxCantidad) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
