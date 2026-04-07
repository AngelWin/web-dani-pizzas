"use client";

import { useState, useTransition } from "react";
import { Bike, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { actualizarTarifasDeliveryAction } from "@/actions/configuracion";
import type { DeliveryFeesPorSucursal } from "@/lib/services/configuracion";

type Props = {
  tarifas: DeliveryFeesPorSucursal[];
};

type TarifaEditable = {
  sucursal_id: string;
  sucursal_nombre: string;
  propio_id: string;
  propio_monto: string;
  tercero_id: string;
  tercero_monto: string;
};

export function TarifasDeliveryForm({ tarifas }: Props) {
  const [valores, setValores] = useState<TarifaEditable[]>(
    tarifas.map((t) => ({
      sucursal_id: t.sucursal_id,
      sucursal_nombre: t.sucursal_nombre,
      propio_id: t.propio.id,
      propio_monto: String(t.propio.monto),
      tercero_id: t.tercero.id,
      tercero_monto: String(t.tercero.monto),
    })),
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(
    idx: number,
    campo: "propio_monto" | "tercero_monto",
    valor: string,
  ) {
    setValores((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [campo]: valor } : v)),
    );
  }

  function handleGuardar() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append(
        "tarifas",
        JSON.stringify(
          valores.map((v) => ({
            sucursal_id: v.sucursal_id,
            propio_id: v.propio_id,
            propio_monto: v.propio_monto,
            tercero_id: v.tercero_id,
            tercero_monto: v.tercero_monto,
          })),
        ),
      );
      const result = await actualizarTarifasDeliveryAction(fd);
      if (result.success) {
        toast.success("Tarifas actualizadas correctamente");
      } else {
        toast.error(result.error ?? "Error al guardar tarifas");
      }
    });
  }

  return (
    <div className="space-y-6">
      {valores.map((v, idx) => (
        <div
          key={v.sucursal_id}
          className="rounded-xl border border-border p-5 space-y-4"
        >
          <p className="font-semibold text-foreground">{v.sucursal_nombre}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Bike className="h-4 w-4 text-muted-foreground" />
                Delivery propio (S/.)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={v.propio_monto}
                onChange={(e) =>
                  handleChange(idx, "propio_monto", e.target.value)
                }
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                Delivery tercero (S/.)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={v.tercero_monto}
                onChange={(e) =>
                  handleChange(idx, "tercero_monto", e.target.value)
                }
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={handleGuardar}
          disabled={isPending}
          className="h-11 px-6"
        >
          {isPending ? "Guardando..." : "Guardar tarifas"}
        </Button>
      </div>
    </div>
  );
}
