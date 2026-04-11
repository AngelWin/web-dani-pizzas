"use client";

import { Tag, Clock, MapPin, Package, Lock, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import { getDescripcionPromocion } from "@/lib/promociones-utils";
import { DIAS_SEMANA_LABELS } from "@/lib/constants";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import type { ProductoPOS } from "@/lib/services/ventas";

type Props = {
  promociones: PromocionActivaPOS[];
  productos: ProductoPOS[];
  onSeleccionarPromo: (promo: PromocionActivaPOS) => void;
};

const TIPO_BADGE_COLOR: Record<string, string> = {
  descuento_porcentaje: "bg-red-500",
  descuento_fijo: "bg-orange-500",
  "2x1": "bg-purple-500",
  combo_precio_fijo: "bg-blue-500",
  delivery_gratis: "bg-green-500",
};

function TipoPedidoBadges({ tipos }: { tipos: string[] | null }) {
  if (!tipos || tipos.length === 0) {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
        Todos
      </Badge>
    );
  }
  const labels: Record<string, string> = {
    local: "Local",
    delivery: "Delivery",
    para_llevar: "Recojo",
  };
  return (
    <>
      {tipos.map((t) => (
        <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
          {labels[t] ?? t}
        </Badge>
      ))}
    </>
  );
}

export function CatalogoPromos({
  promociones,
  productos,
  onSeleccionarPromo,
}: Props) {
  const { formatCurrency } = useCurrency();

  if (promociones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Tag className="h-10 w-10 mb-2 opacity-30" />
        <p className="font-medium">No hay ofertas activas</p>
        <p className="text-sm mt-1">Las promociones vigentes aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {promociones.map((promo) => {
        const badgeColor =
          TIPO_BADGE_COLOR[promo.tipo_promocion] ?? "bg-gray-500";
        const descripcion = getDescripcionPromocion(promo, formatCurrency);

        // Resolver nombres de productos
        const productosNombres = promo.productos_ids
          .map((pid) => productos.find((p) => p.id === pid)?.nombre)
          .filter(Boolean);

        const tipoLabel =
          promo.tipo_promocion === "descuento_porcentaje"
            ? `-${promo.valor_descuento}%`
            : promo.tipo_promocion === "descuento_fijo"
              ? `- ${formatCurrency(promo.valor_descuento)}`
              : promo.tipo_promocion === "2x1"
                ? "2x1"
                : promo.tipo_promocion === "combo_precio_fijo"
                  ? formatCurrency(promo.precio_combo ?? 0)
                  : "GRATIS";

        const botonLabel =
          promo.tipo_promocion === "combo_precio_fijo"
            ? "Armar combo"
            : promo.tipo_promocion === "2x1"
              ? "Seleccionar productos"
              : promo.tipo_promocion === "delivery_gratis"
                ? "Aplicar"
                : "Aplicar descuento";

        return (
          <div
            key={promo.id}
            className="rounded-xl border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            {/* Header con badge tipo */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <Badge
                className={`${badgeColor} text-white text-xs px-2 py-0.5 font-bold`}
              >
                {tipoLabel}
              </Badge>
              <h3 className="font-semibold text-sm truncate flex-1">
                {promo.nombre}
              </h3>
              {!promo.permite_modificaciones && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>

            <div className="p-4 space-y-3">
              {/* Descripción */}
              <p className="text-sm text-muted-foreground">{descripcion}</p>

              {/* Descripción adicional */}
              {promo.descripcion && (
                <p className="text-xs text-muted-foreground/70 italic">
                  {promo.descripcion}
                </p>
              )}

              {/* Productos incluidos */}
              {productosNombres.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {productosNombres.length <= 3
                      ? productosNombres.join(", ")
                      : `${productosNombres.slice(0, 3).join(", ")} +${productosNombres.length - 3} más`}
                  </span>
                </div>
              )}

              {/* Restricciones */}
              <div className="flex flex-wrap gap-1.5">
                <TipoPedidoBadges tipos={promo.tipos_pedido} />

                {promo.dias_semana && promo.dias_semana.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 gap-0.5"
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {promo.dias_semana
                      .sort((a, b) => a - b)
                      .map((d) => DIAS_SEMANA_LABELS[d])
                      .join(", ")}
                  </Badge>
                )}

                {promo.hora_inicio && promo.hora_fin && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 gap-0.5"
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {promo.hora_inicio.slice(0, 5)} —{" "}
                    {promo.hora_fin.slice(0, 5)}
                  </Badge>
                )}

                {!promo.permite_modificaciones && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 gap-0.5 border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    Fija
                  </Badge>
                )}
              </div>

              {/* Precio combo */}
              {promo.tipo_promocion === "combo_precio_fijo" &&
                promo.precio_combo && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                    <span className="text-sm font-bold text-primary">
                      Combo por {formatCurrency(promo.precio_combo)}
                    </span>
                  </div>
                )}

              {/* Pedido mínimo */}
              {promo.pedido_minimo && (
                <p className="text-xs text-muted-foreground">
                  Pedido mínimo: {formatCurrency(promo.pedido_minimo)}
                </p>
              )}

              {/* Botón de acción */}
              <Button
                className="w-full h-11 gap-2"
                onClick={() => onSeleccionarPromo(promo)}
              >
                <ShoppingCart className="h-4 w-4" />
                {botonLabel}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
