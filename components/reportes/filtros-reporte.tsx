"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

type Sucursal = { id: string; nombre: string };

type Props = {
  sucursales: Sucursal[];
  esAdmin: boolean;
  sucursalIdFijo?: string | null;
};

const TIPOS_PEDIDO = [
  { value: "todos", label: "Todos los tipos" },
  { value: "local", label: "En Local" },
  { value: "para_llevar", label: "Recojo" },
  { value: "delivery", label: "Delivery" },
];

function getHoyLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function hace7DiasLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  now.setDate(now.getDate() - 6);
  return now.toISOString().split("T")[0];
}

export function FiltrosReporte({ sucursales, esAdmin, sucursalIdFijo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hoy = getHoyLima();
  const hace7 = hace7DiasLima();

  const [desde, setDesde] = useState(searchParams.get("desde") ?? hace7);
  const [hasta, setHasta] = useState(searchParams.get("hasta") ?? hoy);
  const [sucursal, setSucursal] = useState(
    searchParams.get("sucursal") ?? "todas",
  );
  const [tipo, setTipo] = useState(searchParams.get("tipo") ?? "todos");

  function handleBuscar() {
    const params = new URLSearchParams();
    params.set("desde", desde);
    params.set("hasta", hasta);
    if (esAdmin && sucursal !== "todas") params.set("sucursal", sucursal);
    if (tipo !== "todos") params.set("tipo", tipo);
    router.push(`/reportes?${params.toString()}`);
  }

  function handleLimpiar() {
    setDesde(hace7);
    setHasta(hoy);
    setSucursal("todas");
    setTipo("todos");
    router.push("/reportes");
  }

  const hayFiltros =
    desde !== hace7 ||
    hasta !== hoy ||
    (esAdmin && sucursal !== "todas") ||
    tipo !== "todos";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fecha desde */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Fecha hasta */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={hoy}
            onChange={(e) => setHasta(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Sucursal (solo admin) */}
        {esAdmin ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sucursal</Label>
            <Select value={sucursal} onValueChange={setSucursal}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sucursal</Label>
            <div className="flex h-10 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
              {sucursales.find((s) => s.id === sucursalIdFijo)?.nombre ??
                "Mi sucursal"}
            </div>
          </div>
        )}

        {/* Tipo de pedido */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Tipo de pedido
          </Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PEDIDO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-xs"
            onClick={handleLimpiar}
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
        <Button
          size="sm"
          className="h-9 gap-1.5 rounded-xl px-5 text-xs"
          onClick={handleBuscar}
        >
          <Search className="h-3.5 w-3.5" />
          Buscar
        </Button>
      </div>
    </div>
  );
}
