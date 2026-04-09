"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  crearDeliveryServicioAction,
  actualizarDeliveryServicioAction,
  toggleDeliveryServicioAction,
  eliminarDeliveryServicioAction,
} from "@/actions/delivery-servicios";
import {
  deliveryServicioSchema,
  type DeliveryServicioFormData,
} from "@/lib/validations/delivery-servicios";

type Servicio = {
  id: string;
  nombre: string;
  tipo: "propio" | "tercero";
  precio_base: number;
  activo: boolean;
  orden: number;
  sucursal_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type Props = {
  serviciosPorSucursal: {
    sucursal_id: string;
    sucursal_nombre: string;
    servicios: Servicio[];
  }[];
};

export function DeliveryServiciosForm({ serviciosPorSucursal }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [sucursalActiva, setSucursalActiva] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function abrirCrear(sucursalId: string) {
    setEditando(null);
    setSucursalActiva(sucursalId);
    setDialogOpen(true);
  }

  function abrirEditar(servicio: Servicio) {
    setEditando(servicio);
    setSucursalActiva(servicio.sucursal_id);
    setDialogOpen(true);
  }

  function cerrarDialog() {
    setDialogOpen(false);
    setEditando(null);
    setSucursalActiva("");
  }

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      const result = await toggleDeliveryServicioAction(id, activo);
      if (result.success) {
        toast.success(activo ? "Servicio activado" : "Servicio desactivado");
      } else {
        toast.error(result.error ?? "Error al cambiar estado");
      }
    });
  }

  function handleEliminar(id: string, nombre: string) {
    const confirmado = window.confirm(
      `¿Estás seguro de eliminar el servicio "${nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    startTransition(async () => {
      const result = await eliminarDeliveryServicioAction(id);
      if (result.success) {
        toast.success("Servicio eliminado");
      } else {
        toast.error(result.error ?? "Error al eliminar servicio");
      }
    });
  }

  return (
    <div className="space-y-6">
      {serviciosPorSucursal.map((grupo) => (
        <Card
          key={grupo.sucursal_id}
          className="rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{grupo.sucursal_nombre}</CardTitle>
            <Button
              size="sm"
              onClick={() => abrirCrear(grupo.sucursal_id)}
              disabled={isPending}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar servicio
            </Button>
          </CardHeader>
          <CardContent>
            {grupo.servicios.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay servicios configurados para esta sucursal.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="text-center">Activo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.servicios.map((servicio) => (
                      <TableRow key={servicio.id}>
                        <TableCell className="font-medium">
                          {servicio.nombre}
                        </TableCell>
                        <TableCell>
                          {servicio.tipo === "propio" ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            >
                              Propio
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            >
                              Tercero
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(servicio.precio_base)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={servicio.activo}
                            onCheckedChange={(checked) =>
                              handleToggle(servicio.id, checked)
                            }
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEditar(servicio)}
                              disabled={isPending}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleEliminar(servicio.id, servicio.nombre)
                              }
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <ServicioDialog
        open={dialogOpen}
        onClose={cerrarDialog}
        servicio={editando}
        sucursalId={sucursalActiva}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog para crear / editar servicio                                */
/* ------------------------------------------------------------------ */

type ServicioDialogProps = {
  open: boolean;
  onClose: () => void;
  servicio: Servicio | null;
  sucursalId: string;
};

function ServicioDialog({
  open,
  onClose,
  servicio,
  sucursalId,
}: ServicioDialogProps) {
  const esEdicion = !!servicio;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeliveryServicioFormData>({
    resolver: zodResolver(deliveryServicioSchema),
    defaultValues: {
      sucursal_id: sucursalId,
      nombre: "",
      tipo: "propio",
      precio_base: 0,
      orden: 0,
      activo: true,
    },
  });

  useEffect(() => {
    if (open && servicio) {
      form.reset({
        sucursal_id: servicio.sucursal_id,
        nombre: servicio.nombre,
        tipo: servicio.tipo,
        precio_base: servicio.precio_base,
        orden: servicio.orden,
        activo: servicio.activo,
      });
    } else if (open && !servicio) {
      form.reset({
        sucursal_id: sucursalId,
        nombre: "",
        tipo: "propio",
        precio_base: 0,
        orden: 0,
        activo: true,
      });
    }
  }, [open, servicio, sucursalId, form]);

  async function onSubmit(data: DeliveryServicioFormData) {
    setIsSubmitting(true);
    try {
      const result = esEdicion
        ? await actualizarDeliveryServicioAction(servicio!.id, data)
        : await crearDeliveryServicioAction(data);

      if (!result.success) {
        toast.error(result.error ?? "Error al guardar servicio");
        return;
      }
      toast.success(esEdicion ? "Servicio actualizado" : "Servicio creado");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar servicio" : "Nuevo servicio de delivery"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo oculto: sucursal_id */}
            <input type="hidden" {...form.register("sucursal_id")} />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Delivery propio, Rappi, PedidosYa"
                      className="h-12 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="propio">Propio</SelectItem>
                      <SelectItem value="tercero">Tercero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="precio_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio base (S/.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        className="h-12 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        className="h-12 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear servicio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
