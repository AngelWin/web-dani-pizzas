"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { RepartidorEntregas } from "@/lib/services/entregas";

type Props = {
  repartidores: RepartidorEntregas[];
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className:
      "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
  },
  en_camino: {
    label: "En camino",
    className:
      "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400",
  },
  entregado: {
    label: "Entregado",
    className:
      "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400",
  },
};

export function TablaEntregas({ repartidores }: Props) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  function toggleExpandir(id: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (repartidores.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <p className="text-muted-foreground">
          No hay entregas para el periodo seleccionado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repartidores.map((r) => {
        const isOpen = expandido.has(r.repartidor_id);
        return (
          <div
            key={r.repartidor_id}
            className="rounded-xl border border-border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            {/* Fila principal del repartidor */}
            <button
              type="button"
              onClick={() => toggleExpandir(r.repartidor_id)}
              className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {r.nombre}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {r.entregas_pendientes > 0 && (
                    <span>
                      {r.entregas_pendientes} pendiente
                      {r.entregas_pendientes !== 1 ? "s" : ""}
                    </span>
                  )}
                  {r.entregas_en_camino > 0 && (
                    <span>{r.entregas_en_camino} en camino</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {r.entregas_completadas}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Entregadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(r.total_a_pagar)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total
                  </p>
                </div>
              </div>
            </button>

            {/* Detalle expandido */}
            {isOpen && (
              <div className="border-t border-border bg-muted/30">
                <div className="divide-y divide-border">
                  {r.entregas.map((e) => {
                    const statusCfg = STATUS_CONFIG[e.delivery_status] ?? {
                      label: e.delivery_status,
                      className: "",
                    };
                    return (
                      <div
                        key={e.orden_id}
                        className="flex items-center gap-4 px-4 py-3 pl-16"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              #{String(e.numero_orden).padStart(4, "0")}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${statusCfg.className}`}
                            >
                              {statusCfg.label}
                            </Badge>
                          </div>
                          {e.delivery_address && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {e.delivery_address}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-sm">
                          {e.hora_entregado && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {e.hora_entregado}
                            </div>
                          )}
                          <span className="font-medium text-foreground w-20 text-right">
                            {formatCurrency(e.delivery_fee)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
