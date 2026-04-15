"use client";

import { CalendarClock } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { EstadoOrdenBadge } from "@/components/ordenes/estado-badge";
import type { OrdenProgramadaResumen } from "@/lib/services/ordenes";

function formatFechaEntrega(isoString: string): string {
  const fecha = new Date(isoString);
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const hora = fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const esHoy =
    fecha.toLocaleDateString("es-PE") === hoy.toLocaleDateString("es-PE");
  const esManana =
    fecha.toLocaleDateString("es-PE") === manana.toLocaleDateString("es-PE");

  if (esHoy) return `Hoy ${hora}`;
  if (esManana) return `Mañana ${hora}`;

  return fecha.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  pedidos: OrdenProgramadaResumen[];
  mostrarSucursal?: boolean;
};

export function PedidosProgramados({
  pedidos,
  mostrarSucursal = false,
}: Props) {
  const { formatCurrency } = useCurrency();

  if (pedidos.length === 0) return null;

  return (
    <div className="rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <CalendarClock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-sm">Pedidos programados próximos</h3>
        <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          {pedidos.length}
        </span>
      </div>

      <ul className="divide-y">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-primary">
                  #{pedido.numero_orden}
                </span>
                <EstadoOrdenBadge estado={pedido.estado} />
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {pedido.cliente
                  ? `${pedido.cliente.nombre}${pedido.cliente.apellido ? ` ${pedido.cliente.apellido}` : ""}`
                  : "Cliente no registrado"}
                {mostrarSucursal && pedido.sucursal && (
                  <span className="ml-1">· {pedido.sucursal.nombre}</span>
                )}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {formatFechaEntrega(pedido.entrega_programada_at)}
              </span>
              <span className="text-xs font-medium tabular-nums">
                {formatCurrency(pedido.total)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
