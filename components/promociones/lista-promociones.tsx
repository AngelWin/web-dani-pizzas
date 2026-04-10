"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  Banknote,
  Copy,
  Package,
  Truck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";

const FormularioPromocionDialog = dynamic(
  () =>
    import("./formulario-promocion-dialog").then(
      (mod) => mod.FormularioPromocionDialog,
    ),
  { ssr: false },
);
import {
  deletePromocionAction,
  togglePromocionActivaAction,
} from "@/actions/promociones";
import { TIPO_PROMOCION_LABELS, DIAS_SEMANA_LABELS } from "@/lib/constants";
import { useCurrency } from "@/hooks/use-currency";
import type { PromocionConProductos } from "@/lib/services/promociones";

type ProductoBasico = {
  id: string;
  nombre: string;
  categoria_id: string | null;
};
type SucursalBasica = { id: string; nombre: string };
type MedidaBasica = { id: string; nombre: string; categoria_id: string };

type Props = {
  promociones: PromocionConProductos[];
  productos: ProductoBasico[];
  sucursales: SucursalBasica[];
  medidas: MedidaBasica[];
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIPO_ICONO: Record<string, typeof Percent> = {
  descuento_porcentaje: Percent,
  descuento_fijo: Banknote,
  "2x1": Copy,
  combo_precio_fijo: Package,
  delivery_gratis: Truck,
};

function BadgeEstado({ promocion }: { promocion: PromocionConProductos }) {
  if (!promocion.activa) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400 text-[10px] px-1.5 py-0"
      >
        <XCircle className="h-3 w-3" />
        Inactiva
      </Badge>
    );
  }
  const ahora = new Date();
  const inicio = new Date(promocion.fecha_inicio);
  const fin = new Date(promocion.fecha_fin);

  if (ahora < inicio) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400 text-[10px] px-1.5 py-0"
      >
        <Clock className="h-3 w-3" />
        Próximamente
      </Badge>
    );
  }
  if (ahora > fin) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-[10px] px-1.5 py-0"
      >
        <XCircle className="h-3 w-3" />
        Vencida
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-green-300 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px] px-1.5 py-0"
    >
      <CheckCircle2 className="h-3 w-3" />
      Vigente
    </Badge>
  );
}

export function ListaPromociones({
  promociones: inicial,
  productos,
  sucursales,
  medidas,
}: Props) {
  const { formatCurrency } = useCurrency();
  const [promociones, setPromociones] =
    useState<PromocionConProductos[]>(inicial);

  // Sincronizar cuando el Server Component refresca los datos
  useEffect(() => {
    setPromociones(inicial);
  }, [inicial]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<PromocionConProductos | null>(null);
  const [eliminando, setEliminando] = useState<PromocionConProductos | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleEditar(promo: PromocionConProductos) {
    setEditando(promo);
    setDialogOpen(true);
  }

  function handleNueva() {
    setEditando(null);
    setDialogOpen(true);
  }

  function handleCerrarDialog() {
    setDialogOpen(false);
    setEditando(null);
  }

  function handleToggleActiva(promo: PromocionConProductos, activa: boolean) {
    startTransition(async () => {
      const result = await togglePromocionActivaAction(promo.id, activa);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPromociones((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, activa } : p)),
      );
      toast.success(activa ? "Promoción activada" : "Promoción desactivada");
    });
  }

  function handleEliminar() {
    if (!eliminando) return;
    const id = eliminando.id;
    startTransition(async () => {
      const result = await deletePromocionAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPromociones((prev) => prev.filter((p) => p.id !== id));
      setEliminando(null);
      toast.success("Promoción eliminada");
    });
  }

  function getDescripcionTipo(promo: PromocionConProductos): string {
    switch (promo.tipo_promocion) {
      case "descuento_porcentaje":
        return `${promo.valor_descuento}% de descuento`;
      case "descuento_fijo":
        return `${formatCurrency(promo.valor_descuento)} de descuento`;
      case "2x1":
        return "Lleva 2, paga 1";
      case "combo_precio_fijo":
        return `Combo por ${formatCurrency(promo.precio_combo ?? 0)}`;
      case "delivery_gratis":
        return `Delivery gratis${promo.pedido_minimo ? ` (mín. ${formatCurrency(promo.pedido_minimo)})` : ""}`;
      default:
        return "";
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {promociones.length === 0
            ? "Sin promociones registradas"
            : `${promociones.length} promoción${promociones.length !== 1 ? "es" : ""}`}
        </p>
        <Button className="h-10 gap-2" onClick={handleNueva}>
          <Plus className="h-4 w-4" />
          Nueva promoción
        </Button>
      </div>

      {/* Lista */}
      {promociones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">
            No hay promociones
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Crea tu primera promoción para aplicar descuentos en el POS
          </p>
          <Button className="mt-4 h-10 gap-2" onClick={handleNueva}>
            <Plus className="h-4 w-4" />
            Nueva promoción
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {promociones.map((promo) => {
            const TipoIcon = TIPO_ICONO[promo.tipo_promocion] ?? Tag;

            return (
              <div
                key={promo.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <TipoIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {promo.nombre}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <BadgeEstado promocion={promo} />
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {TIPO_PROMOCION_LABELS[promo.tipo_promocion] ??
                            promo.tipo_promocion}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={promo.activa ?? false}
                    onCheckedChange={(v) => handleToggleActiva(promo, v)}
                    disabled={isPending}
                    className="shrink-0 mt-1"
                  />
                </div>

                {/* Descripción */}
                {promo.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {promo.descripcion}
                  </p>
                )}

                {/* Descuento / Tipo */}
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                  <TipoIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {getDescripcionTipo(promo)}
                  </span>
                </div>

                {/* Fechas */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {formatFecha(promo.fecha_inicio)} —{" "}
                      {formatFecha(promo.fecha_fin)}
                    </span>
                  </div>

                  {/* Días de la semana */}
                  {promo.dias_semana && promo.dias_semana.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {promo.dias_semana
                          .sort((a, b) => a - b)
                          .map((d) => DIAS_SEMANA_LABELS[d])
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Horario */}
                  {promo.hora_inicio && promo.hora_fin && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {promo.hora_inicio.slice(0, 5)} —{" "}
                        {promo.hora_fin.slice(0, 5)}
                      </span>
                    </div>
                  )}

                  {/* Sucursales */}
                  {promo.sucursales_ids.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {promo.sucursales_ids.length} sucursal
                        {promo.sucursales_ids.length !== 1 ? "es" : ""}
                      </span>
                    </div>
                  )}

                  {/* Productos */}
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {promo.productos_ids.length > 0
                        ? `${promo.productos_ids.length} producto${promo.productos_ids.length !== 1 ? "s" : ""}`
                        : "Todos los productos"}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 gap-1.5 rounded-xl text-xs"
                    onClick={() => handleEditar(promo)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-xl text-xs text-destructive hover:text-destructive"
                    onClick={() => setEliminando(promo)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog crear/editar */}
      <FormularioPromocionDialog
        open={dialogOpen}
        onClose={handleCerrarDialog}
        promocion={editando}
        productos={productos}
        sucursales={sucursales}
        medidas={medidas}
      />

      {/* Confirm eliminar */}
      <AlertDialog
        open={!!eliminando}
        onOpenChange={(v) => !v && setEliminando(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la promoción{" "}
              <strong>{eliminando?.nombre}</strong>. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
              disabled={isPending}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
