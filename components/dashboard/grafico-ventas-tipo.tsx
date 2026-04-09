"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import type { DesgloseTipo } from "@/lib/services/dashboard";
import { PieChart } from "lucide-react";

type GraficoVentasTipoProps = {
  data: DesgloseTipo[];
};

const COLORES_TIPO: Record<string, string> = {
  en_local: "#2196F3",
  para_llevar: "#FF7043",
  delivery: "#E53935",
};

type TooltipPayload = {
  name: string;
  value: number;
};

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
        <span className="text-foreground font-medium">
          {formatCurrency(payload[0]?.value ?? 0)}
        </span>
      </p>
      {payload[1] && (
        <p className="text-muted-foreground">
          Pedidos:{" "}
          <span className="text-foreground font-medium">
            {payload[1].value}
          </span>
        </p>
      )}
    </div>
  );
}

export function GraficoVentasTipo({ data }: GraficoVentasTipoProps) {
  const { simbolo, formatCurrency } = useCurrency();
  const hayDatos = data.some((d) => d.cantidad > 0);

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Ventas por tipo de pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <PieChart className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin ventas registradas hoy</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${simbolo}${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                name="Total"
                radius={[6, 6, 0, 0]}
                fill="#E53935"
                maxBarSize={64}
              >
                {data.map((entry) => (
                  <rect
                    key={entry.tipo}
                    fill={COLORES_TIPO[entry.tipo] ?? "#E53935"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {data.map((item) => (
            <div key={item.tipo} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: COLORES_TIPO[item.tipo] ?? "#E53935",
                }}
              />
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">
                {item.cantidad > 0 ? formatCurrency(item.total) : "—"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
