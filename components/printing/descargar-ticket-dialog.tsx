"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TicketPreview } from "./ticket-preview";
import { descargarTicketComoImagen } from "@/lib/printing/ticket-capture";
import type { LineaTicket } from "@/lib/printing/ticket-builder";

type Props = {
  lineasTicket: LineaTicket[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursalNombre: string;
  referencia: string;
  titulo?: string;
};

export function DescargarTicketDialog({
  lineasTicket,
  open,
  onOpenChange,
  sucursalNombre,
  referencia,
  titulo = "Descargar ticket",
}: Props) {
  const [descargando, setDescargando] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  async function handleDescargar() {
    if (!ticketRef.current) return;

    setDescargando(true);
    try {
      await descargarTicketComoImagen({
        elemento: ticketRef.current,
        sucursal: sucursalNombre,
        referencia,
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
      <DialogContent className="max-w-sm rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{titulo}</DialogTitle>
        </DialogHeader>

        {/* Ticket SIN ScrollArea — se renderiza completo */}
        <div className="py-1">
          <TicketPreview ref={ticketRef} lineas={lineasTicket} />
        </div>

        <Button
          className="h-12 w-full rounded-xl"
          onClick={handleDescargar}
          disabled={descargando}
        >
          {descargando ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Descargar imagen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
