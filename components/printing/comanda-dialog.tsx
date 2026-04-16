"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bluetooth, Loader2, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { usePrinterContext } from "@/components/providers/printer-provider";
import { TicketPreview } from "./ticket-preview";
import { ticketToEscpos } from "@/lib/printing/ticket-to-escpos";
import { buildTicketComanda } from "@/lib/printing/ticket-builder";
import type { OrdenConItems } from "@/lib/services/ordenes";

type Props = {
  orden: OrdenConItems;
  sucursalNombre: string;
  open: boolean;
  onClose: () => void;
};

export function ComandaDialog({ orden, sucursalNombre, open, onClose }: Props) {
  const { estado, nombreDispositivo, conectar, imprimir } = usePrinterContext();
  const [imprimiendo, setImprimiendo] = useState(false);

  const lineasComanda = useMemo(
    () => buildTicketComanda(orden, sucursalNombre),
    [orden, sucursalNombre],
  );

  const estaConectado = estado === "conectado";
  const noSoportado = estado === "no_soportado";

  async function handleConectar() {
    try {
      await conectar();
    } catch {
      toast.error("No se pudo conectar a la impresora");
    }
  }

  async function handleImprimir() {
    if (!estaConectado) {
      toast.error("Conecta la impresora antes de imprimir");
      return;
    }

    setImprimiendo(true);
    try {
      const datos = ticketToEscpos(lineasComanda);
      await imprimir(datos);
      toast.success("Comanda impresa correctamente");
      onClose();
    } catch {
      toast.error("Error al imprimir la comanda");
    } finally {
      setImprimiendo(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            ¿Imprimir comanda de cocina?
          </DialogTitle>
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            <Printer className="h-3.5 w-3.5" />
            {noSoportado ? (
              <span className="text-muted-foreground">
                Navegador no compatible
              </span>
            ) : estaConectado ? (
              <span className="text-green-600 dark:text-green-400">
                {nombreDispositivo ?? "Conectada"}
              </span>
            ) : estado === "conectando" ? (
              <span className="text-blue-500">Conectando...</span>
            ) : (
              <span className="text-amber-500">Desconectada</span>
            )}
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Orden #{orden.numero_orden} pasó a{" "}
          <span className="font-semibold text-amber-600">En preparación</span>.
          ¿Deseas imprimir la comanda para cocina?
        </p>

        {/* Preview de la comanda */}
        <ScrollArea className="max-h-[40vh]">
          <TicketPreview lineas={lineasComanda} />
        </ScrollArea>

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl"
            onClick={onClose}
          >
            <X className="mr-1.5 h-4 w-4" />
            Omitir
          </Button>

          {!estaConectado && !noSoportado && (
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={handleConectar}
              disabled={estado === "conectando"}
            >
              {estado === "conectando" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bluetooth className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            className="h-12 flex-1 rounded-xl"
            onClick={handleImprimir}
            disabled={!estaConectado || imprimiendo}
          >
            {imprimiendo ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-1.5 h-4 w-4" />
            )}
            Imprimir comanda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
