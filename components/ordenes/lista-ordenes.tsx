"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarDays, ClipboardList } from "lucide-react";
import { TarjetaOrden } from "./tarjeta-orden";
import type { OrdenConItems, FiltroEstadoOrden } from "@/lib/services/ordenes";
import type { ModeloNegocio } from "@/lib/services/configuracion";

type EstadoTab = FiltroEstadoOrden;

function getTabs(
  modeloNegocio: ModeloNegocio,
): { value: EstadoTab; label: string }[] {
  const base: { value: EstadoTab; label: string }[] = [
    { value: "activas", label: "Activas" },
    { value: "todas", label: "Todas" },
    { value: "confirmada", label: "Confirmadas" },
    { value: "en_preparacion", label: "En preparación" },
  ];

  // Solo en Modo Cocina Independiente aparece el estado "lista"
  if (modeloNegocio === "cocina_independiente") {
    base.push({ value: "lista", label: "Listas" });
  }

  base.push(
    { value: "entregada", label: "Entregadas" },
    { value: "cancelada", label: "Canceladas" },
  );

  return base;
}

function filtrarOrdenes(
  ordenes: OrdenConItems[],
  filtro: EstadoTab,
): OrdenConItems[] {
  if (filtro === "todas") return ordenes;
  if (filtro === "activas")
    return ordenes.filter(
      (o) => o.estado !== "entregada" && o.estado !== "cancelada",
    );
  return ordenes.filter((o) => o.estado === filtro);
}

function formatearFechaLegible(fecha: string): string {
  // fecha: YYYY-MM-DD
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const date = new Date(anio, mes - 1, dia);
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type Props = {
  ordenes: OrdenConItems[];
  rol: string | null;
  modeloNegocio: ModeloNegocio;
  fechaFiltro: string; // YYYY-MM-DD
  hoy: string; // YYYY-MM-DD
  minFecha: string | null; // YYYY-MM-DD (7 días atrás) — null = sin restricción (admin)
};

export function ListaOrdenes({
  ordenes,
  rol,
  modeloNegocio,
  fechaFiltro,
  hoy,
  minFecha,
}: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<EstadoTab>("activas");

  const tabs = getTabs(modeloNegocio);
  const ordenesFiltradas = filtrarOrdenes(ordenes, filtro);

  function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nueva = e.target.value;
    if (nueva <= hoy && (minFecha === null || nueva >= minFecha)) {
      router.push(`/ordenes?fecha=${nueva}`);
    }
  }

  const esHoy = fechaFiltro === hoy;

  return (
    <div className="space-y-4">
      {/* Selector de fecha */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">
            {esHoy ? "Hoy" : formatearFechaLegible(fechaFiltro)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fechaFiltro}
            {...(minFecha ? { min: minFecha } : {})}
            max={hoy}
            onChange={handleFechaChange}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {!esHoy && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-xl text-xs"
              onClick={() => router.push("/ordenes")}
            >
              Hoy
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count =
            tab.value === "activas"
              ? ordenes.filter(
                  (o) => o.estado !== "entregada" && o.estado !== "cancelada",
                ).length
              : tab.value === "todas"
                ? ordenes.length
                : ordenes.filter((o) => o.estado === tab.value).length;

          return (
            <Button
              key={tab.value}
              size="sm"
              variant={filtro === tab.value ? "default" : "outline"}
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setFiltro(tab.value)}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={
                    filtro === tab.value
                      ? "ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]"
                      : "ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]"
                  }
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Grid de tarjetas */}
      {ordenesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <ClipboardList className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">No hay órdenes en esta categoría</p>
          {!esHoy && (
            <p className="mt-1 text-xs opacity-70">
              Mostrando órdenes del {formatearFechaLegible(fechaFiltro)}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordenesFiltradas.map((orden) => (
            <TarjetaOrden
              key={orden.id}
              orden={orden}
              rol={rol}
              modeloNegocio={modeloNegocio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
