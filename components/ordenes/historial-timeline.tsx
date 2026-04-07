"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoOrden, HistorialConUsuario } from "@/lib/services/ordenes";

const ESTADO_COLOR: Record<EstadoOrden, string> = {
  borrador: "bg-gray-400",
  confirmada: "bg-blue-500",
  en_preparacion: "bg-amber-500",
  lista: "bg-green-500",
  entregada: "bg-emerald-600",
  cancelada: "bg-red-500",
};

const ESTADO_LABEL: Record<EstadoOrden, string> = {
  borrador: "Borrador",
  confirmada: "Confirmada",
  en_preparacion: "En preparación",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diffMinutos(desde: string, hasta: string): string {
  const ms = new Date(hasta).getTime() - new Date(desde).getTime();
  const minutos = Math.floor(ms / 60000);
  if (minutos < 1) return "< 1 min";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

function nombreUsuario(
  profile: { nombre: string; apellido_paterno: string } | null,
): string {
  if (!profile) return "Sistema";
  return `${profile.nombre} ${profile.apellido_paterno}`;
}

type Props = {
  historial: HistorialConUsuario[];
};

export function HistorialTimeline({ historial }: Props) {
  const [abierto, setAbierto] = useState(false);

  if (historial.length === 0) return null;

  const ordenado = [...historial].sort(
    (a, b) =>
      new Date(a.cambiado_at).getTime() - new Date(b.cambiado_at).getTime(),
  );

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full justify-between rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          Historial ({historial.length} evento
          {historial.length !== 1 ? "s" : ""})
        </span>
        {abierto ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </Button>

      {abierto && (
        <div className="mt-2 pl-1">
          {ordenado.map((entrada, idx) => {
            const esUltimo = idx === ordenado.length - 1;
            const anterior = idx > 0 ? ordenado[idx - 1] : null;
            const deltaTexto = anterior
              ? diffMinutos(anterior.cambiado_at, entrada.cambiado_at)
              : null;

            return (
              <div key={entrada.id} className="flex gap-3">
                {/* Línea + punto */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      ESTADO_COLOR[entrada.estado_hasta],
                    )}
                  />
                  {!esUltimo && <div className="w-px flex-1 bg-border" />}
                </div>

                {/* Contenido */}
                <div className={cn("pb-3 text-xs", esUltimo && "pb-1")}>
                  <p className="font-medium text-foreground">
                    {entrada.estado_desde === null
                      ? `Orden creada — ${ESTADO_LABEL[entrada.estado_hasta]}`
                      : `${ESTADO_LABEL[entrada.estado_desde]} → ${ESTADO_LABEL[entrada.estado_hasta]}`}
                  </p>
                  <p className="text-muted-foreground">
                    {nombreUsuario(entrada.cambiado_por_profile)} ·{" "}
                    {formatFechaHora(entrada.cambiado_at)}
                    {deltaTexto && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground/70">
                        (+{deltaTexto})
                      </span>
                    )}
                  </p>
                  {entrada.notas && (
                    <p className="mt-0.5 italic text-muted-foreground">
                      "{entrada.notas}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
