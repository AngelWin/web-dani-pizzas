"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Check, PlusCircle, X } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { ProductoPOS } from "@/lib/services/ventas";
import type {
  PizzaSaborConIngredientes,
  ProductoExtra,
} from "@/lib/services/productos";
import type { AcompananteOrden, ExtraOrden } from "@/hooks/use-carrito";

type VariantePOS = ProductoPOS["producto_variantes"][number];

type SaborSeleccionado = {
  sabor: PizzaSaborConIngredientes;
  exclusiones: string[]; // nombres de ingredientes excluidos
};

type Props = {
  producto: ProductoPOS | null;
  sabores: PizzaSaborConIngredientes[];
  extras: ProductoExtra[];
  open: boolean;
  onClose: () => void;
  onConfirmar: (data: {
    producto: ProductoPOS;
    variante: { id: string; nombre: string; precio: number };
    sabores: {
      sabor_id: string;
      sabor_nombre: string;
      exclusiones: string[];
    }[];
    extras: ExtraOrden[];
    acompanante?: AcompananteOrden;
  }) => void;
};

function calcularProporcion(total: number): string {
  if (total === 1) return "1/1";
  if (total === 2) return "1/2";
  return "1/3";
}

export function ConfiguradorPizzaDialog({
  producto,
  sabores,
  extras,
  open,
  onClose,
  onConfirmar,
}: Props) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [varianteSeleccionada, setVarianteSeleccionada] =
    useState<VariantePOS | null>(null);
  const [saboresSeleccionados, setSaboresSeleccionados] = useState<
    SaborSeleccionado[]
  >([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<
    ProductoExtra[]
  >([]);
  const [acompanante, setAcompanante] = useState<{
    variante: VariantePOS;
    sabor: PizzaSaborConIngredientes;
  } | null>(null);
  const [acompananteVariante, setAcompananteVariante] =
    useState<VariantePOS | null>(null);
  const [mostrandoSelectorAcompanante, setMostrandoSelectorAcompanante] =
    useState(false);

  if (!producto) return null;

  const variantes = producto.producto_variantes.filter((v) => v.disponible);
  const saboresDisponibles = sabores.filter((s) => s.disponible);
  const extrasDisponibles = extras.filter((e) => e.disponible);

  const tieneAcompanante =
    varianteSeleccionada?.categoria_medidas?.tiene_acompanante ?? false;
  const variantesAcompanante = producto.producto_variantes.filter(
    (v) => v.categoria_medidas?.es_acompanante,
  );
  const permiteCombinan =
    varianteSeleccionada?.categoria_medidas?.permite_combinacion ?? false;
  const maxSabores = permiteCombinan
    ? (varianteSeleccionada?.categoria_medidas?.max_sabores ?? 2)
    : 1;

  const precioExtras = extrasSeleccionados.reduce(
    (acc, e) => acc + e.precio,
    0,
  );
  const precioTotal = (varianteSeleccionada?.precio ?? 0) + precioExtras;

  const handleReset = () => {
    setPaso(1);
    setVarianteSeleccionada(null);
    setSaboresSeleccionados([]);
    setExtrasSeleccionados([]);
    setAcompanante(null);
    setAcompananteVariante(null);
    setMostrandoSelectorAcompanante(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ─── Paso 1: Elegir tamaño ────────────────────────────────────────────────
  const handleSelectVariante = (v: VariantePOS) => {
    setVarianteSeleccionada(v);
    setSaboresSeleccionados([]);
    setPaso(2);
  };

  // ─── Paso 2: Elegir sabor(es) ─────────────────────────────────────────────
  const toggleSabor = (sabor: PizzaSaborConIngredientes) => {
    setSaboresSeleccionados((prev) => {
      const existe = prev.find((s) => s.sabor.id === sabor.id);
      if (existe) {
        return prev.filter((s) => s.sabor.id !== sabor.id);
      }
      if (prev.length >= maxSabores) {
        // Si no permite combinación, reemplaza
        if (!permiteCombinan) return [{ sabor, exclusiones: [] }];
        // Si ya hay 3, no agrega más
        return prev;
      }
      return [...prev, { sabor, exclusiones: [] }];
    });
  };

  // ─── Paso 3: Exclusiones e extras ─────────────────────────────────────────
  const toggleExclusion = (saborId: string, ingrediente: string) => {
    setSaboresSeleccionados((prev) =>
      prev.map((s) => {
        if (s.sabor.id !== saborId) return s;
        const tieneExclusion = s.exclusiones.includes(ingrediente);
        return {
          ...s,
          exclusiones: tieneExclusion
            ? s.exclusiones.filter((e) => e !== ingrediente)
            : [...s.exclusiones, ingrediente],
        };
      }),
    );
  };

  const toggleExtra = (extra: ProductoExtra) => {
    setExtrasSeleccionados((prev) => {
      const existe = prev.find((e) => e.id === extra.id);
      return existe ? prev.filter((e) => e.id !== extra.id) : [...prev, extra];
    });
  };

  const handleConfirmar = () => {
    if (!varianteSeleccionada || saboresSeleccionados.length === 0) return;

    onConfirmar({
      producto,
      variante: {
        id: varianteSeleccionada.id,
        nombre: varianteSeleccionada.categoria_medidas?.nombre ?? "",
        precio: varianteSeleccionada.precio,
      },
      sabores: saboresSeleccionados.map((s) => ({
        sabor_id: s.sabor.id,
        sabor_nombre: s.sabor.nombre,
        exclusiones: s.exclusiones,
      })),
      extras: extrasSeleccionados.map((e) => ({
        extra_id: e.id,
        nombre: e.nombre,
        precio: e.precio,
      })),
      acompanante: acompanante
        ? {
            variante_id: acompanante.variante.id,
            variante_nombre:
              acompanante.variante.categoria_medidas?.nombre ?? "",
            sabor_id: acompanante.sabor.id,
            sabor_nombre: acompanante.sabor.nombre,
          }
        : undefined,
    });
    handleReset();
  };

  const proporcion = calcularProporcion(saboresSeleccionados.length);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {producto.nombre}
            {varianteSeleccionada && (
              <Badge variant="secondary">
                {varianteSeleccionada.categoria_medidas?.nombre}
              </Badge>
            )}
          </DialogTitle>
          {/* Indicador de pasos */}
          <div className="flex items-center gap-1 pt-1">
            {([1, 2, 3] as const).map((p) => (
              <div
                key={p}
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-colors",
                  paso >= p ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* ─── PASO 1: Tamaño ───────────────────────────────── */}
          {paso === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Elige el tamaño
              </p>
              <div className="grid grid-cols-2 gap-3">
                {variantes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariante(v)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl border p-4 h-20 transition-all",
                      "hover:border-primary hover:bg-primary/5 active:scale-95",
                    )}
                  >
                    <span className="font-semibold">
                      {v.categoria_medidas?.nombre}
                    </span>
                    <span className="text-primary font-bold">
                      {formatCurrency(v.precio)}
                    </span>
                    {v.categoria_medidas?.permite_combinacion && (
                      <span className="text-xs text-muted-foreground">
                        Combinable
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── PASO 2: Sabores ──────────────────────────────── */}
          {paso === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {permiteCombinan
                    ? `Elige hasta ${maxSabores} sabores`
                    : "Elige el sabor"}
                </p>
                {saboresSeleccionados.length > 0 && permiteCombinan && (
                  <Badge variant="outline">
                    {saboresSeleccionados.length}/{maxSabores} · {proporcion}{" "}
                    c/u
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {saboresDisponibles.map((s) => {
                  const seleccionado = saboresSeleccionados.some(
                    (sel) => sel.sabor.id === s.id,
                  );
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSabor(s)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-4 h-14 text-left transition-all",
                        "hover:border-primary hover:bg-primary/5 active:scale-95",
                        seleccionado &&
                          "border-primary bg-primary/10 font-semibold",
                      )}
                    >
                      {seleccionado && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="text-sm leading-tight">{s.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── PASO 3: Exclusiones + Extras ────────────────── */}
          {paso === 3 && (
            <div className="space-y-4">
              {/* Exclusiones por sabor */}
              {saboresSeleccionados.map((sel) => {
                const ingredientes = sel.sabor.sabor_ingredientes;
                if (ingredientes.length === 0) return null;
                return (
                  <div key={sel.sabor.id} className="space-y-2">
                    <p className="text-sm font-medium">
                      {sel.sabor.nombre} — excluir ingredientes
                    </p>
                    <div className="rounded-lg border divide-y">
                      {ingredientes.map((ing) => {
                        const excluido = sel.exclusiones.includes(ing.nombre);
                        return (
                          <div
                            key={ing.id}
                            className="flex items-center gap-3 px-3 py-2.5"
                          >
                            <Checkbox
                              id={`excl-${ing.id}`}
                              checked={!excluido}
                              onCheckedChange={() =>
                                toggleExclusion(sel.sabor.id, ing.nombre)
                              }
                            />
                            <Label
                              htmlFor={`excl-${ing.id}`}
                              className={cn(
                                "flex-1 cursor-pointer text-sm",
                                excluido &&
                                  "line-through text-muted-foreground",
                              )}
                            >
                              {ing.nombre}
                              {ing.es_principal && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (principal)
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Extras */}
              {extrasDisponibles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Extras (opcional)</p>
                  <div className="rounded-lg border divide-y">
                    {extrasDisponibles.map((ex) => {
                      const seleccionado = extrasSeleccionados.some(
                        (e) => e.id === ex.id,
                      );
                      return (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <Checkbox
                            id={`extra-${ex.id}`}
                            checked={seleccionado}
                            onCheckedChange={() => toggleExtra(ex)}
                          />
                          <Label
                            htmlFor={`extra-${ex.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {ex.nombre}
                          </Label>
                          <span className="text-sm font-medium text-primary">
                            +{formatCurrency(ex.precio)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acompañante */}
              {tieneAcompanante && variantesAcompanante.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    Acompañante
                    <span className="text-xs text-muted-foreground font-normal">
                      (sin costo)
                    </span>
                  </p>

                  {!acompanante ? (
                    <>
                      <button
                        onClick={() =>
                          setMostrandoSelectorAcompanante((v) => !v)
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 border-dashed p-3 w-full text-sm transition-colors",
                          mostrandoSelectorAcompanante
                            ? "border-primary text-primary"
                            : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Agregar acompañante
                      </button>
                      {mostrandoSelectorAcompanante && (
                        <div className="space-y-3">
                          {/* Paso A: elegir medida del acompañante */}
                          {!acompananteVariante && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Elige la medida del acompañante:
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {variantesAcompanante.map((v) => (
                                  <button
                                    key={v.id}
                                    onClick={() => setAcompananteVariante(v)}
                                    className="flex flex-col items-center gap-0.5 rounded-xl border p-3 text-sm hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                                  >
                                    <span className="font-medium">
                                      {v.categoria_medidas?.nombre}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      gratis
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          {/* Paso B: elegir sabor */}
                          {acompananteVariante && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Sabor del{" "}
                                {acompananteVariante.categoria_medidas?.nombre}:
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {saboresDisponibles.map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      setAcompanante({
                                        variante: acompananteVariante,
                                        sabor: s,
                                      });
                                      setMostrandoSelectorAcompanante(false);
                                      setAcompananteVariante(null);
                                    }}
                                    className="flex items-center gap-2 rounded-xl border p-3 text-sm text-left hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                                  >
                                    {s.nombre}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm flex-1">
                        {acompanante.variante.categoria_medidas?.nombre} —{" "}
                        {acompanante.sabor.nombre}
                      </span>
                      <button
                        onClick={() => {
                          setAcompanante(null);
                          setAcompananteVariante(null);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Si no hay nada configurable en paso 3 */}
              {saboresSeleccionados.every(
                (s) => s.sabor.sabor_ingredientes.length === 0,
              ) &&
                extrasDisponibles.length === 0 &&
                !tieneAcompanante && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay modificaciones disponibles para esta selección.
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Footer con precio y navegación */}
        <div className="pt-3 border-t space-y-3">
          {varianteSeleccionada && (
            <div className="flex justify-between items-center text-sm">
              <div className="text-muted-foreground space-y-0.5">
                {paso >= 2 && saboresSeleccionados.length > 0 && (
                  <p>
                    {saboresSeleccionados
                      .map((s) => s.sabor.nombre)
                      .join(" · ")}
                  </p>
                )}
                {extrasSeleccionados.length > 0 && (
                  <p className="text-xs">
                    Extras:{" "}
                    {extrasSeleccionados.map((e) => e.nombre).join(", ")}
                  </p>
                )}
              </div>
              <span className="text-primary font-bold text-lg">
                {formatCurrency(precioTotal)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            {paso > 1 && (
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setPaso((p) => (p - 1) as 1 | 2 | 3)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
            )}

            {paso === 1 && (
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={handleClose}
              >
                Cancelar
              </Button>
            )}

            {paso === 2 && (
              <Button
                className="h-12 flex-1"
                disabled={saboresSeleccionados.length === 0}
                onClick={() => setPaso(3)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {paso === 3 && (
              <Button
                className="h-12 flex-1"
                onClick={handleConfirmar}
                disabled={saboresSeleccionados.length === 0}
              >
                Agregar al carrito
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
