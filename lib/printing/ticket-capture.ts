/**
 * Captura el contenido HTML del ticket preview como imagen PNG y lo descarga.
 * Nombre descriptivo: Ticket-{sucursal}-Orden{numero}-{fecha}.png
 *
 * Temporalmente expande los contenedores padres (ScrollArea, Dialog)
 * para capturar el ticket completo sin cortes, y luego los restaura.
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

/**
 * Busca contenedores padres que puedan recortar el elemento
 * (ScrollArea viewport, elementos con overflow hidden/auto/scroll)
 * y los expande temporalmente. Retorna función para restaurar.
 */
function expandirPadres(elemento: HTMLElement): () => void {
  const restaurar: Array<{
    el: HTMLElement;
    overflow: string;
    maxHeight: string;
    height: string;
  }> = [];

  let parent = elemento.parentElement;
  while (parent && parent !== document.body) {
    const computed = getComputedStyle(parent);
    if (
      computed.overflow !== "visible" ||
      computed.overflowX !== "visible" ||
      computed.overflowY !== "visible"
    ) {
      restaurar.push({
        el: parent,
        overflow: parent.style.overflow,
        maxHeight: parent.style.maxHeight,
        height: parent.style.height,
      });
      parent.style.overflow = "visible";
      parent.style.maxHeight = "none";
      parent.style.height = "auto";
    }
    parent = parent.parentElement;
  }

  return () => {
    for (const item of restaurar) {
      item.el.style.overflow = item.overflow;
      item.el.style.maxHeight = item.maxHeight;
      item.el.style.height = item.height;
    }
  };
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

  // Expandir contenedores padres temporalmente
  const restaurar = expandirPadres(elemento);

  try {
    // Esperar un frame para que el navegador re-renderice
    await new Promise((r) => requestAnimationFrame(r));

    const dataUrl = await toPng(elemento, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = nombreArchivo;
    link.href = dataUrl;
    link.click();
  } finally {
    // Restaurar estilos originales
    restaurar();
  }
}
