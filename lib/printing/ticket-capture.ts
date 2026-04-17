/**
 * Captura el contenido HTML del ticket preview como imagen PNG y lo descarga.
 * Nombre descriptivo: Ticket-{sucursal}-Orden{numero}-{fecha}.png
 *
 * El elemento a capturar debe estar en un contenedor sin restricciones de overflow
 * (ej: posición fija fuera del viewport). Esto garantiza captura completa sin recortes.
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
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

  // Esperar dos frames para que el navegador termine de renderizar
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));

  // Usar scrollWidth/scrollHeight para capturar el contenido completo
  // aunque el contenedor visible sea más pequeño
  const dataUrl = await toPng(elemento, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
    width: elemento.scrollWidth,
    height: elemento.scrollHeight,
  });

  const link = document.createElement("a");
  link.download = nombreArchivo;
  link.href = dataUrl;
  link.click();
}
