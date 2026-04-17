/**
 * Captura el contenido HTML del ticket preview como imagen PNG y lo descarga.
 * Nombre descriptivo: Ticket-{sucursal}-Orden{numero}-{fecha}.png
 *
 * Clona el elemento fuera del viewport para evitar restricciones de
 * ScrollArea, Dialog u otros contenedores padres que recorten el contenido.
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

  // Clonar el elemento y colocarlo fuera del viewport, sin restricciones
  // de contenedores padres (Dialog, ScrollArea, etc.)
  const clon = elemento.cloneNode(true) as HTMLElement;
  clon.style.position = "fixed";
  clon.style.left = "-9999px";
  clon.style.top = "0";
  clon.style.zIndex = "-1";
  clon.style.width = "302px";
  clon.style.maxHeight = "none";
  clon.style.overflow = "visible";
  clon.style.margin = "0";
  document.body.appendChild(clon);

  try {
    // Esperar un frame para que el navegador renderice el clon
    await new Promise((r) => requestAnimationFrame(r));

    const dataUrl = await toPng(clon, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: 302,
      height: clon.scrollHeight,
    });

    const link = document.createElement("a");
    link.download = nombreArchivo;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(clon);
  }
}
