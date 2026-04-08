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
import { Store, Utensils, Zap } from "lucide-react";
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-0">
      {/* Barra superior: sucursal + modo */}
      <div className="flex items-center justify-between mb-3">
        {esAdmin ? (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={sucursalId} onValueChange={handleCambiarSucursal}>
              <SelectTrigger className="w-64 h-9">
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
        <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <ModeloIcon className="h-3 w-3" />
          {modeloLabel}
        </div>
      </div>

      {/* Panel principal */}
      <div className="flex flex-1 overflow-hidden rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {/* Catálogo */}
        <div className="flex-1 overflow-hidden p-4">
          <CatalogoProductos
            productos={productos}
            categorias={categorias}
            carrito={carrito}
            saboresPorCategoria={saboresPorCategoria}
            extrasPorCategoria={extrasPorCategoria}
          />
        </div>

        {/* Carrito */}
        <div className="w-72 xl:w-80 shrink-0">
          <Carrito
            carrito={carrito}
            deliveryFee={0}
            onConfirmar={() => {
              if (carrito.isEmpty) {
                toast.warning("Agrega productos al carrito primero");
                return;
              }
              setDialogOpen(true);
            }}
          />
        </div>
      </div>

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
