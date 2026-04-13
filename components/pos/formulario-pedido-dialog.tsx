"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Separator } from "@/components/ui/separator";
import { TIPO_PEDIDO, DELIVERY_METHOD } from "@/lib/constants";
import type { DeliveryServicio } from "@/lib/services/delivery-servicios";
import {
  crearOrdenSchema,
  type CrearOrdenFormValues,
} from "@/lib/validations/ordenes";
import { toast } from "sonner";
import { Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BuscadorCliente } from "./buscador-cliente";
import { SelectorMesa } from "./selector-mesa";
import type { Mesa } from "@/lib/services/mesas";
import type { useCarrito } from "@/hooks/use-carrito";
import type { Profile } from "@/lib/services/ventas";
import type { ClienteConMembresia } from "@/lib/services/clientes";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import {
  calcularDescuento,
  esPromocionAplicableAlCarrito,
  esPromocionVigente,
  getDescripcionPromocion,
  promoAplicaATipoPedido,
  promoAccesibleParaCliente,
  type ItemCarrito,
} from "@/lib/promociones-utils";
import { useCurrency } from "@/hooks/use-currency";
import { calcularDescuentoNivel } from "@/lib/membresias-utils";

type Repartidor = Pick<Profile, "id" | "nombre" | "apellido_paterno">;

type Props = {
  open: boolean;
  onClose: () => void;
  carrito: ReturnType<typeof useCarrito>;
  repartidores: Repartidor[];
  deliveryServicios: DeliveryServicio[];
  sucursalId: string;
  rol: string | null;
  onSubmit: (data: CrearOrdenFormValues) => Promise<void>;
  isSubmitting: boolean;
  promociones: PromocionActivaPOS[];
  mesas: Mesa[];
};

