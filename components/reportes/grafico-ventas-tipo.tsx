"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { VentaPorTipo } from "@/lib/services/reportes";

type Props = {
  data: VentaPorTipo[];
};

const COLORES: Record<string, string> = {
  local: "#2196F3",
  para_llevar: "#FF7043",
  delivery: "#E53935",
};

type TooltipPayload = { value: number; name: string };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">
        Total:{" "}
        <span className="font-medium text-foreground">
          {formatCurrency(payload[0]?.value ?? 0)}
        </span>
      </p>
    </div>
  );
}

export function GraficoVentasTipoReporte({ data }: Props) {
  const hayDatos = data.some((d) => d.cantidad > 0);

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Distribución por tipo de pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <PieChart className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin datos en el período</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `S/${v}`}
                  width={56}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total"
                  name="Total"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={72}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.tipo}
                      fill={COLORES[entry.tipo] ?? "#E53935"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla resumen */}
            <div className="mt-4 space-y-2">
              {data.map((item) => (
                <div key={item.tipo} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORES[item.tipo] ?? "#E53935" }}
                  />
                  <span className="flex-1 text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium">
                    {item.cantidad} pedidos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.porcentaje.toFixed(0)}%)
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
