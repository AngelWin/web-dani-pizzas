"use client";

import { ShoppingBag, TrendingUp, ReceiptText, Bike } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useCurrency } from "@/hooks/use-currency";
import type { StatsHoy } from "@/lib/services/dashboard";

type ResumenVentasProps = {
  stats: StatsHoy;
};

export function ResumenVentas({ stats }: ResumenVentasProps) {
  const { formatCurrency } = useCurrency();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Ventas del día"
        value={formatCurrency(stats.total_ventas)}
        subtitle={
          stats.num_pedidos === 0
            ? "Sin pedidos hoy"
            : `${stats.num_pedidos} pedido${stats.num_pedidos !== 1 ? "s" : ""}`
        }
        icon={TrendingUp}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Total de pedidos"
        value={String(stats.num_pedidos)}
        subtitle="pedidos registrados hoy"
        icon={ReceiptText}
        iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      />
      <StatsCard
        title="Promedio por pedido"
        value={formatCurrency(stats.promedio_venta)}
        subtitle="ticket promedio"
        icon={ShoppingBag}
        iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      />
      <StatsCard
        title="Deliveries"
        value={String(stats.num_delivery)}
        subtitle={
          stats.num_delivery > 0
            ? `${formatCurrency(stats.total_delivery)} en tarifas`
            : "Sin deliveries hoy"
        }
        icon={Bike}
        iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      />
    </div>
  );
}
