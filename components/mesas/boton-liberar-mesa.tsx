"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Unlock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { liberarMesaForzadoAction } from "@/actions/mesas";

type Props = {
  mesaId: string;
  mesaReferencia: string;
  ordenesActivas: number;
};

export function BotonLiberarMesa({
  mesaId,
  mesaReferencia,
  ordenesActivas,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirmar() {
    startTransition(async () => {
      const result = await liberarMesaForzadoAction(mesaId);
      if (result.error) {
        toast.error("Error al liberar mesa", { description: result.error });
        return;
      }
      const canceladas = result.data?.canceladas ?? 0;
      toast.success(
        canceladas > 0
          ? `${mesaReferencia} liberada — ${canceladas} ${canceladas === 1 ? "orden cancelada" : "órdenes canceladas"}`
          : `${mesaReferencia} liberada`,
      );
      setOpen(false);
      router.push("/ordenes");
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400"
        onClick={() => setOpen(true)}
      >
        <Unlock className="h-3.5 w-3.5" />
        Liberar mesa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Liberar {mesaReferencia}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Esta acción cancelará{" "}
              <span className="font-semibold text-foreground">
                {ordenesActivas}{" "}
                {ordenesActivas === 1 ? "orden activa" : "órdenes activas"}
              </span>{" "}
              sin cobrar y pondrá la mesa como libre.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
              Usa esta opción solo para limpiar órdenes de prueba o atascadas.
              Las órdenes reales deben cobrarse o cancelarse individualmente.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10"
              onClick={handleConfirmar}
              disabled={isPending}
            >
              {isPending ? "Liberando..." : "Sí, liberar mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
