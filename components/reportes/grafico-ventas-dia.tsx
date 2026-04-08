"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { VentaPorDia } from "@/lib/services/reportes";

type Props = {
  data: VentaPorDia[];
};

type TooltipPayload = {
  value: number;
  name: string;
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
        <span className="font-medium text-foreground">
          {formatCurrency(payload[0]?.value ?? 0)}
        </span>
      </p>
      {payload[1] && (
        <p className="text-muted-foreground">
          Pedidos:{" "}
          <span className="font-medium text-foreground">
            {payload[1].value}
          </span>
        </p>
      )}
    </div>
  );
}

export function GraficoVentasDia({ data }: Props) {
  const hayDatos = data.length > 0 && data.some((d) => d.total > 0);

  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Ventas por día
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <TrendingUp className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin ventas en el período seleccionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53935" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="fecha_label"
                tick={{ fontSize: 11 }}
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
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#E53935"
                strokeWidth={2}
                fill="url(#gradTotal)"
                dot={{ r: 3, fill: "#E53935" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