export function FormularioPedidoDialog({
  open,
  onClose,
  carrito,
  repartidores,
  deliveryServicios,
  sucursalId,
  rol,
  onSubmit,
  isSubmitting,
  promociones,
  mesas,
}: Props) {
  const esMesero = rol === "mesero";
  const { simbolo, formatCurrency } = useCurrency();
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteConMembresia | null>(null);
  const [promocionSeleccionada, setPromocionSeleccionada] =
    useState<PromocionActivaPOS | null>(null);

  const form = useForm<CrearOrdenFormValues>({
    resolver: zodResolver(crearOrdenSchema),
    defaultValues: {
      sucursal_id: sucursalId,
      cliente_id: null,
      tipo_pedido: TIPO_PEDIDO.EN_LOCAL,
      mesa_id: null,
      mesa_referencia: "",
      notas: "",
      delivery_method: DELIVERY_METHOD.PROPIO,
      repartidor_id: null,
      third_party_name: null,
      delivery_fee:
        deliveryServicios.find((s) => s.tipo === "propio")?.precio_base ?? 0,
      delivery_address: "",
      delivery_referencia: "",
      items: [],
      promocion_id: null,
      descuento: 0,
    },
  });

  const tipoPedido = form.watch("tipo_pedido");
  const deliveryMethod = form.watch("delivery_method");
  const deliveryAddress = form.watch("delivery_address");
  const thirdPartyName = form.watch("third_party_name");
  const deliveryFee =
    tipoPedido === TIPO_PEDIDO.DELIVERY ? (form.watch("delivery_fee") ?? 0) : 0;

  const confirmarDeshabilitado =
    isSubmitting ||
    (tipoPedido === TIPO_PEDIDO.DELIVERY &&
      (!deliveryAddress || !thirdPartyName));

  // Resetear form al abrir el dialog (incluyendo items del carrito)
  useEffect(() => {
    if (open) {
      form.reset({
        sucursal_id: sucursalId,
        cliente_id: null,
        tipo_pedido: TIPO_PEDIDO.EN_LOCAL,
        mesa_id: null,
        mesa_referencia: "",
        notas: "",
        delivery_method: DELIVERY_METHOD.PROPIO,
        repartidor_id: null,
        third_party_name: null,
        delivery_fee:
          deliveryServicios.find((s) => s.tipo === "propio")?.precio_base ?? 0,
        delivery_address: "",
        delivery_referencia: "",
        items: [
          ...carrito.items.map((i) => ({
            producto_id: i.producto_id,
            variante_id: i.variante_id,
            cantidad: i.cantidad,
            producto_nombre: i.producto_nombre,
            variante_nombre: i.variante_nombre,
            precio_unitario: i.producto_precio,
            subtotal: i.subtotal,
            sabores: i.sabores ?? null,
            extras: i.extras ?? null,
            acompanante: i.acompanante ?? null,
          })),
          ...carrito.promoItems.flatMap((p) =>
            p.items.map((item, idx) => ({
              producto_id: item.producto_id,
              variante_id: item.variante_id,
              cantidad: 1,
              producto_nombre: item.producto_nombre,
              variante_nombre: item.variante_nombre,
              // Primer item lleva el precio_promo completo, los demás 0
              precio_unitario: idx === 0 ? p.precio_promo : 0,
              subtotal: idx === 0 ? p.precio_promo : 0,
              sabores: item.sabores ?? null,
              extras: item.extras ?? null,
              acompanante: item.acompanante ?? null,
            })),
          ),
        ],
        promocion_id: null,
        descuento: carrito.totalDescuentoPromos,
      });
      setClienteSeleccionado(null);
      setPromocionSeleccionada(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sincronizar sucursal seleccionada → form
  useEffect(() => {
    form.setValue("sucursal_id", sucursalId);
  }, [sucursalId, form]);

  // Sincronizar cliente seleccionado → form
  function handleClienteSeleccionado(cliente: ClienteConMembresia | null) {
    setClienteSeleccionado(cliente);
    form.setValue("cliente_id", cliente?.id ?? null);
  }

  // Sincronizar items del carrito (normales + items de promos aplanados)
  useEffect(() => {
    const itemsNormales = carrito.items.map((i) => ({
      producto_id: i.producto_id,
      variante_id: i.variante_id,
      cantidad: i.cantidad,
      producto_nombre: i.producto_nombre,
      variante_nombre: i.variante_nombre,
      precio_unitario: i.producto_precio,
      subtotal: i.subtotal,
      sabores: i.sabores ?? null,
      extras: i.extras ?? null,
      acompanante: i.acompanante ?? null,
    }));

    // Items de promos aplanados como items individuales
    // Primer item lleva el precio_promo completo, los demás 0
    const itemsPromo = carrito.promoItems.flatMap((p) =>
      p.items.map((item, idx) => ({
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        cantidad: 1,
        producto_nombre: item.producto_nombre,
        variante_nombre: item.variante_nombre,
        precio_unitario: idx === 0 ? p.precio_promo : 0,
        subtotal: idx === 0 ? p.precio_promo : 0,
        sabores: item.sabores ?? null,
        extras: item.extras ?? null,
        acompanante: item.acompanante ?? null,
      })),
    );

    form.setValue("items", [...itemsNormales, ...itemsPromo]);
  }, [carrito.items, carrito.promoItems, form]);

  // Filtrar promos por tipo de pedido, nivel de membresía, y excluir auto-aplicadas
  const nivelClienteId =
    clienteSeleccionado?.membresias?.activa &&
    clienteSeleccionado?.membresias?.nivel
      ? clienteSeleccionado.membresias.nivel.id
      : null;

  const promosFiltradas = useMemo(
    () =>
      promociones.filter(
        (p) =>
          promoAplicaATipoPedido(p, tipoPedido) &&
          promoAccesibleParaCliente(p, nivelClienteId) &&
          // Excluir promos que ya se aplican automáticamente por item (R17.2)
          p.tipo_promocion !== "descuento_porcentaje" &&
          p.tipo_promocion !== "descuento_fijo" &&
          // Excluir combos (se agregan desde el catálogo del POS, no desde aquí)
          p.tipo_promocion !== "combo_precio_fijo" &&
          p.tipo_promocion !== "combo_precio_producto",
      ),
    [promociones, tipoPedido, nivelClienteId],
  );

  useEffect(() => {
    if (
      promocionSeleccionada &&
      !promoAplicaATipoPedido(promocionSeleccionada, tipoPedido)
    ) {
      setPromocionSeleccionada(null);
    }
  }, [tipoPedido, promocionSeleccionada]);

  // Limpiar mesa al cambiar tipo de pedido
  useEffect(() => {
    if (tipoPedido !== TIPO_PEDIDO.EN_LOCAL) {
      form.setValue("mesa_id", null);
      form.setValue("mesa_referencia", "");
    }
  }, [tipoPedido, form]);

  // Auto-seleccionar servicio de delivery si solo hay 1 para el método
  // Se dispara al cambiar método O al cambiar tipo de pedido a delivery
  useEffect(() => {
    if (tipoPedido !== TIPO_PEDIDO.DELIVERY) return;

    const servicios = deliveryServicios.filter(
      (s) => s.tipo === deliveryMethod,
    );
    if (servicios.length === 1) {
      form.setValue("third_party_name", servicios[0].nombre);
      form.setValue("delivery_fee", servicios[0].precio_base);
    } else {
      form.setValue("third_party_name", null);
      form.setValue("delivery_fee", 0);
    }
  }, [tipoPedido, deliveryMethod, deliveryServicios, form]);

  // Sincronizar promoción seleccionada → form (descuento)
  // Si la promo restringe a 1 solo tipo de pedido, auto-seleccionar
  useEffect(() => {
    if (!promocionSeleccionada) return;
    const tp = promocionSeleccionada.tipos_pedido;
    if (tp && tp.length === 1 && form.getValues("tipo_pedido") !== tp[0]) {
      form.setValue(
        "tipo_pedido",
        tp[0] as "local" | "delivery" | "para_llevar",
      );
    }
  }, [promocionSeleccionada, form]);

  const tipoPedidoBloqueado = promocionSeleccionada?.tipos_pedido?.length === 1;

  // Items del carrito en formato para cálculo de descuento
  const itemsParaDescuento: ItemCarrito[] = carrito.items.map((i) => ({
    producto_id: i.producto_id,
    variante_id: i.variante_id,
    medida_id: i.medida_id,
    precio_unitario: i.producto_precio,
    cantidad: i.cantidad,
    subtotal: i.subtotal,
  }));

  // Descuento de membresía del cliente (automático)
  const descuentoMembresia = calcularDescuentoNivel(
    carrito.subtotal,
    clienteSeleccionado?.membresias?.nivel ?? null,
  );

  useEffect(() => {
    const descuentoPromoCarrito = carrito.totalDescuentoPromos;
    let descuentoTotal = descuentoPromoCarrito + descuentoMembresia;

    if (!promocionSeleccionada) {
      form.setValue("promocion_id", null);
    } else {
      const montoDescuento = calcularDescuento(
        promocionSeleccionada,
        itemsParaDescuento,
        carrito.subtotal,
        deliveryFee,
      );
      form.setValue("promocion_id", promocionSeleccionada.id);
      descuentoTotal += montoDescuento;
    }

    form.setValue("descuento", descuentoTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    promocionSeleccionada,
    carrito.subtotal,
    carrito.totalDescuentoPromos,
    descuentoMembresia,
    deliveryFee,
    form,
  ]);

  // E1: Limpiar promo si carrito cambia y ya no aplica
  useEffect(() => {
    if (!promocionSeleccionada) return;
    const sigueAplicando = esPromocionAplicableAlCarrito(
      promocionSeleccionada,
      itemsParaDescuento,
      carrito.subtotal,
      deliveryFee,
    );
    if (!sigueAplicando) {
      setPromocionSeleccionada(null);
      toast.info("La promoción ya no aplica al carrito actual");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito.items.length]);

  // Limpiar al cerrar
  function handleClose() {
    setClienteSeleccionado(null);
    setPromocionSeleccionada(null);
    form.reset();
    onClose();
  }

  // Garantizar que delivery_fee sea 0 para pedidos no-delivery al enviar
  async function handleSubmit(data: CrearOrdenFormValues) {
    // E3: Validar que la promo sigue vigente al momento de confirmar
    if (promocionSeleccionada && !esPromocionVigente(promocionSeleccionada)) {
      toast.error("La promoción ha vencido. Se ha removido del pedido.");
      setPromocionSeleccionada(null);
      return;
    }

    await onSubmit({
      ...data,
      delivery_fee:
        data.tipo_pedido === TIPO_PEDIDO.DELIVERY
          ? (data.delivery_fee ?? 0)
          : 0,
    });
  }

  const descuentoPromo = promocionSeleccionada
    ? calcularDescuento(
        promocionSeleccionada,
        itemsParaDescuento,
        carrito.subtotal,
        deliveryFee,
      )
    : 0;
  const descuentoTotal = descuentoPromo + descuentoMembresia;
  const esDeliveryGratis =
    promocionSeleccionada?.tipo_promocion === "delivery_gratis";
  const total = esDeliveryGratis
    ? Math.max(
        0,
        carrito.subtotal -
          descuentoMembresia +
          Math.max(0, deliveryFee - descuentoPromo),
      )
    : Math.max(0, carrito.subtotal - descuentoTotal + deliveryFee);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar pedido</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              const firstError = Object.values(errors)[0];
              const msg =
                firstError?.message ??
                (firstError as { root?: { message?: string } })?.root
                  ?.message ??
                "Revisa los campos del formulario";
              toast.error(String(msg));
            })}
            className="space-y-4"
          >
            {/* ── Identificación de cliente ── */}
            <div className="rounded-xl border p-3">
              <BuscadorCliente
                clienteSeleccionado={clienteSeleccionado}
                onClienteSeleccionado={handleClienteSeleccionado}
              />
            </div>

            {/* ── Resumen del carrito ── */}
            <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Productos
              </p>
              {carrito.items.map((item) => (
                <div
                  key={item.key}
                  className="flex justify-between text-sm gap-2"
                >
                  <span className="flex-1 min-w-0">
                    <span>
                      {item.cantidad}× {item.producto_nombre}
                      {item.variante_nombre ? ` (${item.variante_nombre})` : ""}
                    </span>
                    {item.sabores && item.sabores.length > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        {item.sabores.map((s) => s.sabor_nombre).join(" · ")}
                      </span>
                    )}
                    {item.acompanante && (
                      <span className="block text-xs text-amber-600 dark:text-amber-400 font-medium">
                        + {item.acompanante.variante_nombre}:{" "}
                        {item.acompanante.sabor_nombre}
                      </span>
                    )}
                  </span>
                  {item.descuento_unitario > 0 ? (
                    <span className="shrink-0 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(item.producto_precio * item.cantidad)}
                      </span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-medium shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* ── Tipo de pedido ── */}
            <FormField
              control={form.control}
              name="tipo_pedido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de pedido</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={tipoPedidoBloqueado}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TIPO_PEDIDO.EN_LOCAL}>
                        En local
                      </SelectItem>
                      <SelectItem value={TIPO_PEDIDO.PARA_LLEVAR}>
                        Recojo
                      </SelectItem>
                      {!esMesero && (
                        <SelectItem value={TIPO_PEDIDO.DELIVERY}>
                          Delivery
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {tipoPedidoBloqueado && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      La promoción seleccionada solo aplica para este tipo de
                      pedido
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Mesa / referencia ── */}
            {tipoPedido === TIPO_PEDIDO.EN_LOCAL && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Mesa</p>
                {mesas.length > 0 ? (
                  <SelectorMesa
                    mesas={mesas}
                    mesaSeleccionadaId={form.watch("mesa_id") ?? null}
                    onSeleccionar={(mesa) => {
                      form.setValue("mesa_id", mesa?.id ?? null);
                      form.setValue(
                        "mesa_referencia",
                        mesa ? `Mesa ${mesa.numero}` : "",
                      );
                    }}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="mesa_referencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Ej: Mesa 3"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* ── Datos de delivery ── */}
            {tipoPedido === TIPO_PEDIDO.DELIVERY && (
              <div className="space-y-3 rounded-xl border p-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Datos de delivery
                </p>

                <FormField
                  control={form.control}
                  name="delivery_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? DELIVERY_METHOD.PROPIO}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DELIVERY_METHOD.PROPIO}>
                            Propio
                          </SelectItem>
                          <SelectItem value={DELIVERY_METHOD.TERCERO}>
                            Tercero (Rappi, etc.)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {deliveryMethod === DELIVERY_METHOD.PROPIO && (
                  <FormField
                    control={form.control}
                    name="third_party_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servicio de delivery</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const servicio = deliveryServicios.find(
                              (s) => s.tipo === "propio" && s.nombre === value,
                            );
                            if (servicio) {
                              form.setValue(
                                "delivery_fee",
                                servicio.precio_base,
                              );
                            }
                          }}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona servicio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deliveryServicios
                              .filter((s) => s.tipo === "propio")
                              .map((s) => (
                                <SelectItem key={s.id} value={s.nombre}>
                                  {s.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {deliveryMethod === DELIVERY_METHOD.TERCERO && (
                  <FormField
                    control={form.control}
                    name="third_party_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servicio de delivery</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const servicio = deliveryServicios.find(
                              (s) => s.tipo === "tercero" && s.nombre === value,
                            );
                            if (servicio) {
                              form.setValue(
                                "delivery_fee",
                                servicio.precio_base,
                              );
                            }
                          }}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona servicio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deliveryServicios
                              .filter((s) => s.tipo === "tercero")
                              .map((s) => (
                                <SelectItem key={s.id} value={s.nombre}>
                                  {s.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="delivery_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo de delivery ({simbolo})</FormLabel>
                      <FormControl>
                        <InputNumerico
                          variante="precio"
                          className="h-12"
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección de entrega</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Calle, número, distrito..."
                          className="h-12"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Frente al parque"
                          className="h-12"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Notas generales ── */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instrucciones especiales..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Promoción ── */}
            {promosFiltradas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Promoción (opcional)</p>
                  {!promocionSeleccionada &&
                    promosFiltradas.some((p) =>
                      esPromocionAplicableAlCarrito(
                        p,
                        itemsParaDescuento,
                        carrito.subtotal,
                        deliveryFee,
                      ),
                    ) && (
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 animate-pulse">
                        Promos disponibles
                      </Badge>
                    )}
                </div>
                {promocionSeleccionada ? (
                  <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          {promocionSeleccionada.nombre}
                        </p>
                        <p className="text-xs text-green-600/80 dark:text-green-500">
                          {getDescripcionPromocion(
                            promocionSeleccionada,
                            formatCurrency,
                          )}
                        </p>
                        {descuentoPromo > 0 && (
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mt-0.5">
                            Ahorras {formatCurrency(descuentoPromo)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromocionSeleccionada(null)}
                      className="rounded-full p-1 hover:bg-green-200/50 dark:hover:bg-green-900/50"
                    >
                      <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {promosFiltradas.map((p) => {
                      const aplicable = esPromocionAplicableAlCarrito(
                        p,
                        itemsParaDescuento,
                        carrito.subtotal,
                        deliveryFee,
                      );
                      const desc = getDescripcionPromocion(p, formatCurrency);
                      const ahorro = aplicable
                        ? calcularDescuento(
                            p,
                            itemsParaDescuento,
                            carrito.subtotal,
                            deliveryFee,
                          )
                        : 0;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!aplicable}
                          onClick={() => setPromocionSeleccionada(p)}
                          className={`w-full text-left rounded-xl border p-2.5 transition-colors ${
                            aplicable
                              ? "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                              : "border-border/50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {p.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {desc}
                              </p>
                            </div>
                            {aplicable && ahorro > 0 && (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-green-300 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px]"
                              >
                                -{formatCurrency(ahorro)}
                              </Badge>
                            )}
                            {!aplicable && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px]"
                              >
                                No aplica
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Total ── */}
            <div className="rounded-xl border p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(carrito.subtotal)}</span>
              </div>
              {descuentoPromo > 0 && !esDeliveryGratis && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Descuento ({promocionSeleccionada?.nombre})</span>
                  <span>- {formatCurrency(descuentoPromo)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  {esDeliveryGratis ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      <span className="line-through text-muted-foreground mr-1.5">
                        {formatCurrency(deliveryFee)}
                      </span>
                      Gratis
                    </span>
                  ) : (
                    <span>{formatCurrency(deliveryFee)}</span>
                  )}
                </div>
              )}
              {descuentoMembresia > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>
                    Membresía ({clienteSeleccionado?.membresias?.nivel?.nombre})
                  </span>
                  <span>- {formatCurrency(descuentoMembresia)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 mt-1 font-bold text-base">
                <span>Total del pedido</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1"
                disabled={confirmarDeshabilitado}
              >
                {isSubmitting ? "Registrando..." : "Confirmar pedido"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
