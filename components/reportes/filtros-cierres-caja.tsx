"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/database";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

type Props = {
  sucursales: Sucursal[];
  esAdmin: boolean;
  fechaDesde: string;
  fechaHasta: string;
  hoy: string;
  sucursalParam: string | null;
  filtroDiff: string;
  totalSesiones: number;
};

export function FiltrosCierresCaja({
  sucursales,
  esAdmin,
  fechaDesde,
  fechaHasta,
  hoy,
  sucursalParam,
  filtroDiff,
  totalSesiones,
}: Props) {
  const router = useRouter();

  function buildUrl(overrides: Record<string, string | null>) {
    const merged: Record<string, string | null> = {
      desde: fechaDesde,
      hasta: fechaHasta,
      sucursal: sucursalParam,
      diferencia: filtroDiff,
      ...overrides,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "todas") p.set(k, v);
    }
    router.push(`/reportes/cierres?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Rango de fechas */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Desde
        </label>
        <input
          type="date"
          defaultValue={fechaDesde}
          max={fechaHasta}
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => buildUrl({ desde: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Hasta
        </label>
        <input
          type="date"
          defaultValue={fechaHasta}
          max={hoy}
          min={fechaDesde}
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => buildUrl({ hasta: e.target.value })}
        />
      </div>

      {/* Selector de sucursal (admin) */}
      {esAdmin && (
        <Select
          value={sucursalParam ?? "todas"}
          onValueChange={(v) =>
            buildUrl({ sucursal: v === "todas" ? null : v })
          }
        >
          <SelectTrigger className="h-9 w-48 rounded-xl">
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
      )}

      {/* Filtro diferencia */}
      <Select
        value={filtroDiff}
        onValueChange={(v) => buildUrl({ diferencia: v })}
      >
        <SelectTrigger className="h-9 w-44 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las sesiones</SelectItem>
          <SelectItem value="sin_diferencia">Sin diferencia</SelectItem>
          <SelectItem value="con_diferencia">Con diferencia</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground ml-auto">
        {totalSesiones} {totalSesiones === 1 ? "sesión" : "sesiones"}
      </span>
    </div>
  );
}
