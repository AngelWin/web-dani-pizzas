/**
 * Captura el contenido HTML del ticket preview como imagen PNG y lo descarga.
 * Nombre descriptivo: Ticket-{sucursal}-Orden{numero}-{fecha}.png
 */

import { toPng } from "html-to-image";

type DescargarTicketParams = {
  /** Ref al elemento HTML del ticket preview */
  elemento: HTMLElement;
  /** Nombre de la sucursal (ej: "Casma Av. Reina") */
  sucursal: string;
  /** Número de orden o referencia (ej: "042" o "Mesa4") */
  referencia: string;
};

function sanitizarNombre(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-zA-Z0-9]/g, "") // solo alfanumérico
    .trim();
}

function getFechaCompacta(): string {
  const ahora = new Date();
  const dia = String(ahora.getDate()).padStart(2, "0");
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const anio = ahora.getFullYear();
  const hora = String(ahora.getHours()).padStart(2, "0");
  const min = String(ahora.getMinutes()).padStart(2, "0");
  return `${dia}${mes}${anio}-${hora}${min}`;
}

export async function descargarTicketComoImagen({
  elemento,
  sucursal,
  referencia,
}: DescargarTicketParams): Promise<void> {
  const sucursalSlug = sanitizarNombre(sucursal);
  const referenciaSlug = sanitizarNombre(referencia);
  const fecha = getFechaCompacta();

  const nombreArchivo = `Ticket-${sucursalSlug}-${referenciaSlug}-${fecha}.png`;

  // Capturar con el tamaño real del contenido (no el visible en scroll)
  const dataUrl = await toPng(elemento, {
    backgroundColor: "#ffffff",
    pixelRatio: 2, // Mayor resolución para que se vea nítido en WhatsApp
    width: elemento.scrollWidth,
    height: elemento.scrollHeight,
    style: {
      overflow: "visible",
      maxHeight: "none",
    },
  });

  // Crear link de descarga y disparar
  const link = document.createElement("a");
  link.download = nombreArchivo;
  link.href = dataUrl;
  link.click();
}
