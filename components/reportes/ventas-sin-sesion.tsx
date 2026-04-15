"use client";

import { AlertTriangle } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { ResumenVentasSinSesion } from "@/lib/services/caja-sesiones";

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  sin_metodo: "Sin método",
};

type Props = {
  data: ResumenVentasSinSesion;
};

export function VentasSinSesion({ data }: Props) {
  const { formatCurrency } = useCurrency();

  if (data.cantidad === 0) return null;

  const metodosOrdenados = Object.entries(data.por_metodo).sort(
    ([, a], [, b]) => b - a,
  );

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <h3 className="font-semibold text-amber-800 dark:text-amber-400">
          Ventas sin sesión de caja
        </h3>
      </div>

      <p className="text-xs text-amber-700 dark:text-amber-500">
        {data.cantidad}{" "}
        {data.cantidad === 1 ? "venta registrada" : "ventas registradas"} fuera
        de una sesión activa (caja no abierta al momento del cobro).
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total */}
        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-500">
            Total sin sesión
          </p>
          <p className="font-bold text-amber-900 dark:text-amber-300 tabular-nums">
            {formatCurrency(data.total_ventas)}
          </p>
        </div>

        {/* Por método */}
        {metodosOrdenados.map(([metodo, monto]) => (
          <div
            key={metodo}
            className="rounded-lg bg-white/60 dark:bg-white/5 border border-amber-200 dark:border-amber-800 px-3 py-2"
          >
            <p className="text-xs text-amber-700 dark:text-amber-500">
              {METODO_LABELS[metodo] ?? metodo}
            </p>
            <p className="font-semibold text-amber-900 dark:text-amber-300 tabular-nums">
              {formatCurrency(monto)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
