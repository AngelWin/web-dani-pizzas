"use client";

import { Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
    "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30 cursor-not-allowed opacity-70",
  reservada:
    "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
};

export function SelectorMesa({
  mesas,
  mesaSeleccionadaId,
  onSeleccionar,
}: Props) {
  if (mesas.length === 0) return null;

  return (
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
            onClick={() => {
              if (isOcupada) {
                toast.info("Esta mesa ya tiene una orden activa");
                return;
              }
              onSeleccionar(isSelected ? null : mesa);
            }}
          >
            {isSelected && (
              <div className="absolute top-1 right-1">
                <Check className="h-4 w-4 text-primary" />
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
  );
}
