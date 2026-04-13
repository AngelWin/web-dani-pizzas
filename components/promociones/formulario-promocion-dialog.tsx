"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InputNumerico } from "@/components/ui/input-numerico";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import {
  promocionSchema,
  type PromocionFormValues,
} from "@/lib/validations/promociones";
import {
  createPromocionAction,
  updatePromocionAction,
} from "@/actions/promociones";
import {
  TIPO_PROMOCION,
  TIPO_PROMOCION_LABELS,
  DIAS_SEMANA_LABELS,
} from "@/lib/constants";
import type { PromocionConProductos } from "@/lib/services/promociones";
import { useCurrency } from "@/hooks/use-currency";

type ProductoBasico = {
  id: string;
  nombre: string;
  categoria_id: string | null;
};
type SucursalBasica = { id: string; nombre: string };
type MedidaBasica = { id: string; nombre: string; categoria_id: string };
type NivelBasico = {
  id: string;
  nombre: string;
  descuento_porcentaje: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  promocion?: PromocionConProductos | null;
  productos: ProductoBasico[];
  sucursales: SucursalBasica[];
  medidas: MedidaBasica[];
  niveles: NivelBasico[];
};

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

function toTimeInput(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

const TIPOS_CON_VALOR = [
  TIPO_PROMOCION.DESCUENTO_PORCENTAJE,
  TIPO_PROMOCION.DESCUENTO_FIJO,
];
const TIPOS_CON_PRODUCTOS_REQUERIDOS = [
  TIPO_PROMOCION.DOS_POR_UNO,
  TIPO_PROMOCION.COMBO_PRECIO_FIJO,
];

export function FormularioPromocionDialog({
  open,
  onClose,
  promocion,
  productos,
  sucursales,
  medidas,
  niveles,
}: Props) {
  const esEdicion = !!promocion;
  const { simbolo } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoBasico[]
  >([]);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<
    SucursalBasica[]
  >([]);
  const [medidasSeleccionadas, setMedidasSeleccionadas] = useState<
    MedidaBasica[]
  >([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarHorario, setMostrarHorario] = useState(false);

  const form = useForm<PromocionFormValues>({
    resolver: zodResolver(promocionSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      tipo_promocion: TIPO_PROMOCION.DESCUENTO_PORCENTAJE,
      valor_descuento: 10,
      fecha_inicio: "",
      fecha_fin: "",
      activa: true,
      dias_semana: null,
      hora_inicio: null,
      hora_fin: null,
      pedido_minimo: null,
      precio_combo: null,
      productos_ids: [],
      sucursales_ids: [],
      medidas_ids: [],
      tipos_pedido: null,
      permite_modificaciones: true,
      nivel_membresia_id: null,
    },
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (open && promocion) {
      form.reset({
        nombre: promocion.nombre,
        descripcion: promocion.descripcion ?? "",
        tipo_promocion: promocion.tipo_promocion,
        valor_descuento: promocion.valor_descuento,
        fecha_inicio: toDatetimeLocal(promocion.fecha_inicio),
        fecha_fin: toDatetimeLocal(promocion.fecha_fin),
        activa: promocion.activa ?? true,
        dias_semana: promocion.dias_semana,
        hora_inicio: toTimeInput(promocion.hora_inicio),
        hora_fin: toTimeInput(promocion.hora_fin),
        pedido_minimo: promocion.pedido_minimo,
        precio_combo: promocion.precio_combo,
        productos_ids: promocion.productos_ids,
        sucursales_ids: promocion.sucursales_ids,
        medidas_ids: promocion.medidas_ids,
        tipos_pedido: promocion.tipos_pedido as
          | ("local" | "delivery" | "para_llevar")[]
          | null,
        permite_modificaciones: promocion.permite_modificaciones ?? true,
        nivel_membresia_id: promocion.nivel_membresia_id ?? null,
      });
      setProductosSeleccionados(
        productos.filter((p) => promocion.productos_ids.includes(p.id)),
      );
      setSucursalesSeleccionadas(
        sucursales.filter((s) => promocion.sucursales_ids.includes(s.id)),
      );
      setMedidasSeleccionadas(
        medidas.filter((m) => promocion.medidas_ids.includes(m.id)),
      );
      setMostrarHorario(!!promocion.hora_inicio);
    } else if (open) {
      form.reset({
        nombre: "",
        descripcion: "",
        tipo_promocion: TIPO_PROMOCION.DESCUENTO_PORCENTAJE,
        valor_descuento: 10,
        fecha_inicio: "",
        fecha_fin: "",
        activa: true,
        dias_semana: null,
        hora_inicio: null,
        hora_fin: null,
        pedido_minimo: null,
        precio_combo: null,
        productos_ids: [],
        sucursales_ids: [],
      });
      setProductosSeleccionados([]);
      setSucursalesSeleccionadas([]);
      setMedidasSeleccionadas([]);
      setMostrarHorario(false);
    }
    setBusquedaProducto("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, promocion]);

  // Sincronizar selecciones → form
  useEffect(() => {
    form.setValue(
      "productos_ids",
      productosSeleccionados.map((p) => p.id),
    );
  }, [productosSeleccionados, form]);

  useEffect(() => {
    form.setValue(
      "sucursales_ids",
      sucursalesSeleccionadas.map((s) => s.id),
    );
  }, [sucursalesSeleccionadas, form]);

  useEffect(() => {
    form.setValue(
      "medidas_ids",
      medidasSeleccionadas.map((m) => m.id),
    );
  }, [medidasSeleccionadas, form]);

  const tipoPromocion = form.watch("tipo_promocion");
  const diasSemana = form.watch("dias_semana") ?? [];
  const nombreWatch = form.watch("nombre");
  const fechaInicioWatch = form.watch("fecha_inicio");
  const fechaFinWatch = form.watch("fecha_fin");
  const valorDescuentoWatch = form.watch("valor_descuento");
  const precioComboWatch = form.watch("precio_combo");
  const pedidoMinimoWatch = form.watch("pedido_minimo");

  // Botón crear deshabilitado hasta que los campos requeridos estén llenos
  const crearDeshabilitado = (() => {
    if (isSubmitting) return true;
    if (!nombreWatch?.trim()) return true;
    if (!fechaInicioWatch || !fechaFinWatch) return true;

    switch (tipoPromocion) {
      case "descuento_porcentaje":
      case "descuento_fijo":
        if (!valorDescuentoWatch || valorDescuentoWatch <= 0) return true;
        break;
      case "2x1":
        if (productosSeleccionados.length === 0) return true;
        break;
      case "combo_precio_fijo":
        if (!precioComboWatch || precioComboWatch <= 0) return true;
        // Combo válido: 2+ productos, o 1 producto con 2+ medidas
        if (
          productosSeleccionados.length < 2 &&
          medidasSeleccionadas.length < 2
        )
          return true;
        break;
      case "delivery_gratis":
        if (!pedidoMinimoWatch || pedidoMinimoWatch <= 0) return true;
        break;
    }
    return false;
  })();

  function toggleDia(dia: number) {
    const actual = diasSemana;
    const nuevo = actual.includes(dia)
      ? actual.filter((d) => d !== dia)
      : [...actual, dia];
    form.setValue("dias_semana", nuevo.length > 0 ? nuevo : null);
  }

  function toggleMedida(medida: MedidaBasica) {
    setMedidasSeleccionadas((prev) =>
      prev.some((m) => m.id === medida.id)
        ? prev.filter((m) => m.id !== medida.id)
        : [...prev, medida],
    );
  }

  function toggleSucursal(sucursal: SucursalBasica) {
    setSucursalesSeleccionadas((prev) =>
      prev.some((s) => s.id === sucursal.id)
        ? prev.filter((s) => s.id !== sucursal.id)
        : [...prev, sucursal],
    );
  }

  const productosFiltrados = useMemo(
    () =>
      productos.filter(
        (p) =>
          !productosSeleccionados.some((s) => s.id === p.id) &&
          p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()),
      ),
    [productos, productosSeleccionados, busquedaProducto],
  );

  // Medidas filtradas por las categorías de los productos seleccionados
  const medidasFiltradas = useMemo(() => {
    if (productosSeleccionados.length === 0) return [];
    const categoriasIds = new Set(
      productosSeleccionados
        .map((p) => p.categoria_id)
        .filter(Boolean) as string[],
    );
    return medidas.filter((m) => categoriasIds.has(m.categoria_id));
  }, [productosSeleccionados, medidas]);

  // Limpiar medidas que ya no corresponden a los productos seleccionados
  useEffect(() => {
    if (medidasFiltradas.length === 0 && medidasSeleccionadas.length > 0) {
      setMedidasSeleccionadas([]);
    } else if (medidasSeleccionadas.length > 0) {
      const idsValidos = new Set(medidasFiltradas.map((m) => m.id));
      const filtradas = medidasSeleccionadas.filter((m) =>
        idsValidos.has(m.id),
      );
      if (filtradas.length !== medidasSeleccionadas.length) {
        setMedidasSeleccionadas(filtradas);
      }
    }
  }, [medidasFiltradas, medidasSeleccionadas]);

  async function onSubmit(data: PromocionFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        fecha_inicio: new Date(data.fecha_inicio).toISOString(),
        fecha_fin: new Date(data.fecha_fin).toISOString(),
        hora_inicio: mostrarHorario ? data.hora_inicio : null,
        hora_fin: mostrarHorario ? data.hora_fin : null,
      };

      const result = esEdicion
        ? await updatePromocionAction(promocion!.id, payload)
        : await createPromocionAction(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(esEdicion ? "Promoción actualizada" : "Promoción creada");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  // Labels contextuales para productos
  const productosLabel = TIPOS_CON_PRODUCTOS_REQUERIDOS.includes(
    tipoPromocion as (typeof TIPOS_CON_PRODUCTOS_REQUERIDOS)[number],
  )
    ? tipoPromocion === TIPO_PROMOCION.DOS_POR_UNO
      ? "Productos elegibles para el 2x1"
      : "Productos del combo"
    : "Productos incluidos (opcional)";

  const productosHint = TIPOS_CON_PRODUCTOS_REQUERIDOS.includes(
    tipoPromocion as (typeof TIPOS_CON_PRODUCTOS_REQUERIDOS)[number],
  )
    ? tipoPromocion === TIPO_PROMOCION.DOS_POR_UNO
      ? "Selecciona los productos que participan en el 2x1"
      : "Selecciona todos los productos que forman el combo"
    : "Si no seleccionas, el descuento aplica al subtotal completo";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar promoción" : "Nueva promoción"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const first = Object.values(errors)[0];
              toast.error(
                String(first?.message ?? "Revisa los campos del formulario"),
              );
            })}
            className="space-y-4"
          >
            {/* ── Sección 1: Básico ── */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 2x1 en pizzas medianas"
                      className="h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* ── Sección 2: Tipo de promoción ── */}
            <FormField
              control={form.control}
              name="tipo_promocion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de promoción</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_PROMOCION_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionales por tipo */}
            {TIPOS_CON_VALOR.includes(
              tipoPromocion as (typeof TIPOS_CON_VALOR)[number],
            ) && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="valor_descuento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tipoPromocion === TIPO_PROMOCION.DESCUENTO_PORCENTAJE
                          ? "Porcentaje (%)"
                          : `Monto (${simbolo})`}
                      </FormLabel>
                      <FormControl>
                        <InputNumerico
                          variante={
                            tipoPromocion ===
                            TIPO_PROMOCION.DESCUENTO_PORCENTAJE
                              ? "porcentaje"
                              : "precio"
                          }
                          min={0.01}
                          className="h-12"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {tipoPromocion === TIPO_PROMOCION.DESCUENTO_FIJO && (
                  <FormField
                    control={form.control}
                    name="pedido_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pedido mínimo ({simbolo})</FormLabel>
                        <FormControl>
                          <InputNumerico
                            variante="precio"
                            placeholder="Opcional"
                            className="h-12"
                            value={field.value}
                            onChange={field.onChange}
                            allowNull
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {tipoPromocion === TIPO_PROMOCION.COMBO_PRECIO_FIJO && (
              <FormField
                control={form.control}
                name="precio_combo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio del combo ({simbolo})</FormLabel>
                    <FormControl>
                      <InputNumerico
                        variante="precio"
                        min={0.01}
                        className="h-12"
                        value={field.value}
                        onChange={field.onChange}
                        allowNull
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tipoPromocion === TIPO_PROMOCION.DELIVERY_GRATIS && (
              <FormField
                control={form.control}
                name="pedido_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido mínimo ({simbolo})</FormLabel>
                    <FormControl>
                      <InputNumerico
                        variante="precio"
                        min={0.01}
                        className="h-12"
                        value={field.value}
                        onChange={field.onChange}
                        allowNull
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* ── Sección 3: Vigencia ── */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fecha_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de fin</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Sección 4: Días de la semana ── */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Días de la semana</p>
              <p className="text-xs text-muted-foreground">
                {diasSemana.length === 0
                  ? "Aplica todos los días"
                  : "Solo los días seleccionados"}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (diasSemana.length === 7) {
                      form.setValue("dias_semana", null);
                    } else {
                      form.setValue("dias_semana", [0, 1, 2, 3, 4, 5, 6]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    diasSemana.length === 0 || diasSemana.length === 7
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  Todos
                </button>
                {DIAS_SEMANA_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDia(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      diasSemana.includes(i)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Sección 5: Horario ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Restringir por horario</p>
                  <p className="text-xs text-muted-foreground">
                    Happy hour u horario especial
                  </p>
                </div>
                <Switch
                  checked={mostrarHorario}
                  onCheckedChange={(v) => {
                    setMostrarHorario(v);
                    if (!v) {
                      form.setValue("hora_inicio", null);
                      form.setValue("hora_fin", null);
                    }
                  }}
                />
              </div>
              {mostrarHorario && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="hora_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora inicio</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="h-12"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hora_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora fin</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="h-12"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* ── Sección 6: Sucursales ── */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Sucursales</p>
              <p className="text-xs text-muted-foreground">
                {sucursalesSeleccionadas.length === 0
                  ? "Aplica a todas las sucursales"
                  : `Aplica solo a ${sucursalesSeleccionadas.length} sucursal${sucursalesSeleccionadas.length !== 1 ? "es" : ""}`}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {sucursales.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSucursal(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      sucursalesSeleccionadas.some((sel) => sel.id === s.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Sección 7: Productos ── */}
            {tipoPromocion !== TIPO_PROMOCION.DELIVERY_GRATIS && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{productosLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {productosHint}
                  </p>
                </div>

                {productosSeleccionados.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {productosSeleccionados.map((p) => (
                      <Badge
                        key={p.id}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {p.nombre}
                        <button
                          type="button"
                          onClick={() =>
                            setProductosSeleccionados((prev) =>
                              prev.filter((x) => x.id !== p.id),
                            )
                          }
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <Input
                  placeholder="Buscar producto para agregar..."
                  className="h-10"
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                />

                {busquedaProducto && productosFiltrados.length > 0 && (
                  <div className="rounded-xl border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {productosFiltrados.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          setProductosSeleccionados((prev) => [...prev, p]);
                          setBusquedaProducto("");
                        }}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {busquedaProducto && productosFiltrados.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">
                    Sin resultados para &quot;{busquedaProducto}&quot;
                  </p>
                )}
                <FormMessage />
              </div>
            )}

            {/* ── Sección 8: Medidas/Tamaños (filtradas por productos) ── */}
            {tipoPromocion !== TIPO_PROMOCION.DELIVERY_GRATIS &&
              medidasFiltradas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Tamaños/Medidas (opcional)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {medidasSeleccionadas.length === 0
                      ? "Aplica a todos los tamaños de los productos seleccionados"
                      : `Solo para: ${medidasSeleccionadas.map((m) => m.nombre).join(", ")}`}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {medidasFiltradas.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMedida(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          medidasSeleccionadas.some((sel) => sel.id === m.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {m.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* ── Tipos de pedido aplicables ── */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tipos de pedido</p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const tp = form.watch("tipos_pedido");
                  if (!tp || tp.length === 0)
                    return "Aplica a todos los tipos de pedido";
                  return `Solo para: ${tp.map((t) => (t === "local" ? "En local" : t === "delivery" ? "Delivery" : "Recojo")).join(", ")}`;
                })()}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    { value: "local", label: "En local" },
                    { value: "delivery", label: "Delivery" },
                    { value: "para_llevar", label: "Recojo" },
                  ] as const
                ).map((tp) => {
                  const tiposPedido = form.watch("tipos_pedido") ?? [];
                  const activo = tiposPedido.includes(tp.value);
                  return (
                    <button
                      key={tp.value}
                      type="button"
                      onClick={() => {
                        const actual = form.getValues("tipos_pedido") ?? [];
                        const nuevo = activo
                          ? actual.filter((v) => v !== tp.value)
                          : [...actual, tp.value];
                        form.setValue(
                          "tipos_pedido",
                          nuevo.length > 0 ? nuevo : null,
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        activo
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {tp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Permite modificaciones ── */}
            <FormField
              control={form.control}
              name="permite_modificaciones"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Permite modificaciones
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {field.value
                        ? "El cajero puede elegir sabores, extras y medida"
                        : "Productos fijos — se agregan tal cual al carrito"}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Nivel de membresía ── */}
            {niveles.length > 0 && (
              <FormField
                control={form.control}
                name="nivel_membresia_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclusivo para miembros (opcional)</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "__todos__" ? null : v)
                      }
                      value={field.value ?? "__todos__"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Público para todos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__todos__">
                          Público para todos
                        </SelectItem>
                        {niveles.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            Exclusivo: {n.nombre}
                            {n.descuento_porcentaje
                              ? ` (${n.descuento_porcentaje}%)`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Activa */}
            <FormField
              control={form.control}
              name="activa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Activa
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Visible en el POS si las fechas son vigentes
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1"
                disabled={crearDeshabilitado}
              >
                {isSubmitting
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear promoción"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
