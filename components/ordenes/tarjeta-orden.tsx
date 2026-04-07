import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  User,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EstadoOrdenBadge, EstadoDeliveryBadge } from "./estado-badge";
import { AccionesOrden } from "./acciones-orden";
import type { OrdenConItems } from "@/lib/services/ordenes";

const TIPO_PEDIDO_CONFIG = {
  local: { label: "Local", icon: UtensilsCrossed, color: "text-blue-600" },
  delivery: { label: "Delivery", icon: Bike, color: "text-orange-600" },
  para_llevar: {
    label: "Para llevar",
    icon: ShoppingBag,
    color: "text-purple-600",
  },
};

function formatHora(isoString: string) {
  return new Date(isoString).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSoles(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

function nombreCajero(
  profile: { nombre: string; apellido_paterno: string } | null,
) {
  if (!profile) return "—";
  return `${profile.nombre} ${profile.apellido_paterno}`;
}

type Props = {
  orden: OrdenConItems;
  rol: string | null;
};

export function TarjetaOrden({ orden, rol }: Props) {
  const puedeCobrar = rol === "administrador" || rol === "cajero";
  const tipoCfg = TIPO_PEDIDO_CONFIG[orden.tipo_pedido];
  const TipoIcon = tipoCfg.icon;
  const esDelivery = orden.tipo_pedido === "delivery";

  return (
    <Card
      className={cn(
        "rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md",
        orden.estado === "cancelada" && "opacity-60",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              #{orden.numero_orden}
            </span>
            <div className={cn("flex items-center gap-1", tipoCfg.color)}>
              <TipoIcon className="h-4 w-4" />
              <span className="text-xs font-medium">{tipoCfg.label}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <EstadoOrdenBadge estado={orden.estado} />
            {esDelivery && (
              <EstadoDeliveryBadge estado={orden.delivery_status} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatHora(orden.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {nombreCajero(orden.cajero)}
          </span>
          {orden.mesa_referencia && (
            <span className="font-medium text-foreground">
              Mesa: {orden.mesa_referencia}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Items */}
        <ul className="space-y-1">
          {orden.orden_items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                <span className="font-medium">{item.cantidad}×</span>{" "}
                {item.producto_nombre}
                {item.variante_nombre && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({item.variante_nombre})
                  </span>
                )}
                {item.notas_item && (
                  <span className="block text-xs text-muted-foreground">
                    {item.notas_item}
                  </span>
                )}
              </span>
              <span className="shrink-0 pl-2 text-muted-foreground">
                {formatSoles(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        {/* Delivery info */}
        {esDelivery && (
          <>
            <Separator className="my-2" />
            <div className="space-y-1 text-xs text-muted-foreground">
              {orden.delivery_method && (
                <p>
                  <span className="font-medium">Método:</span>{" "}
                  {orden.delivery_method === "propio"
                    ? "Propio"
                    : `Tercero${orden.third_party_name ? ` - ${orden.third_party_name}` : ""}`}
                </p>
              )}
              {orden.delivery_address && (
                <p className="flex gap-1">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {orden.delivery_address}
                  {orden.delivery_referencia && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      — {orden.delivery_referencia}
                    </span>
                  )}
                </p>
              )}
              {orden.repartidor && (
                <p>
                  <span className="font-medium">Repartidor:</span>{" "}
                  {nombreCajero(orden.repartidor)}
                </p>
              )}
            </div>
          </>
        )}

        {orden.notas && (
          <p className="mt-2 text-xs italic text-muted-foreground">
            Notas: {orden.notas}
          </p>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between pt-3">
        <div className="text-sm">
          <span className="font-bold text-foreground">
            {formatSoles(orden.total)}
          </span>
          {esDelivery && orden.delivery_fee > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              (inc. delivery {formatSoles(orden.delivery_fee)})
            </span>
          )}
        </div>

        <AccionesOrden
          orden={orden}
          estadoActual={orden.estado}
          puedeCobrar={puedeCobrar}
        />
      </CardFooter>
    </Card>
  );
}
