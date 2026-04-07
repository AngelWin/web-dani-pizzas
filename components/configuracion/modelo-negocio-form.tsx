"use client";

import { useState, useTransition } from "react";
import { ChefHat, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { actualizarModeloNegocioAction } from "@/actions/configuracion";
import type { ModeloNegocio } from "@/lib/services/configuracion";

const MODELOS = [
  {
    value: "simple" as ModeloNegocio,
    label: "Modo Simple",
    descripcion:
      "Ideal para negocios pequeños donde el mismo personal toma y entrega el pedido.",
    flujo: "Confirmada → En preparación → Entregada",
    icono: Zap,
  },
  {
    value: "cocina_independiente" as ModeloNegocio,
    label: "Cocina Independiente",
    descripcion:
      "La cocina marca cuando está lista la orden y caja procede al cobro.",
    flujo: "Confirmada → En preparación → Lista → Entregada",
    icono: ChefHat,
  },
];

type Props = {
  modeloActual: ModeloNegocio;
};

export function ModeloNegocioForm({ modeloActual }: Props) {
  const [seleccionado, setSeleccionado] = useState<ModeloNegocio>(modeloActual);
  const [isPending, startTransition] = useTransition();

  const hayCambios = seleccionado !== modeloActual;

  function handleGuardar() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("modelo_negocio", seleccionado);
      const result = await actualizarModeloNegocioAction(fd);
      if (result.success) {
        toast.success("Modelo de operación actualizado");
      } else {
        toast.error(result.error ?? "Error al guardar");
        setSeleccionado(modeloActual);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {MODELOS.map((m) => {
          const Icono = m.icono;
          const activo = seleccionado === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setSeleccionado(m.value)}
              className={cn(
                "relative flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all",
                "hover:border-primary/60 hover:shadow-md",
                activo
                  ? "border-primary bg-primary/5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  : "border-border bg-surface",
              )}
            >
              {activo && (
                <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-primary" />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  activo
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icono className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{m.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {m.descripcion}
                </p>
              </div>
              <div className="mt-1 rounded-md bg-muted px-3 py-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Flujo: <span className="text-foreground">{m.flujo}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        {hayCambios && (
          <p className="text-sm text-muted-foreground">
            Tienes cambios sin guardar
          </p>
        )}
        <Button
          onClick={handleGuardar}
          disabled={!hayCambios || isPending}
          className="h-11 px-6"
        >
          {isPending ? "Guardando..." : "Guardar modelo"}
        </Button>
      </div>
    </div>
  );
}
