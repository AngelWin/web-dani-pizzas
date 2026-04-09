"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cambiarEstadoOrdenAction,
  cambiarEstadoDeliveryAction,
} from "@/app/(dashboard)/ordenes/actions";
import dynamic from "next/dynamic";

const CobroDialog = dynamic(
  () => import("./cobro-dialog").then((mod) => mod.CobroDialog),
  { ssr: false },
);

const CancelarOrdenDialog = dynamic(
  () =>
    import("./cancelar-orden-dialog").then((mod) => mod.CancelarOrdenDialog),
  { ssr: false },
);
import type {
  EstadoOrden,
  EstadoDelivery,
  OrdenConItems,
} from "@/lib/services/ordenes";
import type { ModeloNegocio } from "@/lib/services/configuracion";
import type { NivelMembresia } from "@/lib/services/membresias";

const SIGUIENTE_ESTADO_SIMPLE: Partial<Record<EstadoOrden, EstadoOrden>> = {
  confirmada: "en_preparacion",
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

const ESTADOS_CANCELABLES: EstadoOrden[] = ["confirmada", "en_preparacion"];

type Props = {
  orden: OrdenConItems;
  estadoActual: EstadoOrden;
  puedeCobrar: boolean;
  modeloNegocio: ModeloNegocio;
  niveles?: NivelMembresia[];
};

export function AccionesOrden({
  orden,
  estadoActual,
  puedeCobrar,
  modeloNegocio,
  niveles = [],
}: Props) {
  const [pending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [cancelarOpen, setCancelarOpen] = useState(false);

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

  const puedeCancelar = ESTADOS_CANCELABLES.includes(estadoActual);

  const mostrarCobrar =
    puedeCobrar &&
    ((modeloNegocio === "simple" && estadoActual === "en_preparacion") ||
      (modeloNegocio === "cocina_independiente" && estadoActual === "lista"));

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

  if (esFinalizado) {
    return <span className="text-xs text-muted-foreground">Sin acciones</span>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Cancelar — visible directamente */}
        {puedeCancelar && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setCancelarOpen(true)}
            disabled={pending}
          >
            Cancelar
          </Button>
        )}

        {/* Avanzar delivery */}
        {tipoDelivery &&
          siguienteDelivery &&
          deliveryStatus !== "entregado" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg text-xs"
              onClick={handleAvanzarDelivery}
              disabled={pending}
            >
              {loadingAction === "delivery" && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              Del → {DELIVERY_LABEL[siguienteDelivery]}
            </Button>
          )}

        {/* Cobrar */}
        {mostrarCobrar && (
          <>
            <Button
              size="sm"
              className="h-7 rounded-lg bg-green-600 text-xs text-white hover:bg-green-700"
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
              niveles={niveles}
            />
          </>
        )}

        {/* Avanzar estado */}
        {siguienteEstado && (
          <Button
            size="sm"
            className="h-7 rounded-lg bg-primary text-xs text-white hover:bg-primary/90"
            onClick={handleAvanzarEstado}
            disabled={pending}
          >
            {loadingAction === "estado" && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            → {ESTADO_LABEL[siguienteEstado]}
          </Button>
        )}
      </div>

      {/* Dialog de cancelación con motivo */}
      <CancelarOrdenDialog
        orden={orden}
        open={cancelarOpen}
        onOpenChange={setCancelarOpen}
      />
    </>
  );
}
