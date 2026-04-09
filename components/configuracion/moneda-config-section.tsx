"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  Coins,
  DollarSign,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  crearMonedaAction,
  actualizarMonedaAction,
  eliminarMonedaAction,
  setMonedaActivaAction,
} from "@/actions/monedas";
import { monedaSchema, type MonedaFormData } from "@/lib/validations/moneda";
import type { Moneda } from "@/lib/services/monedas";

type Props = {
  monedas: Moneda[];
  monedaActivaId: string;
};

export function MonedaConfigSection({ monedas, monedaActivaId }: Props) {
  const [seleccionado, setSeleccionado] = useState(monedaActivaId);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Moneda | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const hayCambios = seleccionado !== monedaActivaId;

  function handleGuardarActiva() {
    startTransition(async () => {
      const result = await setMonedaActivaAction({ moneda_id: seleccionado });
      if (result.success) {
        toast.success(
          "Moneda activa actualizada. Recarga la página para ver los cambios en toda la app.",
        );
      } else {
        toast.error(result.error ?? "Error al guardar");
        setSeleccionado(monedaActivaId);
      }
    });
  }

  function handleEditar(moneda: Moneda) {
    setEditando(moneda);
    setDialogOpen(true);
  }

  function handleNueva() {
    setEditando(null);
    setDialogOpen(true);
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      const result = await eliminarMonedaAction(id);
      if (result.success) {
        toast.success("Moneda eliminada");
      } else {
        toast.error(result.error ?? "Error al eliminar");
      }
      setEliminandoId(null);
    });
  }

  // Monedas personalizadas (no predefinidas)
  const monedasPersonalizadas = monedas.filter((m) => !m.es_predefinida);

  return (
    <div className="space-y-6">
      {/* Selector de moneda activa */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">Moneda activa</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monedas.map((m) => {
            const activo = seleccionado === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSeleccionado(m.id)}
                className={cn(
                  "relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                  "hover:border-primary/60 hover:shadow-md",
                  activo
                    ? "border-primary bg-primary/5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                    : "border-border bg-surface",
                )}
              >
                {activo && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />
                )}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold",
                    activo
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {m.simbolo}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{m.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.codigo} · {m.simbolo}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3">
          {hayCambios && (
            <p className="text-sm text-muted-foreground">
              Tienes cambios sin guardar
            </p>
          )}
          <Button
            onClick={handleGuardarActiva}
            disabled={!hayCambios || isPending}
            className="h-11 px-6"
          >
            {isPending ? "Guardando..." : "Guardar moneda"}
          </Button>
        </div>
      </div>

      {/* Tabla de monedas personalizadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Monedas personalizadas
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNueva}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Agregar moneda
          </Button>
        </div>

        {monedasPersonalizadas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
            <Coins className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay monedas personalizadas. Agrega una si necesitas otra
              divisa.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Símbolo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monedasPersonalizadas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-medium">
                      {m.codigo}
                    </TableCell>
                    <TableCell>{m.simbolo}</TableCell>
                    <TableCell>{m.nombre}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditar(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setEliminandoId(m.id)}
                          disabled={m.id === monedaActivaId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog crear/editar */}
      <MonedaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editando={editando}
      />

      {/* Alert de eliminación */}
      <AlertDialog
        open={!!eliminandoId}
        onOpenChange={(open) => !open && setEliminandoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta moneda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La moneda será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eliminandoId && handleEliminar(eliminandoId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Dialog de formulario ────────────────────────────────────────────────────

function MonedaFormDialog({
  open,
  onOpenChange,
  editando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editando: Moneda | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MonedaFormData>({
    resolver: zodResolver(monedaSchema),
    defaultValues: {
      codigo: "",
      simbolo: "",
      nombre: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editando
          ? {
              codigo: editando.codigo,
              simbolo: editando.simbolo,
              nombre: editando.nombre,
            }
          : { codigo: "", simbolo: "", nombre: "" },
      );
    }
  }, [open, editando, form]);

  function onSubmit(data: MonedaFormData) {
    startTransition(async () => {
      const result = editando
        ? await actualizarMonedaAction(editando.id, data)
        : await crearMonedaAction(data);

      if (result.success) {
        toast.success(editando ? "Moneda actualizada" : "Moneda creada");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar moneda" : "Agregar moneda"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código ISO</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EUR"
                      maxLength={5}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="simbolo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Símbolo</FormLabel>
                  <FormControl>
                    <Input placeholder="€" maxLength={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Euro" maxLength={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
