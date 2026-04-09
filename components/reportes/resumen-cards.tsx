import {
  ShoppingBag,
  TrendingUp,
  Bike,
  UtensilsCrossed,
  Package,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ResumenVentas } from "@/lib/services/reportes";

type Props = {
  resumen: ResumenVentas;
};

export function ResumenCards({ resumen }: Props) {
  const cards = [
    {
      label: "Total ventas",
      value: formatCurrency(resumen.total_ventas),
      sub: `${resumen.num_ventas} ${resumen.num_ventas === 1 ? "venta" : "ventas"}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Promedio por venta",
      value: formatCurrency(resumen.promedio_venta),
      sub: "Ticket promedio",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Delivery",
      value: `${resumen.num_delivery}`,
      sub: `Fees: ${formatCurrency(resumen.total_delivery_fees)}`,
      icon: Bike,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "En local",
      value: `${resumen.num_local}`,
      sub: "pedidos",
      icon: UtensilsCrossed,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      label: "Recojo",
      value: `${resumen.num_para_llevar}`,
      sub: "pedidos",
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Total pedidos",
      value: `${resumen.num_ventas}`,
      sub: "en el período",
      icon: ShoppingBag,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const Icono = c.icon;
        return (
          <Card
            key={c.label}
            className="shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-xl"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {c.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.sub}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}
                >
                  <Icono className={`h-5 w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
