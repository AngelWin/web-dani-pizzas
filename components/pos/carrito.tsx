"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { detectarPromoParaVariante } from "@/lib/promociones-utils";
import type { useCarrito } from "@/hooks/use-carrito";
import type { PromocionActivaPOS } from "@/lib/services/promociones";

type Props = {
  carrito: ReturnType<typeof useCarrito>;
  deliveryFee?: number;
  onConfirmar: () => void;
  promociones?: PromocionActivaPOS[];
};

export function Carrito({
  carrito,
  deliveryFee = 0,
  onConfirmar,
  promociones = [],
}: Props) {
  const { formatCurrency } = useCurrency();
  const total = carrito.subtotal + deliveryFee;

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">Carrito</span>
        {carrito.totalItems > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {carrito.totalItems} {carrito.totalItems === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {carrito.isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
            <p>Sin productos</p>
          </div>
        ) : (
          carrito.items.map((item) => {
            const promoItem = detectarPromoParaVariante(
              promociones,
              item.producto_id,
              item.medida_id,
              item.precio_base,
            );

            return (
              <div key={item.key} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium leading-tight">
                        {item.producto_nombre}
                      </p>
                      {promoItem && (
                        <Badge className="bg-red-500 text-white text-[8px] px-1 py-0 font-bold">
                          {promoItem.etiqueta}
                        </Badge>
                      )}
                    </div>
                    {item.variante_nombre && !item.sabores && (
                      <p className="text-xs text-muted-foreground">
                        {item.variante_nombre}
                      </p>
                    )}
                    {/* Sabores de pizza */}
                    {item.sabores && item.sabores.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        <p className="font-medium text-foreground/70">
                          {item.variante_nombre}
                        </p>
                        {item.sabores.map((s, i) => (
                          <p key={i}>
                            {item.sabores!.length > 1 && (
                              <span className="text-primary font-medium">
                                {s.proporcion}{" "}
                              </span>
                            )}
                            {s.sabor_nombre}
                            {s.exclusiones.length > 0 && (
                              <span className="text-destructive/70">
                                {" "}
                                · sin {s.exclusiones.join(", ")}
                              </span>
                            )}
                          </p>
                        ))}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-primary/70">
                            +{item.extras.map((e) => e.nombre).join(", ")}
                          </p>
                        )}
                        {item.acompanante && (
                          <p className="text-amber-600 dark:text-amber-400 font-medium">
                            + {item.acompanante.variante_nombre}:{" "}
                            {item.acompanante.sabor_nombre}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => carrito.eliminarItem(item.key)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        carrito.cambiarCantidad(item.key, item.cantidad - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.cantidad}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        carrito.cambiarCantidad(item.key, item.cantidad + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {promoItem && promoItem.descuento > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(
                          (promoItem.precioConPromo +
                            (item.producto_precio - item.precio_base)) *
                            item.cantidad,
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  )}
                </div>
                <Separator />
              </div>
            );
          })
        )}
      </div>

      {/* Totales */}
      {!carrito.isEmpty && (
        <div className="px-4 py-3 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(carrito.subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          <Button
            className="w-full h-14 text-base font-semibold mt-2"
            onClick={onConfirmar}
          >
            Confirmar pedido
          </Button>
        </div>
      )}
    </div>
  );
}
