"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  Armchair,
  X,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputNumerico } from "@/components/ui/input-numerico";
import { useCurrency } from "@/hooks/use-currency";
import { cobrarMesaAction } from "@/app/(dashboard)/ordenes/actions";
import { METODO_PAGO } from "@/lib/constants";
import { BotonLiberarMesa } from "@/components/mesas/boton-liberar-mesa";
import { TarjetaOrden } from "./tarjeta-orden";
import type { OrdenConItems, FiltroEstadoOrden } from "@/lib/services/ordenes";
import type { ModeloNegocio } from "@/lib/services/configuracion";
import type { NivelMembresia } from "@/lib/services/membresias";

type EstadoTab = FiltroEstadoOrden | "programados";

function getTabs(
  modeloNegocio: ModeloNegocio,
): { value: EstadoTab; label: string }[] {
  const base: { value: EstadoTab; label: string }[] = [
    { value: "activas", label: "Activas" },
    { value: "programados", label: "Programados" },
    { value: "todas", label: "Todas" },
    { value: "confirmada", label: "Confirmadas" },
    { value: "en_preparacion", label: "En preparación" },
  ];

  // Solo en Modo Cocina Independiente aparece el estado "lista"
  if (modeloNegocio === "cocina_independiente") {
    base.push({ value: "lista", label: "Listas" });
  }

  base.push(
    { value: "entregada", label: "Entregadas" },
    { value: "cancelada", label: "Canceladas" },
  );

  return base;
}

function filtrarOrdenes(
  ordenes: OrdenConItems[],
  filtro: EstadoTab,
): OrdenConItems[] {
  if (filtro === "todas") return ordenes;
  if (filtro === "programados")
    return ordenes.filter((o) => !!o.entrega_programada_at);
  if (filtro === "activas")
    return ordenes.filter(
      (o) => o.estado !== "entregada" && o.estado !== "cancelada",
    );
  return ordenes.filter((o) => o.estado === filtro);
}

