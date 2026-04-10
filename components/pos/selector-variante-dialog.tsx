"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import type { ProductoPOS } from "@/lib/services/ventas";

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
};

export function SelectorVarianteDialog({
  producto,
  open,
  onClose,
  onSelect,
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
          {producto.producto_variantes.map((v) => (
            <Button
              key={v.id}
              variant="outline"
              className="h-14 justify-between text-base"
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
              <span>{v.categoria_medidas?.nombre ?? "Medida"}</span>
              <span className="font-semibold text-primary">
                {formatCurrency(v.precio)}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
