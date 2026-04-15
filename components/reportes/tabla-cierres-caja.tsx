"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { Badge } from "@/components/ui/badge";
import type {
  CajaSesionConRelaciones,
  ResumenSesion,
} from "@/lib/services/caja-sesiones";

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  sin_metodo: "Sin método",
};

function formatFecha(isoString: string) {
  return new Date(isoString).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duracionTurno(inicio: string, fin: string | null): string {
  if (!fin) return "Abierta";
  const diff = new Date(fin).getTime() - new Date(inicio).getTime();
  const horas = Math.floor(diff / 3_600_000);
  const minutos = Math.floor((diff % 3_600_000) / 60_000);
  return `${horas}h ${minutos}m`;
}

function nombreCompleto(
  profile: { nombre: string; apellido_paterno: string } | null,
): string {
  if (!profile) return "—";
  return `${profile.nombre} ${profile.apellido_paterno}`;
}

type FilaSesionProps = {
  sesion: CajaSesionConRelaciones;
  mostrarSucursal: boolean;
  onVerDetalle: (id: string) => void;
};

function FilaSesion({
  sesion,
  mostrarSucursal,
  onVerDetalle,
}: FilaSesionProps) {
  const { formatCurrency } = useCurrency();
  const estaAbierta = sesion.estado === "abierta";

  const diferencia = sesion.diferencia ?? null;
  const cuadra = diferencia === 0;
  const sobrante = diferencia !== null && diferencia > 0;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={() => onVerDetalle(sesion.id)}
    >
      {/* Estado */}
      <div className="shrink-0">
        {estaAbierta ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Vault className="h-3 w-3" />
            Abierta
          </span>
        ) : (
          <Badge variant="secondary" className="text-[11px] font-medium">
            Cerrada
          </Badge>
        )}
      </div>

      {/* Sucursal */}
      {mostrarSucursal && (
        <span className="text-xs text-muted-foreground shrink-0 min-w-[120px]">
          {sesion.sucursales?.nombre ?? "—"}
        </span>
      )}

      {/* Fechas */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{formatFecha(sesion.abierta_at)}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {duracionTurno(sesion.abierta_at, sesion.cerrada_at ?? null)}
          {sesion.cerrada_at && (
            <span className="ml-1">→ {formatFecha(sesion.cerrada_at)}</span>
          )}
        </p>
      </div>

      {/* Quién */}
      <div className="text-xs text-muted-foreground shrink-0 hidden lg:block min-w-[140px]">
        <p>Abrió: {nombreCompleto(sesion.abierta_por_profile)}</p>
        {sesion.cerrada_por_profile && (
          <p>Cerró: {nombreCompleto(sesion.cerrada_por_profile)}</p>
        )}
      </div>

      {/* Montos */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Inicial</p>
          <p className="text-sm font-medium tabular-nums">
            {formatCurrency(sesion.monto_inicial)}
          </p>
        </div>

        {!estaAbierta && sesion.monto_contado_efectivo !== null && (
          <>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Contado</p>
              <p className="text-sm font-medium tabular-nums">
                {formatCurrency(sesion.monto_contado_efectivo)}
              </p>
            </div>

            {diferencia !== null && (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums",
                  cuadra
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : sobrante
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                )}
              >
                {cuadra ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {cuadra
                  ? "Cuadra"
                  : sobrante
                    ? `+${formatCurrency(diferencia)}`
                    : `−${formatCurrency(Math.abs(diferencia))}`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type Props = {
  sesiones: CajaSesionConRelaciones[];
  resumenPorSesion: Record<string, ResumenSesion>;
  mostrarSucursal: boolean;
};

export function TablaCierresCaja({
  sesiones,
  resumenPorSesion,
  mostrarSucursal,
}: Props) {
  const { formatCurrency } = useCurrency();
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  function toggleDetalle(id: string) {
    setSesionExpandida((prev) => (prev === id ? null : id));
  }

  if (sesiones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Vault className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">No hay sesiones de caja en este período</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border divide-y overflow-hidden">
      {sesiones.map((sesion) => {
        const expandida = sesionExpandida === sesion.id;
        const resumen = resumenPorSesion[sesion.id];

        return (
          <div key={sesion.id}>
            {/* Fila principal */}
            <div
              className="flex items-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleDetalle(sesion.id)}
            >
              <div className="flex-1">
                <FilaSesion
                  sesion={sesion}
                  mostrarSucursal={mostrarSucursal}
                  onVerDetalle={() => {}}
                />
              </div>
              <div className="pr-4 shrink-0 text-muted-foreground">
                {expandida ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Panel de detalle expandible */}
            {expandida && (
              <div className="bg-muted/20 border-t px-4 py-4 space-y-4">
                {resumen ? (
                  <>
                    {/* Totales por método */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Ventas por método de pago
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {Object.entries(resumen.por_metodo).map(
                          ([metodo, monto]) => (
                            <div
                              key={metodo}
                              className="rounded-lg border bg-background px-3 py-2 text-center"
                            >
                              <p className="text-xs text-muted-foreground">
                                {METODO_LABELS[metodo] ?? metodo}
                              </p>
                              <p className="font-semibold tabular-nums text-sm">
                                {formatCurrency(monto)}
                              </p>
                            </div>
                          ),
                        )}
                        <div className="rounded-lg border bg-primary/5 px-3 py-2 text-center">
                          <p className="text-xs text-muted-foreground">
                            Total ventas
                          </p>
                          <p className="font-bold tabular-nums text-sm text-primary">
                            {formatCurrency(resumen.total_ventas)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cuadre de efectivo */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Cuadre de efectivo
                      </p>
                      <div className="grid grid-cols-3 gap-2 max-w-sm">
                        <div className="rounded-lg border bg-background px-3 py-2 text-center">
                          <p className="text-xs text-muted-foreground">
                            Inicial
                          </p>
                          <p className="font-semibold tabular-nums text-sm">
                            {formatCurrency(sesion.monto_inicial)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background px-3 py-2 text-center">
                          <p className="text-xs text-muted-foreground">
                            Esperado
                          </p>
                          <p className="font-semibold tabular-nums text-sm">
                            {formatCurrency(resumen.monto_esperado_efectivo)}
                          </p>
                        </div>
                        {sesion.monto_contado_efectivo !== null && (
                          <div className="rounded-lg border bg-background px-3 py-2 text-center">
                            <p className="text-xs text-muted-foreground">
                              Contado
                            </p>
                            <p className="font-semibold tabular-nums text-sm">
                              {formatCurrency(sesion.monto_contado_efectivo)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    {(sesion.notas_apertura || sesion.notas_cierre) && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Notas
                        </p>
                        {sesion.notas_apertura && (
                          <p className="text-xs">
                            <span className="font-medium">Apertura:</span>{" "}
                            {sesion.notas_apertura}
                          </p>
                        )}
                        {sesion.notas_cierre && (
                          <p className="text-xs">
                            <span className="font-medium">Cierre:</span>{" "}
                            {sesion.notas_cierre}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cargando detalle...
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
