"use client";

import { Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mesa } from "@/lib/services/mesas";

type Props = {
  mesas: Mesa[];
  mesaSeleccionadaId: string | null;
  onSeleccionar: (mesa: Mesa | null) => void;
};

const ESTADO_COLORES: Record<string, string> = {
  libre:
    "border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50",
  ocupada:
    "border-warning/50 bg-warning/5 hover:bg-warning/10 dark:border-warning/40 dark:bg-warning/10 dark:hover:bg-warning/15",
  reservada:
    "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
};

export function SelectorMesa({
  mesas,
  mesaSeleccionadaId,
  onSeleccionar,
}: Props) {
  if (mesas.length === 0) return null;

  const mesaSeleccionada = mesas.find((m) => m.id === mesaSeleccionadaId);
  const seleccionadaOcupada = mesaSeleccionada?.estado === "ocupada";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {mesas.map((mesa) => {
          const isSelected = mesaSeleccionadaId === mesa.id;
          const isOcupada = mesa.estado === "ocupada";

          return (
            <button
              key={mesa.id}
              type="button"
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 p-3 min-h-[4.5rem] transition-all",
                ESTADO_COLORES[mesa.estado] ?? ESTADO_COLORES.libre,
                isSelected &&
                  "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10",
              )}
              onClick={() => onSeleccionar(isSelected ? null : mesa)}
            >
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              {isOcupada && !isSelected && (
                <div className="absolute top-1 left-1">
                  <span className="text-[9px] font-semibold text-warning leading-none">
                    ●
                  </span>
                </div>
              )}
              <span className="text-xl font-bold leading-none">
                {mesa.numero}
              </span>
              <div className="flex items-center gap-0.5 mt-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {mesa.sillas}
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso cuando se selecciona una mesa ocupada */}
      {seleccionadaOcupada && (
        <p className="text-xs text-warning flex items-start gap-1.5 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>
            Esta mesa ya tiene órdenes activas. La nueva orden se añadirá a su
            cuenta.
          </span>
        </p>
      )}
    </div>
  );
}
