"use client";

import { Store } from "lucide-react";
import { useSucursal } from "@/hooks/use-sucursal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SucursalSelector() {
  const { sucursales, selectedSucursalId, selectSucursal, isLoading } =
    useSucursal();

  if (isLoading || sucursales.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedSucursalId ?? ""} onValueChange={selectSucursal}>
        <SelectTrigger className="h-9 w-[200px] rounded-xl">
          <SelectValue placeholder="Seleccionar sucursal" />
        </SelectTrigger>
        <SelectContent>
          {sucursales.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
