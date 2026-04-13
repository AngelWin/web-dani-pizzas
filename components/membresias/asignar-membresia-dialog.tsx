"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Search } from "lucide-react";
import {
  asignarMembresiaSchema,
  type AsignarMembresiaFormValues,
} from "@/lib/validations/membresias";
import { asignarMembresiaAction } from "@/actions/membresias";
import { buscarClienteAction } from "@/actions/clientes";
import { useCurrency } from "@/hooks/use-currency";
import type { NivelMembresia } from "@/lib/services/membresias";

type Props = {
  open: boolean;
  onClose: () => void;
  niveles: NivelMembresia[];
};

export function AsignarMembresiaDialog({ open, onClose, niveles }: Props) {
  const { formatCurrency } = useCurrency();
  const [isPending, startTransition] = useTransition();
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<{
    id: string;
    nombre: string;
    apellido: string | null;
    dni: string | null;
  } | null>(null);

  const form = useForm<AsignarMembresiaFormValues>({
    resolver: zodResolver(asignarMembresiaSchema),
    defaultValues: {
      cliente_id: "",
      nivel_id: "",
      tipo_plan: "mensual",
      monto_pagado: 0,
    },
  });

  const nivelSeleccionado = niveles.find(
    (n) => n.id === form.watch("nivel_id"),
  );
  const tipoPlan = form.watch("tipo_plan");

  // Verificar si hay precio de lanzamiento vigente
  function getPrecioLanzamiento(
    nivel: (typeof niveles)[number],
  ): number | null {
    if (
      !nivel.precio_lanzamiento ||
      !nivel.fecha_inicio_lanzamiento ||
      !nivel.fecha_fin_lanzamiento
    )
      return null;
    const hoy = new Date().toISOString().split("T")[0];
    if (
      hoy >= nivel.fecha_inicio_lanzamiento &&
      hoy <= nivel.fecha_fin_lanzamiento
    ) {
      return nivel.precio_lanzamiento;
    }
    return null;
  }

  // Auto-llenar monto según nivel y plan (usa precio lanzamiento si vigente)
  function actualizarMonto(nivelId: string, plan: string) {
    const nivel = niveles.find((n) => n.id === nivelId);
    if (!nivel) return;
    const precioLanzamiento = getPrecioLanzamiento(nivel);
    if (precioLanzamiento !== null) {
      form.setValue("monto_pagado", precioLanzamiento);
      return;
    }
    const monto =
      plan === "mensual"
        ? nivel.precio_mensual
        : plan === "trimestral"
          ? nivel.precio_trimestral
          : nivel.precio_anual;
    if (monto !== null && monto !== undefined) {
      form.setValue("monto_pagado", monto);
    }
  }

  async function buscarCliente() {
    if (dniBusqueda.trim().length < 7) {
      toast.error("Ingresa un DNI válido (mínimo 7 dígitos)");
      return;
    }
    const result = await buscarClienteAction(dniBusqueda.trim());
    if (result.error || !result.data) {
      toast.error(result.error ?? "Cliente no encontrado");
      setClienteEncontrado(null);
      return;
    }
    setClienteEncontrado({
      id: result.data.id,
      nombre: result.data.nombre,
      apellido: result.data.apellido,
      dni: result.data.dni,
    });
    form.setValue("cliente_id", result.data.id);
  }

  function onSubmit(data: AsignarMembresiaFormValues) {
    startTransition(async () => {
      const result = await asignarMembresiaAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Membresía asignada exitosamente");
      setClienteEncontrado(null);
      setDniBusqueda("");
      form.reset();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar membresía</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Buscar cliente */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Cliente</p>
              <div className="flex gap-2">
                <Input
                  placeholder="DNI del cliente"
                  value={dniBusqueda}
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  className="h-11"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), buscarCliente())
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-3"
                  onClick={buscarCliente}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {clienteEncontrado && (
                <div className="rounded-lg border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-2.5">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {clienteEncontrado.nombre}{" "}
                    {clienteEncontrado.apellido ?? ""}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    DNI: {clienteEncontrado.dni}
                  </p>
                </div>
              )}
            </div>

            {/* Nivel */}
            <FormField
              control={form.control}
              name="nivel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de membresía</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      actualizarMonto(v, tipoPlan);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {niveles.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.nombre}
                          {n.descuento_porcentaje
                            ? ` (${n.descuento_porcentaje}% desc.)`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="tipo_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (nivelSeleccionado) {
                        actualizarMonto(nivelSeleccionado.id, v);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mensual">
                        Mensual
                        {nivelSeleccionado?.precio_mensual
                          ? ` — ${formatCurrency(nivelSeleccionado.precio_mensual)}`
                          : ""}
                      </SelectItem>
                      <SelectItem value="trimestral">
                        Trimestral (3 meses)
                        {nivelSeleccionado?.precio_trimestral
                          ? ` — ${formatCurrency(nivelSeleccionado.precio_trimestral)}`
                          : ""}
                      </SelectItem>
                      <SelectItem value="anual">
                        Anual (12 meses)
                        {nivelSeleccionado?.precio_anual
                          ? ` — ${formatCurrency(nivelSeleccionado.precio_anual)}`
                          : ""}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monto */}
            <FormField
              control={form.control}
              name="monto_pagado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto pagado</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 flex-1"
                disabled={isPending || !clienteEncontrado}
              >
                {isPending ? "Asignando..." : "Asignar membresía"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
