"use client";

import { useState } from "react";
import {
  Armchair,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MesaForm } from "./mesa-form";
import { deleteMesaAction } from "@/actions/mesas";
import type { Mesa } from "@/lib/services/mesas";
import type { Sucursal } from "@/lib/services/sucursales";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursal: Sucursal;
  mesas: Mesa[];
};

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  libre: {
    label: "Libre",
    className:
      "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400",
  },
  ocupada: {
    label: "Ocupada",
    className:
      "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400",
  },
  reservada: {
    label: "Reservada",
    className:
      "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
  },
};

export function MesaAdminDialog({
  open,
  onOpenChange,
  sucursal,
  mesas,
}: Props) {
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<Mesa | null>(null);

  async function handleEliminar() {
    if (!eliminando) return;
    const result = await deleteMesaAction(eliminando.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Mesa ${eliminando.numero} eliminada`);
    }
    setEliminando(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              Mesas de {sucursal.nombre}
            </DialogTitle>
          </DialogHeader>

          {/* Botón nueva mesa — oculto si ya está creando/editando */}
          {!creando && !editando && (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs"
                onClick={() => setCreando(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva mesa
              </Button>
            </div>
          )}

          {/* Formulario crear/editar */}
          {(creando || editando) && (
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-medium">
                {editando ? `Editar mesa ${editando.numero}` : "Nueva mesa"}
              </p>
              <MesaForm
                sucursalId={sucursal.id}
                mesa={editando ?? undefined}
                siguienteNumero={
                  mesas.length > 0
                    ? Math.max(...mesas.map((m) => m.numero)) + 1
                    : 1
                }
                onSuccess={() => {
                  setCreando(false);
                  setEditando(null);
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setCreando(false);
                  setEditando(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Cuadrícula de mesas */}
          {mesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Armchair className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No hay mesas configuradas</p>
              <p className="text-xs mt-1">
                Agrega mesas para asignarlas a pedidos en local
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mesas.map((mesa) => {
                const estadoConf =
                  ESTADO_CONFIG[mesa.estado] ?? ESTADO_CONFIG.libre;
                return (
                  <div
                    key={mesa.id}
                    className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        Mesa {mesa.numero}
                      </span>
                      {mesa.activa ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 gap-0.5 ${estadoConf.className}`}
                        >
                          {estadoConf.label}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 gap-0.5 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
                        >
                          <XCircle className="h-2.5 w-2.5" />
                          Inactiva
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {mesa.sillas} {mesa.sillas === 1 ? "silla" : "sillas"}
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 gap-1 rounded-lg text-xs"
                        onClick={() => {
                          setEditando(mesa);
                          setCreando(false);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setEliminando(mesa)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={!!eliminando}
        onOpenChange={(open) => !open && setEliminando(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar mesa {eliminando?.numero}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las órdenes asociadas perderán
              la referencia a esta mesa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
