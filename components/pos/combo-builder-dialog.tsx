"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronRight, Package, ShoppingCart, Tag } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import type { ProductoPOS } from "@/lib/services/ventas";
import type { ItemPromoCarrito } from "@/hooks/use-carrito";
import type {
  SaborOrden,
  ExtraOrden,
  AcompananteOrden,
} from "@/hooks/use-carrito";

type ProductoConfigCombo = {
  producto_id: string;
  producto_nombre: string;
  variante_id: string | null;
  variante_nombre: string | null;
  medida_id: string | null;
  precio_unitario: number;
  configurado: boolean;
  sabores?: SaborOrden[];
  extras?: ExtraOrden[];
  acompanante?: AcompananteOrden;
};

type Props = {
  open: boolean;
  onClose: () => void;
  promo: PromocionActivaPOS;
  productos: ProductoPOS[];
  onAgregarAlCarrito: (item: ItemPromoCarrito) => void;
};

export function ComboBuilderDialog({
  open,
  onClose,
  promo,
  productos,
  onAgregarAlCarrito,
}: Props) {
  const { formatCurrency } = useCurrency();
  const [pasoActual, setPasoActual] = useState(0);
  const [productosConfig, setProductosConfig] = useState<ProductoConfigCombo[]>(
    [],
  );

  // Inicializar productos del combo al abrir
  const productosDelCombo = promo.productos_ids
    .map((pid) => productos.find((p) => p.id === pid))
    .filter(Boolean) as ProductoPOS[];

  // Para promos fijas: auto-configurar con la primera variante
  function inicializarFijo() {
    const items: ProductoConfigCombo[] = productosDelCombo.map((p) => {
      const variante = p.producto_variantes[0] ?? null;
      return {
        producto_id: p.id,
        producto_nombre: p.nombre,
        variante_id: variante?.id ?? null,
        variante_nombre: variante?.categoria_medidas?.nombre ?? null,
        medida_id: variante?.medida_id ?? null,
        precio_unitario: variante?.precio ?? p.precio ?? 0,
        configurado: true,
      };
    });
    return items;
  }

  // Seleccionar variante para un producto
  function seleccionarVariante(
    productoIdx: number,
    variante: ProductoPOS["producto_variantes"][number],
  ) {
    setProductosConfig((prev) => {
      const nuevo = [...prev];
      const prod = productosDelCombo[productoIdx];
      nuevo[productoIdx] = {
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        variante_id: variante.id,
        variante_nombre: variante.categoria_medidas?.nombre ?? null,
        medida_id: variante.medida_id,
        precio_unitario: variante.precio,
        configurado: true,
      };
      return nuevo;
    });
  }

  function handleAbrir() {
    if (!promo.permite_modificaciones) {
      // Fijo: configurar todo automáticamente
      setProductosConfig(inicializarFijo());
      setPasoActual(-1); // -1 = preview listo
    } else {
      // Modificable: iniciar flujo paso a paso
      setProductosConfig(
        productosDelCombo.map((p) => ({
          producto_id: p.id,
          producto_nombre: p.nombre,
          variante_id: null,
          variante_nombre: null,
          medida_id: null,
          precio_unitario: 0,
          configurado: false,
        })),
      );
      setPasoActual(0);
    }
  }

  function handleAgregar() {
    const precioOriginal = productosConfig.reduce(
      (acc, p) => acc + p.precio_unitario,
      0,
    );
    const precioPromo = promo.precio_combo ?? precioOriginal;
    const descuento = Math.max(0, precioOriginal - precioPromo);

    const item: ItemPromoCarrito = {
      key: `promo::${promo.id}::${Date.now()}`,
      tipo: "promo",
      promocion_id: promo.id,
      promo_nombre: promo.nombre,
      promo_tipo: promo.tipo_promocion,
      precio_promo: precioPromo,
      precio_original: precioOriginal,
      descuento,
      items: productosConfig.map((p) => ({
        producto_id: p.producto_id,
        producto_nombre: p.producto_nombre,
        variante_id: p.variante_id,
        variante_nombre: p.variante_nombre,
        medida_id: p.medida_id,
        precio_unitario: p.precio_unitario,
        sabores: p.sabores,
        extras: p.extras,
        acompanante: p.acompanante,
      })),
    };

    onAgregarAlCarrito(item);
    onClose();
  }

  const todosConfigurados = productosConfig.every((p) => p.configurado);
  const productoActual = productosDelCombo[pasoActual] ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else handleAbrir();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {promo.nombre}
          </DialogTitle>
        </DialogHeader>

        {/* Promo fija o preview final */}
        {(pasoActual === -1 || todosConfigurados) && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {promo.permite_modificaciones
                ? "Revisa tu combo antes de agregar"
                : "Combo con productos predefinidos"}
            </p>

            {/* Lista de productos configurados */}
            <div className="space-y-2">
              {productosConfig.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {item.producto_nombre}
                      </p>
                      {item.variante_nombre && (
                        <p className="text-xs text-muted-foreground">
                          {item.variante_nombre}
                        </p>
                      )}
                      {item.sabores && item.sabores.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.sabores.map((s) => s.sabor_nombre).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(item.precio_unitario)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Resumen de precios */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Precio normal</span>
                <span className="line-through">
                  {formatCurrency(
                    productosConfig.reduce(
                      (acc, p) => acc + p.precio_unitario,
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Precio combo</span>
                <span className="text-primary">
                  {formatCurrency(promo.precio_combo ?? 0)}
                </span>
              </div>
            </div>

            <Button className="w-full h-12 gap-2" onClick={handleAgregar}>
              <ShoppingCart className="h-4 w-4" />
              Agregar combo al carrito
            </Button>
          </div>
        )}

        {/* Flujo paso a paso (solo si permite modificaciones y no está completo) */}
        {promo.permite_modificaciones &&
          pasoActual >= 0 &&
          !todosConfigurados &&
          productoActual && (
            <div className="space-y-4">
              {/* Indicador de pasos */}
              <div className="flex items-center gap-2">
                {productosDelCombo.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full ${
                      idx < pasoActual
                        ? "bg-green-500"
                        : idx === pasoActual
                          ? "bg-primary"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Paso {pasoActual + 1} de {productosDelCombo.length} — Elige{" "}
                <strong>{productoActual.nombre}</strong>
              </p>

              {/* Selector de variante/medida */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Selecciona tamaño:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {productoActual.producto_variantes
                    .filter((v) => v.precio > 0)
                    .map((v) => (
                      <Button
                        key={v.id}
                        variant="outline"
                        className="h-14 flex-col gap-0.5"
                        onClick={() => {
                          seleccionarVariante(pasoActual, v);
                          // Avanzar al siguiente paso
                          if (pasoActual < productosDelCombo.length - 1) {
                            setPasoActual(pasoActual + 1);
                          }
                        }}
                      >
                        <span className="font-medium">
                          {v.categoria_medidas?.nombre ?? "Medida"}
                        </span>
                        <span className="text-xs text-primary">
                          {formatCurrency(v.precio)}
                        </span>
                      </Button>
                    ))}
                </div>

                {/* Si el producto no tiene variantes, auto-configurar */}
                {productoActual.producto_variantes.filter((v) => v.precio > 0)
                  .length === 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => {
                      setProductosConfig((prev) => {
                        const nuevo = [...prev];
                        nuevo[pasoActual] = {
                          producto_id: productoActual.id,
                          producto_nombre: productoActual.nombre,
                          variante_id: null,
                          variante_nombre: null,
                          medida_id: null,
                          precio_unitario: productoActual.precio ?? 0,
                          configurado: true,
                        };
                        return nuevo;
                      });
                      if (pasoActual < productosDelCombo.length - 1) {
                        setPasoActual(pasoActual + 1);
                      }
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {productoActual.nombre} —{" "}
                    {formatCurrency(productoActual.precio ?? 0)}
                  </Button>
                )}
              </div>
            </div>
          )}

        <DialogFooter>
          <Button variant="outline" className="h-10" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
