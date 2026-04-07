"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cambiarEstadoOrdenAction,
  cambiarEstadoDeliveryAction,
} from "@/app/(dashboard)/ordenes/actions";
import { CobroDialog } from "./cobro-dialog";
import type {
  EstadoOrden,
  EstadoDelivery,
  OrdenConItems,
} from "@/lib/services/ordenes";
import type { ModeloNegocio } from "@/lib/services/configuracion";

const SIGUIENTE_ESTADO_SIMPLE: Partial<Record<EstadoOrden, EstadoOrden>> = {
  confirmada: "en_preparacion",
  en_preparacion: "entregada",
};

const SIGUIENTE_ESTADO_COCINA: Partial<Record<EstadoOrden, EstadoOrden>> = {
  confirmada: "en_preparacion",
  en_preparacion: "lista",
};

const ESTADO_LABEL: Record<EstadoOrden, string> = {
  borrador: "Borrador",
  confirmada: "Confirmada",
  en_preparacion: "En preparación",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

const SIGUIENTE_DELIVERY: Partial<Record<EstadoDelivery, EstadoDelivery>> = {
  pendiente: "en_camino",
  en_camino: "entregado",
};

const DELIVERY_LABEL: Record<EstadoDelivery, string> = {
  pendiente: "Pendiente envío",
  en_camino: "En camino",
  entregado: "Entregado",
};

type Props = {
  orden: OrdenConItems;
  estadoActual: EstadoOrden;
  puedeCobrar: boolean;
  modeloNegocio: ModeloNegocio;
};

export function AccionesOrden({
  orden,
  estadoActual,
  puedeCobrar,
  modeloNegocio,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cobrarOpen, setCobrarOpen] = useState(false);

  const ordenId = orden.id;
  const deliveryStatus = orden.delivery_status;
  const tipoDelivery = orden.tipo_pedido === "delivery";

  const SIGUIENTE_ESTADO =
    modeloNegocio === "simple"
      ? SIGUIENTE_ESTADO_SIMPLE
      : SIGUIENTE_ESTADO_COCINA;

  const siguienteEstado = SIGUIENTE_ESTADO[estadoActual];
  const siguienteDelivery = deliveryStatus
    ? SIGUIENTE_DELIVERY[deliveryStatus]
    : null;
  const esFinalizado =
    estadoActual === "entregada" || estadoActual === "cancelada";

  function handleAvanzarEstado() {
    if (!siguienteEstado) return;
    setLoadingAction("estado");
    startTransition(async () => {
      const result = await cambiarEstadoOrdenAction(ordenId, siguienteEstado);
      if (result.error) {
        toast.error("Error al cambiar estado", { description: result.error });
      } else {
        toast.success(`Orden → ${ESTADO_LABEL[siguienteEstado]}`);
      }
      setLoadingAction(null);
    });
  }

  function handleAvanzarDelivery() {
    if (!siguienteDelivery) return;
    setLoadingAction("delivery");
    startTransition(async () => {
      const result = await cambiarEstadoDeliveryAction(
        ordenId,
        siguienteDelivery,
      );
      if (result.error) {
        toast.error("Error al cambiar estado delivery", {
          description: result.error,
        });
      } else {
        toast.success(`Delivery → ${DELIVERY_LABEL[siguienteDelivery]}`);
      }
      setLoadingAction(null);
    });
  }

  function handleCancelar() {
    setLoadingAction("cancelar");
    startTransition(async () => {
      const result = await cambiarEstadoOrdenAction(ordenId, "cancelada");
      if (result.error) {
        toast.error("Error al cancelar orden", { description: result.error });
      } else {
        toast.success("Orden cancelada");
      }
      setLoadingAction(null);
    });
  }

  if (esFinalizado) {
    return <span className="text-xs text-muted-foreground">Sin acciones</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {siguienteEstado && (
        <Button
          size="sm"
          className="h-8 rounded-lg bg-primary text-white hover:bg-primary/90"
          onClick={handleAvanzarEstado}
          disabled={pending}
        >
          {loadingAction === "estado" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          → {ESTADO_LABEL[siguienteEstado]}
        </Button>
      )}

      {((modeloNegocio === "simple" && estadoActual === "en_preparacion") ||
        (modeloNegocio === "cocina_independiente" &&
          estadoActual === "lista")) &&
        puedeCobrar && (
          <>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-green-600 text-white hover:bg-green-700"
              onClick={() => setCobrarOpen(true)}
              disabled={pending}
            >
              <DollarSign className="mr-1 h-3 w-3" />
              Cobrar
            </Button>
            <CobroDialog
              orden={orden}
              open={cobrarOpen}
              onOpenChange={setCobrarOpen}
            />
          </>
        )}

      {tipoDelivery && siguienteDelivery && deliveryStatus !== "entregado" && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          onClick={handleAvanzarDelivery}
          disabled={pending}
        >
          {loadingAction === "delivery" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Delivery → {DELIVERY_LABEL[siguienteDelivery]}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-lg px-2"
            disabled={pending}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(SIGUIENTE_ESTADO)
            .filter(([from]) => from !== estadoActual)
            .map(([, to]) => (
              <DropdownMenuItem
                key={to}
                onClick={() => {
                  setLoadingAction("estado");
                  startTransition(async () => {
                    const result = await cambiarEstadoOrdenAction(ordenId, to);
                    if (result.error)
                      toast.error("Error", { description: result.error });
                    else toast.success(`Orden → ${ESTADO_LABEL[to]}`);
                    setLoadingAction(null);
                  });
                }}
              >
                Marcar como {ESTADO_LABEL[to]}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleCancelar}
          >
            Cancelar orden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
