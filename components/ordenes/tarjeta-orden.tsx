"use client";

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
  UserCheck,
  Store,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";

const ESTADO_BORDE_COLOR: Record<string, string> = {
  borrador: "border-l-gray-400",
  confirmada: "border-l-blue-500",
  en_preparacion: "border-l-amber-500",
  lista: "border-l-green-500",
  entregada: "border-l-emerald-500",
  cancelada: "border-l-red-400",
};
import { EstadoOrdenBadge, EstadoDeliveryBadge } from "./estado-badge";
import { AccionesOrden } from "./acciones-orden";
import { HistorialTimeline } from "./historial-timeline";
import type { OrdenConItems } from "@/lib/services/ordenes";
import type { Json } from "@/types/database";

type SaborOrdenJson = {
  sabor_id: string;
  sabor_nombre: string;
  proporcion: string;
  exclusiones: string[];
};

type ExtraOrdenJson = {
  extra_id: string;
  nombre: string;
  precio: number;
};

type AcompananteOrdenJson = {
  variante_id: string;
  variante_nombre: string;
  sabor_id: string;
  sabor_nombre: string;
};

function parseSabores(raw: Json | null): SaborOrdenJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as SaborOrdenJson[];
}

function parseExtras(raw: Json | null): ExtraOrdenJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as ExtraOrdenJson[];
}

function parseAcompanante(raw: Json | null): AcompananteOrdenJson | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as AcompananteOrdenJson;
}
import type { ModeloNegocio } from "@/lib/services/configuracion";
import type { NivelMembresia } from "@/lib/services/membresias";

const TIPO_PEDIDO_CONFIG = {
  local: { label: "Local", icon: UtensilsCrossed, color: "text-blue-600" },
  delivery: { label: "Delivery", icon: Bike, color: "text-orange-600" },
  para_llevar: {
    label: "Recojo",
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

function formatEntregaProgramada(isoString: string): string {
  const fecha = new Date(isoString);
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const esHoy =
    fecha.toLocaleDateString("es-PE") === hoy.toLocaleDateString("es-PE");
  const esManana =
    fecha.toLocaleDateString("es-PE") === manana.toLocaleDateString("es-PE");

  const hora = fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (esHoy) return `Hoy ${hora}`;
  if (esManana) return `Mañana ${hora}`;

  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nombreCliente(
  cliente: { nombre: string; apellido: string | null } | null,
): string {
  if (!cliente) return "Cliente no registrado";
  return `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ""}`;
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
  modeloNegocio: ModeloNegocio;
  niveles?: NivelMembresia[];
  haySesionActiva: boolean;
};

export function TarjetaOrden({
  orden,
  rol,
  modeloNegocio,
  niveles = [],
  haySesionActiva,
}: Props) {
  const { formatCurrency } = useCurrency();
  const puedeCobrar = rol === "administrador" || rol === "cajero";
  const tipoCfg = TIPO_PEDIDO_CONFIG[orden.tipo_pedido];
  const TipoIcon = tipoCfg.icon;
  const esDelivery = orden.tipo_pedido === "delivery";

  return (
    <Card
      className={cn(
        "rounded-xl border-l-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md",
        ESTADO_BORDE_COLOR[orden.estado] ?? "border-l-gray-300",
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
            {orden.entrega_programada_at && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <CalendarClock className="h-3 w-3" />
                {formatEntregaProgramada(orden.entrega_programada_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatHora(orden.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {nombreCajero(orden.cajero)}
          </span>
          {orden.sucursal && (
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3" />
              {orden.sucursal.nombre}
            </span>
          )}
          {orden.mesa_referencia && (
            <span className="font-medium text-foreground">
              Mesa: {orden.mesa_referencia}
              {orden.mesa_id && (
                <a
                  href={`/ordenes?mesa=${orden.mesa_id}`}
                  className="ml-1.5 text-[10px] text-primary hover:underline"
                >
                  Ver cuenta
                </a>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <UserCheck className="h-3 w-3" />
          <span className={!orden.cliente ? "italic" : ""}>
            {nombreCliente(orden.cliente)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-1.5">
        {/* Items */}
        <ul className="space-y-1.5 rounded-lg bg-muted/30 p-2.5">
          {orden.orden_items.map((item) => {
            const sabores = parseSabores(item.sabores);
            const extras = parseExtras(item.extras);
            const acompanante = parseAcompanante(item.acompanante);
            return (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  <span className="font-semibold">{item.cantidad}×</span>{" "}
                  {item.producto_nombre}
                  {item.variante_nombre && !sabores.length && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({item.variante_nombre})
                    </span>
                  )}
                  {/* Sabores de pizza */}
                  {sabores.length > 0 && (
                    <span className="block text-xs text-muted-foreground mt-0.5 space-y-0.5">
                      <span className="block font-medium text-foreground/70">
                        {item.variante_nombre}
                      </span>
                      {sabores.map((s, i) => (
                        <span key={i} className="block">
                          {sabores.length > 1 && (
                            <span className="text-primary font-medium">
                              {s.proporcion}{" "}
                            </span>
                          )}
                          {s.sabor_nombre}
                          {s.exclusiones.length > 0 && (
                            <span className="text-destructive/70">
                              {" "}
                              · sin {s.exclusiones.join(", ")}
                            </span>
                          )}
                        </span>
                      ))}
                      {extras.length > 0 && (
                        <span className="block text-primary/70">
                          +{extras.map((e) => e.nombre).join(", ")}
                        </span>
                      )}
                      {acompanante && (
                        <span className="block text-amber-600 dark:text-amber-400 font-medium">
                          + {acompanante.variante_nombre}:{" "}
                          {acompanante.sabor_nombre}
                        </span>
                      )}
                    </span>
                  )}
                  {item.notas_item && (
                    <span className="block text-xs text-muted-foreground">
                      {item.notas_item}
                    </span>
                  )}
                </span>
                <span className="shrink-0 pl-2 tabular-nums font-medium text-foreground/80">
                  {formatCurrency(item.subtotal)}
                </span>
              </li>
            );
          })}
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
                    ? `Propio${orden.third_party_name ? ` - ${orden.third_party_name}` : ""}`
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

        <HistorialTimeline historial={orden.orden_estado_historial ?? []} />
      </CardContent>

      <Separator />

      <CardFooter className="pt-1.5">
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-inter text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(orden.total)}
            </span>
            {orden.descuento > 0 && (
              <span className="text-[11px] text-green-600 dark:text-green-400">
                desc. -{formatCurrency(orden.descuento)}
              </span>
            )}
            {esDelivery && orden.delivery_fee > 0 && (
              <span className="text-[11px] text-muted-foreground">
                inc. delivery {formatCurrency(orden.delivery_fee)}
              </span>
            )}
          </div>
          <div className="flex">
            <AccionesOrden
              orden={orden}
              estadoActual={orden.estado}
              puedeCobrar={puedeCobrar}
              modeloNegocio={modeloNegocio}
              niveles={niveles}
              haySesionActiva={haySesionActiva}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
