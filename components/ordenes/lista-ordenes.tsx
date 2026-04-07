"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
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

  // En Modo Cocina Independiente aparece el estado "lista"
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

type Props = {
  ordenes: OrdenConItems[];
  rol: string | null;
  modeloNegocio: ModeloNegocio;
};

export function ListaOrdenes({ ordenes, rol, modeloNegocio }: Props) {
  const [filtro, setFiltro] = useState<EstadoTab>("activas");

  const tabs = getTabs(modeloNegocio);
  const ordenesFiltradas = filtrarOrdenes(ordenes, filtro);

  return (
    <div className="space-y-4">
      {/* Tabs de filtro */}
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
