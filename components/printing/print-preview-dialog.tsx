"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bluetooth, Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { usePrinterContext } from "@/components/providers/printer-provider";
import { TicketPreview } from "./ticket-preview";
import { ticketToEscpos } from "@/lib/printing/ticket-to-escpos";
import { descargarTicketComoImagen } from "@/lib/printing/ticket-capture";
import type { LineaTicket } from "@/lib/printing/ticket-builder";

type Props = {
  lineasTicket: LineaTicket[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  /** Nombre de sucursal para el nombre del archivo descargado */
  sucursalNombre?: string;
  /** Referencia para el nombre del archivo (ej: "Orden042", "Mesa4") */
  referencia?: string;
};

export function PrintPreviewDialog({
  lineasTicket,
  open,
  onOpenChange,
  titulo = "Vista previa del ticket",
  sucursalNombre = "",
  referencia = "",
}: Props) {
  const { estado, nombreDispositivo, conectar, imprimir } = usePrinterContext();
  const [imprimiendo, setImprimiendo] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

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
      const datos = ticketToEscpos(lineasTicket);
      await imprimir(datos);
      toast.success("Ticket impreso correctamente");
      onOpenChange(false);
    } catch {
      toast.error("Error al imprimir. Verifica la conexión de la impresora.");
    } finally {
      setImprimiendo(false);
    }
  }

  async function handleDescargar() {
    if (!ticketRef.current) return;

    setDescargando(true);
    try {
      await descargarTicketComoImagen({
        elemento: ticketRef.current,
        sucursal: sucursalNombre,
        referencia: referencia,
      });
      toast.success("Imagen descargada");
    } catch {
      toast.error("Error al descargar la imagen");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base">{titulo}</DialogTitle>
          {/* Estado de la impresora inline */}
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            <Printer className="h-3.5 w-3.5" />
            {noSoportado ? (
              <span className="text-muted-foreground">
                Navegador no compatible — usa Chrome o Edge
              </span>
            ) : estaConectado ? (
              <span className="text-green-600 dark:text-green-400">
                {nombreDispositivo ?? "Conectada"}
              </span>
            ) : estado === "conectando" ? (
              <span className="text-blue-500">Conectando...</span>
            ) : estado === "error" ? (
              <span className="text-red-500">Error de conexión</span>
            ) : (
              <span className="text-amber-500">Desconectada</span>
            )}
          </div>
        </DialogHeader>

        {/* Preview del ticket */}
        <ScrollArea className="max-h-[55vh]">
          <TicketPreview ref={ticketRef} lineas={lineasTicket} />
        </ScrollArea>

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          {/* Descargar imagen */}
          <Button
            variant="outline"
            className="h-12 rounded-xl"
            onClick={handleDescargar}
            disabled={descargando}
            title="Descargar como imagen"
          >
            {descargando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          {!estaConectado && !noSoportado && (
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={handleConectar}
              disabled={estado === "conectando"}
            >
              {estado === "conectando" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Bluetooth className="mr-1.5 h-4 w-4" />
              )}
              Conectar impresora
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
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