function formatearFechaLegible(fecha: string): string {
  // fecha: YYYY-MM-DD
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const date = new Date(anio, mes - 1, dia);
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type Props = {
  ordenes: OrdenConItems[];
  rol: string | null;
  modeloNegocio: ModeloNegocio;
  fechaFiltro: string; // YYYY-MM-DD
  hoy: string; // YYYY-MM-DD
  minFecha: string | null; // YYYY-MM-DD (7 días atrás) — null = sin restricción (admin)
  niveles?: NivelMembresia[];
  mesaFiltro?: string; // UUID de mesa si se filtran por mesa
  haySesionActiva: boolean;
};

export function ListaOrdenes({
  ordenes,
  rol,
  modeloNegocio,
  fechaFiltro,
  hoy,
  minFecha,
  niveles = [],
  mesaFiltro,
  haySesionActiva,
}: Props) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [filtro, setFiltro] = useState<EstadoTab>("activas");
  const [cobrarMesaOpen, setCobrarMesaOpen] = useState(false);
  const [metodoPagoMesa, setMetodoPagoMesa] = useState<string>("");
  const [montoRecibidoMesa, setMontoRecibidoMesa] = useState<number | null>(
    null,
  );
  const [isPendingMesa, startTransitionMesa] = useTransition();

  const tabs = getTabs(modeloNegocio);

  // Cuenta de mesa: total acumulado de órdenes activas
  const totalMesa = mesaFiltro
    ? ordenes
        .filter((o) => !["entregada", "cancelada"].includes(o.estado))
        .reduce((acc, o) => acc + o.total, 0)
    : 0;
  const ordenesActivasMesa = mesaFiltro
    ? ordenes.filter((o) => !["entregada", "cancelada"].includes(o.estado))
        .length
    : 0;
  const mesaReferencia = mesaFiltro
    ? ordenes.find((o) => o.mesa_referencia)?.mesa_referencia
    : null;
  const ordenesFiltradas = useMemo(
    () => filtrarOrdenes(ordenes, filtro),
    [ordenes, filtro],
  );

  // Pre-calcular conteos una sola vez por cambio de órdenes
  const conteosPorTab = useMemo(() => {
    const conteos: Record<string, number> = { todas: ordenes.length };
    let activas = 0;
    let programados = 0;
    for (const o of ordenes) {
      conteos[o.estado] = (conteos[o.estado] ?? 0) + 1;
      if (o.estado !== "entregada" && o.estado !== "cancelada") activas++;
      if (o.entrega_programada_at) programados++;
    }
    conteos["activas"] = activas;
    conteos["programados"] = programados;
    return conteos;
  }, [ordenes]);

  function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nueva = e.target.value;
    if (nueva <= hoy && (minFecha === null || nueva >= minFecha)) {
      router.push(`/ordenes?fecha=${nueva}`);
    }
  }

  const esHoy = fechaFiltro === hoy;

  return (
    <div className="space-y-4">
      {/* Banner de cuenta de mesa */}
      {mesaFiltro && (
        <div className="flex items-center justify-between rounded-xl border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <Armchair className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-400">
                Cuenta de {mesaReferencia ?? "Mesa"}
              </p>
              <p className="text-xs text-blue-600/80 dark:text-blue-500">
                {ordenesActivasMesa}{" "}
                {ordenesActivasMesa === 1 ? "orden activa" : "órdenes activas"}{" "}
                — Total: {formatCurrency(totalMesa)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ordenesActivasMesa > 0 && (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setCobrarMesaOpen(true)}
              >
                <Banknote className="h-3.5 w-3.5" />
                Cobrar mesa
              </Button>
            )}
            {ordenesActivasMesa > 0 &&
              (rol === "administrador" || rol === "cajero") && (
                <BotonLiberarMesa
                  mesaId={mesaFiltro}
                  mesaReferencia={mesaReferencia ?? "Mesa"}
                  ordenesActivas={ordenesActivasMesa}
                />
              )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-blue-600 hover:text-blue-800"
              onClick={() => router.push(`/ordenes?fecha=${fechaFiltro}`)}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Quitar filtro
            </Button>
          </div>
        </div>
      )}

      {/* Selector de fecha */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">
            {esHoy ? "Hoy" : formatearFechaLegible(fechaFiltro)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fechaFiltro}
            {...(minFecha ? { min: minFecha } : {})}
            max={hoy}
            onChange={handleFechaChange}
            className="h-11 rounded-xl border border-border bg-card px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {!esHoy && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-xl text-xs"
              onClick={() => router.push("/ordenes")}
            >
              Hoy
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count = conteosPorTab[tab.value] ?? 0;

          return (
            <Button
              key={tab.value}
              size="sm"
              variant={filtro === tab.value ? "default" : "outline"}
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setFiltro(tab.value)}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={
                    filtro === tab.value
                      ? "ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]"
                      : "ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]"
                  }
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Grid de tarjetas */}
      {ordenesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <ClipboardList className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">No hay órdenes en esta categoría</p>
          {!esHoy && (
            <p className="mt-1 text-xs opacity-70">
              Mostrando órdenes del {formatearFechaLegible(fechaFiltro)}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordenesFiltradas.map((orden) => (
            <TarjetaOrden
              key={orden.id}
              orden={orden}
              rol={rol}
              modeloNegocio={modeloNegocio}
              niveles={niveles}
              haySesionActiva={haySesionActiva}
            />
          ))}
        </div>
      )}
      {/* Dialog cobrar mesa completa */}
      {mesaFiltro && (
        <Dialog
          open={cobrarMesaOpen}
          onOpenChange={(v) => {
            if (!v) {
              setCobrarMesaOpen(false);
              setMetodoPagoMesa("");
              setMontoRecibidoMesa(null);
            }
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Cobrar {mesaReferencia ?? "Mesa"} completa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-xl border p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Órdenes</span>
                  <span>{ordenesActivasMesa}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total de la mesa</span>
                  <span className="text-primary">
                    {formatCurrency(totalMesa)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Método de pago</label>
                <Select
                  onValueChange={(v) => {
                    setMetodoPagoMesa(v);
                    setMontoRecibidoMesa(null);
                  }}
                  value={metodoPagoMesa}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="plin">Plin</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {metodoPagoMesa === "efectivo" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto recibido</label>
                  <InputNumerico
                    variante="precio"
                    min={totalMesa}
                    placeholder={`Mínimo ${formatCurrency(totalMesa)}`}
                    className="h-11"
                    value={montoRecibidoMesa}
                    onChange={setMontoRecibidoMesa}
                    allowNull
                  />
                  {montoRecibidoMesa && montoRecibidoMesa > totalMesa && (
                    <p className="text-xs text-green-600">
                      Vuelto: {formatCurrency(montoRecibidoMesa - totalMesa)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setCobrarMesaOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="h-11 flex-1"
                disabled={
                  isPendingMesa ||
                  !metodoPagoMesa ||
                  (metodoPagoMesa === "efectivo" &&
                    (!montoRecibidoMesa || montoRecibidoMesa < totalMesa))
                }
                onClick={() => {
                  startTransitionMesa(async () => {
                    const result = await cobrarMesaAction(mesaFiltro, {
                      metodo_pago: metodoPagoMesa,
                      monto_recibido: montoRecibidoMesa ?? undefined,
                      descuento_membresia: 0,
                    });
                    if (result.error) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success(
                      `${result.data!.cobradas} órdenes cobradas — Total: ${formatCurrency(result.data!.total)}`,
                    );
                    setCobrarMesaOpen(false);
                    router.refresh();
                  });
                }}
              >
                {isPendingMesa
                  ? "Cobrando..."
                  : `Cobrar ${formatCurrency(totalMesa)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
