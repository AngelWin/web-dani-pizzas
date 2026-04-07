"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CatalogoProductos } from "./catalogo-productos";
import { Carrito } from "./carrito";
import { FormularioPedidoDialog } from "./formulario-pedido-dialog";
import { VentaExitosaDialog } from "./venta-exitosa-dialog";
import { useCarrito } from "@/hooks/use-carrito";
import { useDeliveryFees } from "@/hooks/use-delivery-fees";
import { crearVentaAction } from "@/actions/ventas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store } from "lucide-react";
import type { ProductoPOS, Venta } from "@/lib/services/ventas";
import type { Profile } from "@/lib/services/ventas";
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
};

export function PosClient({
  productos,
  categorias,
  repartidores,
  sucursalId,
  sucursales,
  rol,
}: Props) {
  const router = useRouter();
  const carrito = useCarrito();
  const { fees: deliveryFees } = useDeliveryFees(sucursalId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);

  const esAdmin = sucursales.length > 0;

  function handleCambiarSucursal(id: string) {
    carrito.limpiarCarrito();
    router.push(`/pos?sucursal=${id}`);
  }

  async function handleConfirmarPedido(
    data: Parameters<typeof crearVentaAction>[0],
  ) {
    setIsSubmitting(true);
    try {
      const result = await crearVentaAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDialogOpen(false);
      setVentaExitosa(result.data);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNuevoPedido() {
    carrito.limpiarCarrito();
    setVentaExitosa(null);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-0">
      {/* Selector de sucursal para admin */}
      {esAdmin && (
        <div className="flex items-center gap-2 mb-3">
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
      )}

      {/* Panel principal */}
      <div className="flex flex-1 overflow-hidden rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {/* Catálogo (panel izquierdo) */}
        <div className="flex-1 overflow-hidden p-4">
          <CatalogoProductos
            productos={productos}
            categorias={categorias}
            carrito={carrito}
          />
        </div>

        {/* Carrito (panel derecho) */}
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

      {/* Dialog de confirmación de pedido */}
      <FormularioPedidoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        carrito={carrito}
        repartidores={repartidores}
        deliveryFees={deliveryFees}
        rol={rol}
        onSubmit={handleConfirmarPedido}
        isSubmitting={isSubmitting}
      />

      {/* Dialog de venta exitosa */}
      <VentaExitosaDialog
        venta={ventaExitosa}
        open={ventaExitosa !== null}
        onNuevoPedido={handleNuevoPedido}
      />
    </div>
  );
}
