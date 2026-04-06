"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/database";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

type FiltroSucursalDashboardProps = {
  sucursales: Sucursal[];
  sucursalSeleccionadaId: string | null;
};

export function FiltroSucursalDashboard({
  sucursales,
  sucursalSeleccionadaId,
}: FiltroSucursalDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "todas") {
        params.delete("sucursal");
      } else {
        params.set("sucursal", value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <Select
      value={sucursalSeleccionadaId ?? "todas"}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[200px] rounded-xl">
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
  );
}
