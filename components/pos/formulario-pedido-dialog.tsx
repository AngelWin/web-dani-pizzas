"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  TIPO_PEDIDO,
  DELIVERY_METHOD,
  THIRD_PARTY_SERVICES,
} from "@/lib/constants";
import {
  crearOrdenSchema,
  type CrearOrdenFormValues,
} from "@/lib/validations/ordenes";
import { BuscadorCliente } from "./buscador-cliente";
import type { useCarrito } from "@/hooks/use-carrito";
import type { Profile } from "@/lib/services/ventas";
import type { ClienteConMembresia } from "@/lib/services/clientes";

type Repartidor = Pick<Profile, "id" | "nombre" | "apellido_paterno">;

type Props = {
  open: boolean;
  onClose: () => void;
  carrito: ReturnType<typeof useCarrito>;
  repartidores: Repartidor[];
  deliveryFees: { propio: number; tercero: number };
  rol: string | null;
  onSubmit: (data: CrearOrdenFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function FormularioPedidoDialog({
  open,
  onClose,
  carrito,
  repartidores,
  deliveryFees,
  rol,
  onSubmit,
  isSubmitting,
}: Props) {
  const esMesero = rol === "mesero";
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteConMembresia | null>(null);

  const form = useForm<CrearOrdenFormValues>({
    resolver: zodResolver(crearOrdenSchema),
    defaultValues: {
      cliente_id: null,
      tipo_pedido: TIPO_PEDIDO.EN_LOCAL,
      mesa_referencia: "",
      notas: "",
      delivery_method: DELIVERY_METHOD.PROPIO,
      repartidor_id: null,
      third_party_name: null,
      delivery_fee: deliveryFees.propio,
      delivery_address: "",
      delivery_referencia: "",
      items: [],
    },
  });

  const tipoPedido = form.watch("tipo_pedido");
  const deliveryMethod = form.watch("delivery_method");

  // Sincronizar cliente seleccionado → form
  function handleClienteSeleccionado(cliente: ClienteConMembresia | null) {
    setClienteSeleccionado(cliente);
    form.setValue("cliente_id", cliente?.id ?? null);
  }

  // Sincronizar items del carrito
  useEffect(() => {
    form.setValue(
      "items",
      carrito.items.map((i) => ({
        producto_id: i.producto_id,
        variante_id: i.variante_id,
        cantidad: i.cantidad,
        producto_nombre: i.producto_nombre,
        variante_nombre: i.variante_nombre,
        precio_unitario: i.producto_precio,
        subtotal: i.subtotal,
      })),
    );
  }, [carrito.items, form]);

  // Auto-llenar tarifa al cambiar método de delivery
  useEffect(() => {
    if (deliveryMethod === DELIVERY_METHOD.PROPIO) {
      form.setValue("delivery_fee", deliveryFees.propio);
    } else if (deliveryMethod === DELIVERY_METHOD.TERCERO) {
      form.setValue("delivery_fee", deliveryFees.tercero);
    }
  }, [deliveryMethod, deliveryFees, form]);

  // Limpiar al cerrar
  function handleClose() {
    setClienteSeleccionado(null);
    form.reset();
    onClose();
  }

  // Garantizar que delivery_fee sea 0 para pedidos no-delivery al enviar
  async function handleSubmit(data: CrearOrdenFormValues) {
    await onSubmit({
      ...data,
      delivery_fee:
        data.tipo_pedido === TIPO_PEDIDO.DELIVERY
          ? (data.delivery_fee ?? 0)
          : 0,
    });
  }

  const deliveryFee =
    tipoPedido === TIPO_PEDIDO.DELIVERY ? (form.watch("delivery_fee") ?? 0) : 0;
  const total = carrito.subtotal + deliveryFee;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar pedido</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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
                <div key={item.key} className="flex justify-between text-sm">
                  <span>
                    {item.cantidad}× {item.producto_nombre}
                    {item.variante_nombre ? ` (${item.variante_nombre})` : ""}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.subtotal)}
                  </span>
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
                        Para llevar
                      </SelectItem>
                      {!esMesero && (
                        <SelectItem value={TIPO_PEDIDO.DELIVERY}>
                          Delivery
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Mesa / referencia ── */}
            {tipoPedido === TIPO_PEDIDO.EN_LOCAL && (
              <FormField
                control={form.control}
                name="mesa_referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesa / referencia (opcional)</FormLabel>
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
                    name="repartidor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repartidor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona repartidor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {repartidores.length === 0 ? (
                              <SelectItem value="_none" disabled>
                                Sin repartidores disponibles
                              </SelectItem>
                            ) : (
                              repartidores.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.nombre} {r.apellido_paterno}
                                </SelectItem>
                              ))
                            )}
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
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona servicio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {THIRD_PARTY_SERVICES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
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
                      <FormLabel>Costo de delivery (S/)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="h-12"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
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

            {/* ── Total ── */}
            <div className="rounded-xl border p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(carrito.subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 mt-1 font-bold text-base">
                <span>Total del pedido</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              {clienteSeleccionado?.membresias?.nivel?.descuento_porcentaje && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  * Este cliente tiene{" "}
                  {clienteSeleccionado.membresias.nivel.descuento_porcentaje}%
                  de descuento por membresía (aplicar al momento del cobro)
                </p>
              )}
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
                disabled={isSubmitting}
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
