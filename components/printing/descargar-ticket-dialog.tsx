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
  /**
   * captureRef apunta a un TicketPreview oculto fuera del viewport,
   * sin ningún padre que restrinja overflow. Esto garantiza que
   * html-to-image captura el ticket completo sin recortes.
   */
  const captureRef = useRef<HTMLDivElement>(null);

  async function handleDescargar() {
    if (!captureRef.current) return;

    setDescargando(true);
    try {
      await descargarTicketComoImagen({
        elemento: captureRef.current,
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
    <>
      {/*
       * Elemento oculto fuera del viewport para captura limpia.
       * - position: fixed + left: -9999px → fuera de la pantalla
       * - width: 302px explícito → ancho del papel térmico 80mm
       * - Sin ningún padre con overflow hidden → captura sin recortes
       * - React lo renderiza normalmente → Next/Image carga correctamente
       */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 302,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <TicketPreview ref={captureRef} lineas={lineasTicket} />
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{titulo}</DialogTitle>
          </DialogHeader>

          {/* Ticket de visualización — dentro del dialog con scroll */}
          <div className="py-1">
            <TicketPreview lineas={lineasTicket} />
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
    </>
  );
}
