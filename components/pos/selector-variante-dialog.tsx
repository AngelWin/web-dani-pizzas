"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { detectarPromoParaVariante } from "@/lib/promociones-utils";
import type { ProductoPOS } from "@/lib/services/ventas";
import type { PromocionActivaPOS } from "@/lib/services/promociones";

type Props = {
  producto: ProductoPOS | null;
  open: boolean;
  onClose: () => void;
  onSelect: (
    producto: ProductoPOS,
    variante: {
      id: string;
      nombre: string;
      precio: number;
      medida_id?: string;
    },
  ) => void;
  promociones?: PromocionActivaPOS[];
};

export function SelectorVarianteDialog({
  producto,
  open,
  onClose,
  onSelect,
  promociones = [],
}: Props) {
  const { formatCurrency } = useCurrency();
  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{producto.nombre}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Selecciona la medida:
        </p>
        <div className="grid grid-cols-1 gap-2">
          {producto.producto_variantes.map((v) => {
            const promo = detectarPromoParaVariante(
              promociones,
              producto.id,
              v.medida_id,
              v.precio,
            );

            return (
              <Button
                key={v.id}
                variant="outline"
                className="h-14 justify-between text-base relative"
                onClick={() => {
                  onSelect(producto, {
                    id: v.id,
                    nombre: v.categoria_medidas?.nombre ?? "",
                    precio: v.precio,
                    medida_id: v.medida_id,
                  });
                  onClose();
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{v.categoria_medidas?.nombre ?? "Medida"}</span>
                  {promo && (
                    <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0 font-bold">
                      {promo.etiqueta}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {promo && promo.descuento > 0 ? (
                    <>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(v.precio)}
                      </span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(promo.precioConPromo)}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-primary">
                      {formatCurrency(v.precio)}
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
