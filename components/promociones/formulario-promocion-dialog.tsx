"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  promocionSchema,
  type PromocionFormValues,
} from "@/lib/validations/promociones";
import {
  createPromocionAction,
  updatePromocionAction,
} from "@/actions/promociones";
import type { PromocionConProductos } from "@/lib/services/promociones";

type ProductoBasico = { id: string; nombre: string };

type Props = {
  open: boolean;
  onClose: () => void;
  promocion?: PromocionConProductos | null;
  productos: ProductoBasico[];
};

function toDatetimeLocal(iso: string): string {
  // Convierte ISO string a formato "YYYY-MM-DDTHH:mm" para input datetime-local
  return iso.slice(0, 16);
}

export function FormularioPromocionDialog({
  open,
  onClose,
  promocion,
  productos,
}: Props) {
  const esEdicion = !!promocion;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoBasico[]
  >([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const form = useForm<PromocionFormValues>({
    resolver: zodResolver(promocionSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      tipo_descuento: "porcentaje",
      valor_descuento: 10,
      fecha_inicio: "",
      fecha_fin: "",
      activa: true,
      productos_ids: [],
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (open && promocion) {
      form.reset({
        nombre: promocion.nombre,
        descripcion: promocion.descripcion ?? "",
        tipo_descuento: promocion.tipo_descuento as "porcentaje" | "fijo",
        valor_descuento: promocion.valor_descuento,
        fecha_inicio: toDatetimeLocal(promocion.fecha_inicio),
        fecha_fin: toDatetimeLocal(promocion.fecha_fin),
        activa: promocion.activa ?? true,
        productos_ids: promocion.productos_ids,
      });
      const seleccionados = productos.filter((p) =>
        promocion.productos_ids.includes(p.id),
      );
      setProductosSeleccionados(seleccionados);
    } else if (open && !promocion) {
      form.reset({
        nombre: "",
        descripcion: "",
        tipo_descuento: "porcentaje",
        valor_descuento: 10,
        fecha_inicio: "",
        fecha_fin: "",
        activa: true,
        productos_ids: [],
      });
      setProductosSeleccionados([]);
    }
    setBusquedaProducto("");
  }, [open, promocion, productos, form]);

  // Sincronizar productos seleccionados → form
  useEffect(() => {
    form.setValue(
      "productos_ids",
      productosSeleccionados.map((p) => p.id),
    );
  }, [productosSeleccionados, form]);

  function agregarProducto(producto: ProductoBasico) {
    if (productosSeleccionados.some((p) => p.id === producto.id)) return;
    setProductosSeleccionados((prev) => [...prev, producto]);
    setBusquedaProducto("");
  }

  function quitarProducto(id: string) {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));
  }

  async function onSubmit(data: PromocionFormValues) {
    setIsSubmitting(true);
    try {
      // Convertir datetime-local a ISO con zona horaria Lima (UTC-5)
      const fechaInicioISO = new Date(data.fecha_inicio).toISOString();
      const fechaFinISO = new Date(data.fecha_fin).toISOString();

      const payload = {
        ...data,
        fecha_inicio: fechaInicioISO,
        fecha_fin: fechaFinISO,
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

  const tipoDescuento = form.watch("tipo_descuento");
  const productosFiltrados = productos.filter(
    (p) =>
      !productosSeleccionados.some((s) => s.id === p.id) &&
      p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar promoción" : "Nueva promoción"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
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

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales de la promoción..."
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

            {/* Tipo y valor de descuento */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="tipo_descuento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de descuento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="porcentaje">
                          Porcentaje (%)
                        </SelectItem>
                        <SelectItem value="fijo">Monto fijo (S/.)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_descuento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tipoDescuento === "porcentaje"
                        ? "Porcentaje (%)"
                        : "Monto (S/.)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.01}
                        step={tipoDescuento === "porcentaje" ? 1 : 0.5}
                        max={tipoDescuento === "porcentaje" ? 100 : undefined}
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas */}
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
                      La promoción será visible en el POS si las fechas son
                      vigentes
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

            {/* Productos vinculados */}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">
                  Productos incluidos (opcional)
                </p>
                <p className="text-xs text-muted-foreground">
                  Si no seleccionas productos, el descuento aplica al subtotal
                  completo
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
                        onClick={() => quitarProducto(p.id)}
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
                      onClick={() => agregarProducto(p)}
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
            </div>

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
                disabled={isSubmitting}
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
