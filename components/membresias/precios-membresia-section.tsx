"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { updateNivelMembresiaAction } from "@/actions/membresias";
import { useCurrency } from "@/hooks/use-currency";
import type { NivelMembresia } from "@/lib/services/membresias";

type Props = {
  niveles: NivelMembresia[];
};

export function PreciosMembresiaSection({ niveles: inicial }: Props) {
  const { formatCurrency } = useCurrency();
  const [niveles, setNiveles] = useState(inicial);
  const [editando, setEditando] = useState<
    Record<string, Partial<NivelMembresia>>
  >({});
  const [isPending, startTransition] = useTransition();

  function handleChange(nivelId: string, campo: string, valor: string) {
    setEditando((prev) => ({
      ...prev,
      [nivelId]: {
        ...prev[nivelId],
        [campo]:
          valor === ""
            ? null
            : campo.startsWith("fecha")
              ? valor
              : Number(valor),
      },
    }));
  }

  function handleGuardar(nivel: NivelMembresia) {
    const cambios = editando[nivel.id];
    if (!cambios) return;

    startTransition(async () => {
      const result = await updateNivelMembresiaAction(nivel.id, {
        nombre: nivel.nombre,
        beneficios: nivel.beneficios,
        descuento_porcentaje: nivel.descuento_porcentaje ?? 0,
        puntos_requeridos: nivel.puntos_requeridos,
        orden: nivel.orden,
        precio_mensual: cambios.precio_mensual ?? nivel.precio_mensual,
        precio_trimestral: cambios.precio_trimestral ?? nivel.precio_trimestral,
        precio_anual: cambios.precio_anual ?? nivel.precio_anual,
        precio_lanzamiento:
          cambios.precio_lanzamiento ?? nivel.precio_lanzamiento,
        fecha_inicio_lanzamiento:
          (cambios.fecha_inicio_lanzamiento as string | undefined) ??
          nivel.fecha_inicio_lanzamiento,
        fecha_fin_lanzamiento:
          (cambios.fecha_fin_lanzamiento as string | undefined) ??
          nivel.fecha_fin_lanzamiento,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Precios de ${nivel.nombre} actualizados`);
      setEditando((prev) => {
        const nuevo = { ...prev };
        delete nuevo[nivel.id];
        return nuevo;
      });
    });
  }

  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Configuración de precios</h3>
        <p className="text-sm text-muted-foreground">
          Precios de membresía por nivel y ofertas de lanzamiento
        </p>
      </div>

      <div className="space-y-4">
        {niveles.map((nivel) => {
          const cambios = editando[nivel.id] ?? {};
          const tieneOfertaVigente =
            nivel.precio_lanzamiento &&
            nivel.fecha_inicio_lanzamiento &&
            nivel.fecha_fin_lanzamiento &&
            hoy >= nivel.fecha_inicio_lanzamiento &&
            hoy <= nivel.fecha_fin_lanzamiento;

          return (
            <div
              key={nivel.id}
              className="rounded-xl border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{nivel.nombre}</h4>
                  {nivel.descuento_porcentaje && (
                    <Badge variant="secondary" className="text-[10px]">
                      {nivel.descuento_porcentaje}% desc.
                    </Badge>
                  )}
                  {tieneOfertaVigente && (
                    <Badge className="bg-amber-500 text-white text-[10px]">
                      Oferta activa
                    </Badge>
                  )}
                </div>
                {editando[nivel.id] && (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleGuardar(nivel)}
                    disabled={isPending}
                  >
                    <Save className="h-3 w-3" />
                    Guardar
                  </Button>
                )}
              </div>

              {/* Precios por plan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Mensual
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="S/."
                    className="h-9"
                    defaultValue={nivel.precio_mensual ?? ""}
                    onChange={(e) =>
                      handleChange(nivel.id, "precio_mensual", e.target.value)
                    }
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Trimestral
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="S/."
                    className="h-9"
                    defaultValue={nivel.precio_trimestral ?? ""}
                    onChange={(e) =>
                      handleChange(
                        nivel.id,
                        "precio_trimestral",
                        e.target.value,
                      )
                    }
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Anual</label>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="S/."
                    className="h-9"
                    defaultValue={nivel.precio_anual ?? ""}
                    onChange={(e) =>
                      handleChange(nivel.id, "precio_anual", e.target.value)
                    }
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              {/* Precio de lanzamiento */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">
                  Precio de lanzamiento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Precio S/."
                    className="h-9"
                    defaultValue={nivel.precio_lanzamiento ?? ""}
                    onChange={(e) =>
                      handleChange(
                        nivel.id,
                        "precio_lanzamiento",
                        e.target.value,
                      )
                    }
                    onFocus={(e) => e.target.select()}
                  />
                  <Input
                    type="date"
                    className="h-9"
                    defaultValue={nivel.fecha_inicio_lanzamiento ?? ""}
                    onChange={(e) =>
                      handleChange(
                        nivel.id,
                        "fecha_inicio_lanzamiento",
                        e.target.value,
                      )
                    }
                  />
                  <Input
                    type="date"
                    className="h-9"
                    defaultValue={nivel.fecha_fin_lanzamiento ?? ""}
                    onChange={(e) =>
                      handleChange(
                        nivel.id,
                        "fecha_fin_lanzamiento",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              {/* Precios actuales */}
              {(nivel.precio_mensual ||
                nivel.precio_trimestral ||
                nivel.precio_anual) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {nivel.precio_mensual && (
                    <span>Mensual: {formatCurrency(nivel.precio_mensual)}</span>
                  )}
                  {nivel.precio_trimestral && (
                    <span>
                      Trimestral: {formatCurrency(nivel.precio_trimestral)}
                    </span>
                  )}
                  {nivel.precio_anual && (
                    <span>Anual: {formatCurrency(nivel.precio_anual)}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
