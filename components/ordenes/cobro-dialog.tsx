"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Award, CheckCircle, DollarSign, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cobrarOrdenAction } from "@/app/(dashboard)/ordenes/actions";
import {
  cobrarOrdenSchema,
  type CobrarOrdenFormValues,
} from "@/lib/validations/ventas";
import type { OrdenConItems } from "@/lib/services/ordenes";
import type { Venta } from "@/lib/services/ventas";
import type { NivelMembresia } from "@/lib/services/membresias";
import { calcularDescuentoNivel } from "@/lib/membresias-utils";
import { useCurrency } from "@/hooks/use-currency";
import { METODO_PAGO } from "@/lib/constants";

const METODO_PAGO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
};

type Props = {
  orden: OrdenConItems;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niveles?: NivelMembresia[];
};

type Fase = "formulario" | "confirmacion";

export function CobroDialog({
  orden,
  open,
  onOpenChange,
  niveles = [],
}: Props) {
  const [fase, setFase] = useState<Fase>("formulario");
  const [ventaResultado, setVentaResultado] = useState<Venta | null>(null);
  const [nivelSeleccionado, setNivelSeleccionado] =
    useState<NivelMembresia | null>(null);
  const [isPending, startTransition] = useTransition();
  const { simbolo, formatCurrency } = useCurrency();

  const form = useForm<CobrarOrdenFormValues>({
    resolver: zodResolver(cobrarOrdenSchema),
    defaultValues: {
      metodo_pago: undefined,
      monto_recibido: undefined,
      descuento_membresia: 0,
    },
  });

  const metodoPago = form.watch("metodo_pago");
  const montoRecibido = form.watch("monto_recibido");
  const esEfectivo = metodoPago === METODO_PAGO.EFECTIVO;

  const descuentoMembresia = calcularDescuentoNivel(
    orden.subtotal,
    nivelSeleccionado,
  );
  const totalFinal = Math.max(0, orden.total - descuentoMembresia);
  const vuelto =
    esEfectivo && montoRecibido ? montoRecibido - totalFinal : null;

  function handleClose() {
    if (isPending) return;
    setFase("formulario");
    setVentaResultado(null);
    setNivelSeleccionado(null);
    form.reset();
    onOpenChange(false);
  }

  function handleSeleccionarNivel(nivel: NivelMembresia | null) {
    setNivelSeleccionado(nivel);
    const descuento = calcularDescuentoNivel(orden.subtotal, nivel);
    form.setValue("descuento_membresia", descuento);
  }

  function onSubmit(values: CobrarOrdenFormValues) {
    startTransition(async () => {
      const result = await cobrarOrdenAction(orden.id, {
        ...values,
        descuento_membresia: descuentoMembresia,
      });
      if (result.error) {
        toast.error("Error al cobrar", { description: result.error });
        return;
      }
      setVentaResultado(result.data!);
      setFase("confirmacion");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md rounded-xl"
        onInteractOutside={(e) => {
          if (isPending || fase === "confirmacion") e.preventDefault();
        }}
      >
        {fase === "formulario" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">
                Cobrar orden #{orden.numero_orden}
              </DialogTitle>
            </DialogHeader>

            {/* Cliente */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span
                className={
                  !orden.cliente
                    ? "italic text-muted-foreground"
                    : "font-medium"
                }
              >
                {orden.cliente
                  ? `${orden.cliente.nombre}${orden.cliente.apellido ? ` ${orden.cliente.apellido}` : ""}`
                  : "Cliente no registrado"}
              </span>
            </div>

            {/* Resumen de la orden */}
            <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
              {orden.orden_items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    <span className="font-medium">{item.cantidad}×</span>{" "}
                    {item.producto_nombre}
                    {item.variante_nombre && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({item.variante_nombre})
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}

              <Separator className="my-2" />

              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(orden.subtotal)}</span>
              </div>

              {orden.delivery_fee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{formatCurrency(orden.delivery_fee)}</span>
                </div>
              )}

              {descuentoMembresia > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento membresía ({nivelSeleccionado?.nombre})</span>
                  <span>− {formatCurrency(descuentoMembresia)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(totalFinal)}
                </span>
              </div>
            </div>

            {/* Descuento por membresía */}
            {niveles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Descuento por membresía (opcional)</span>
                </div>
                {nivelSeleccionado ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
                    <div className="text-sm">
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {nivelSeleccionado.nombre}
                      </span>
                      <span className="text-green-600 dark:text-green-500">
                        {" "}
                        — {nivelSeleccionado.descuento_porcentaje}% de descuento
                        ({formatCurrency(descuentoMembresia)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-green-600 hover:text-green-800"
                      onClick={() => handleSeleccionarNivel(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {niveles.map((nivel) => (
                      <Button
                        key={nivel.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-xs"
                        onClick={() => handleSeleccionarNivel(nivel)}
                      >
                        <Award className="mr-1 h-3 w-3" />
                        {nivel.nombre} ({nivel.descuento_porcentaje}%)
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="metodo_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(METODO_PAGO_LABELS).map(
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

                {esEfectivo && (
                  <FormField
                    control={form.control}
                    name="monto_recibido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto recibido ({simbolo})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={totalFinal}
                            step={0.5}
                            placeholder={`Mínimo ${formatCurrency(totalFinal)}`}
                            className="h-12 rounded-xl"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />

                        {/* Vuelto en tiempo real */}
                        {montoRecibido !== undefined && montoRecibido > 0 && (
                          <p
                            className={
                              vuelto !== null && vuelto >= 0
                                ? "text-sm font-medium text-green-600"
                                : "text-sm font-medium text-destructive"
                            }
                          >
                            {vuelto !== null && vuelto >= 0
                              ? `Vuelto: ${formatCurrency(vuelto)}`
                              : "Monto insuficiente"}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    disabled={
                      isPending ||
                      !metodoPago ||
                      (esEfectivo &&
                        (!montoRecibido || montoRecibido < totalFinal))
                    }
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="mr-1 h-4 w-4" />
                        Cobrar {formatCurrency(totalFinal)}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <DialogTitle className="text-xl">
                  ¡Cobro registrado!
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
              {ventaResultado?.numero_venta && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° de venta</span>
                  <span className="font-bold">
                    #{ventaResultado.numero_venta}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total cobrado</span>
                <span className="font-bold text-primary">
                  {formatCurrency(totalFinal)}
                </span>
              </div>
              {descuentoMembresia > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Descuento membresía
                  </span>
                  <span className="font-medium text-green-600">
                    − {formatCurrency(descuentoMembresia)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span>
                  {METODO_PAGO_LABELS[ventaResultado?.metodo_pago ?? ""] ?? "—"}
                </span>
              </div>
              {ventaResultado?.metodo_pago === "efectivo" &&
                vuelto !== null &&
                vuelto > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vuelto</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(vuelto)}
                    </span>
                  </div>
                )}
            </div>

            <Button className="h-12 w-full rounded-xl" onClick={handleClose}>
              Cerrar
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
