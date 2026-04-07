import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EstadoOrden, EstadoDelivery } from "@/lib/services/ordenes";

const ESTADO_ORDEN_CONFIG: Record<
  EstadoOrden,
  { label: string; className: string }
> = {
  borrador: {
    label: "Borrador",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  confirmada: {
    label: "Confirmada",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  en_preparacion: {
    label: "En preparación",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  lista: {
    label: "Lista",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  entregada: {
    label: "Entregada",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const ESTADO_DELIVERY_CONFIG: Record<
  EstadoDelivery,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente envío",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  en_camino: {
    label: "En camino",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  entregado: {
    label: "Entregado",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

export function EstadoOrdenBadge({ estado }: { estado: EstadoOrden }) {
  const config = ESTADO_ORDEN_CONFIG[estado];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

export function EstadoDeliveryBadge({
  estado,
}: {
  estado: EstadoDelivery | null;
}) {
  if (!estado) return null;
  const config = ESTADO_DELIVERY_CONFIG[estado];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
