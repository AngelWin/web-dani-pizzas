"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CatalogoProductos } from "./catalogo-productos";
import { Carrito } from "./carrito";
import { FormularioPedidoDialog } from "./formulario-pedido-dialog";
import { OrdenConfirmadaDialog } from "./orden-confirmada-dialog";
import { useCarrito } from "@/hooks/use-carrito";
import { useDeliveryFees } from "@/hooks/use-delivery-fees";
import { crearOrdenAction } from "@/actions/ordenes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Store, Utensils, Zap, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ProductoPOS } from "@/lib/services/ventas";
import type { Profile } from "@/lib/services/ventas";
import type { Orden } from "@/lib/services/ordenes";
import type { ModeloNegocio } from "@/lib/services/configuracion";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import type {
  PizzaSaborConIngredientes,
  ProductoExtra,
} from "@/lib/services/productos";
import type { Database } from "@/types/database";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];
type Categoria = { id: string; nombre: string };
type Repartidor = Pick<Profile, "id" | "nombre" | "apellido_paterno">;

type Props = {
  productos: ProductoPOS[];
  categorias: Categoria[];
  repartidores: Repartidor[];
  sucursalId: string;
  sucursales: Sucursal[];
  rol: string | null;
  modeloNegocio: ModeloNegocio;
  promociones: PromocionActivaPOS[];
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  extrasPorCategoria: Record<string, ProductoExtra[]>;
};

export function PosClient({
  productos,
  categorias,
  repartidores,
  sucursalId,
  sucursales,
  rol,
  modeloNegocio,
  promociones,
  saboresPorCategoria,
  extrasPorCategoria,
}: Props) {
  const router = useRouter();
  const carrito = useCarrito();
  const { fees: deliveryFees } = useDeliveryFees(sucursalId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ordenConfirmada, setOrdenConfirmada] = useState<Orden | null>(null);
  const [carritoMobileOpen, setCarritoMobileOpen] = useState(false);

  const esAdmin = sucursales.length > 0;

  function handleCambiarSucursal(id: string) {
    carrito.limpiarCarrito();
    router.push(`/pos?sucursal=${id}`);
  }

  async function handleConfirmarPedido(
    data: Parameters<typeof crearOrdenAction>[0],
  ) {
    setIsSubmitting(true);
    try {
      const result = await crearOrdenAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDialogOpen(false);
      setOrdenConfirmada(result.data);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNuevoPedido() {
    carrito.limpiarCarrito();
    setOrdenConfirmada(null);
  }

  const modeloLabel =
    modeloNegocio === "simple" ? "Modo Simple" : "Cocina Independiente";
  const ModeloIcon = modeloNegocio === "simple" ? Zap : Utensils;

  function handleAbrirConfirmar() {
    if (carrito.isEmpty) {
      toast.warning("Agrega productos al carrito primero");
      return;
    }
    setCarritoMobileOpen(false);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-8rem)] gap-0">
      {/* Barra superior: sucursal + modo */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {esAdmin ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Store className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={sucursalId} onValueChange={handleCambiarSucursal}>
              <SelectTrigger className="w-full sm:w-64 h-9">
                <SelectValue placeholder="Selecciona sucursal" />
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
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground shrink-0">
          <ModeloIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{modeloLabel}</span>
        </div>
      </div>

      {/* Panel principal */}
      <div className="flex flex-1 overflow-hidden rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {/* Catálogo — ocupa todo el ancho en mobile */}
        <div className="flex-1 overflow-hidden p-3 md:p-4">
          <CatalogoProductos
            productos={productos}
            categorias={categorias}
            carrito={carrito}
            saboresPorCategoria={saboresPorCategoria}
            extrasPorCategoria={extrasPorCategoria}
          />
        </div>

        {/* Carrito — solo visible en desktop */}
        <div className="hidden md:block w-72 xl:w-80 shrink-0">
          <Carrito
            carrito={carrito}
            deliveryFee={0}
            onConfirmar={handleAbrirConfirmar}
          />
        </div>
      </div>

      {/* FAB Carrito — solo mobile, cuando hay items */}
      {!carrito.isEmpty && (
        <div className="fixed bottom-6 right-4 md:hidden z-40">
          <Button
            size="lg"
            className="h-14 rounded-full shadow-lg gap-2 px-5 text-base font-semibold"
            onClick={() => setCarritoMobileOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{carrito.totalItems}</span>
            <span>·</span>
            <span>{formatCurrency(carrito.subtotal)}</span>
          </Button>
        </div>
      )}

      {/* Sheet carrito — solo mobile */}
      <Sheet open={carritoMobileOpen} onOpenChange={setCarritoMobileOpen}>
        <SheetContent
          side="bottom"
          className="h-[85dvh] p-0 rounded-t-2xl md:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Carrito</SheetTitle>
          </SheetHeader>
          <Carrito
            carrito={carrito}
            deliveryFee={0}
            onConfirmar={handleAbrirConfirmar}
          />
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmación */}
      <FormularioPedidoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        carrito={carrito}
        repartidores={repartidores}
        deliveryFees={deliveryFees}
        rol={rol}
        onSubmit={handleConfirmarPedido}
        isSubmitting={isSubmitting}
        promociones={promociones}
      />

      {/* Dialog de orden confirmada */}
      <OrdenConfirmadaDialog
        orden={ordenConfirmada}
        open={ordenConfirmada !== null}
        onNuevoPedido={handleNuevoPedido}
      />
    </div>
  );
}
