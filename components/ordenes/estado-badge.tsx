import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EstadoOrden, EstadoDelivery } from "@/lib/services/ordenes";

const ESTADO_ORDEN_CONFIG: Record<
  EstadoOrden,
  { label: string; className: string }
> = {
  borrador: {
    label: "Borrador",
    className: "bg-muted text-muted-foreground border-border",
  },
  confirmada: {
    label: "Confirmada",
    className: "bg-info/10 text-info border-info/30",
  },
  en_preparacion: {
    label: "En preparación",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  lista: {
    label: "Lista",
    className: "bg-success/10 text-success border-success/30",
  },
  entregada: {
    label: "Entregada",
    className: "bg-success/15 text-success border-success/40",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const ESTADO_DELIVERY_CONFIG: Record<
  EstadoDelivery,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente envío",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  en_camino: {
    label: "En camino",
    className: "bg-info/10 text-info border-info/30",
  },
  entregado: {
    label: "Entregado",
    className: "bg-success/10 text-success border-success/30",
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
