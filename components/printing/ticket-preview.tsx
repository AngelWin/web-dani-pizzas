"use client";

import { forwardRef } from "react";
import type { LineaTicket } from "@/lib/printing/ticket-builder";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  lineas: LineaTicket[];
};

/**
 * Renderiza LineaTicket[] como HTML simulando papel térmico 80mm.
 * Fuente monospace, fondo blanco, ancho fijo.
 * Acepta ref para capturar el contenido como imagen.
 */
export const TicketPreview = forwardRef<HTMLDivElement, Props>(
  function TicketPreview({ lineas }, ref) {
    return (
      <div
        ref={ref}
        className="mx-auto w-[302px] overflow-hidden break-words rounded-lg border bg-white px-3 py-4 font-mono text-[11px] leading-tight text-black shadow-inner dark:border-neutral-300"
      >
        {lineas.map((linea, i) => (
          <TicketLinea key={i} linea={linea} />
        ))}
      </div>
    );
  },
);

function TicketLinea({ linea }: { linea: LineaTicket }) {
  switch (linea.tipo) {
    case "imagen":
      return (
        <div className="mb-1 flex justify-center py-1">
          <Image
            src={linea.src}
            alt="Logo DANI PIZZAS"
            width={linea.ancho ?? 200}
            height={linea.alto ?? 80}
            className="h-auto max-w-[160px]"
            priority
          />
        </div>
      );

    case "titulo":
      return (
        <p className="text-center text-sm font-bold leading-snug">
          {linea.texto}
        </p>
      );

    case "subtitulo":
      return <p className="text-center leading-snug">{linea.texto}</p>;

    case "separador":
      return <div className="my-1 border-t border-dashed border-neutral-400" />;

    case "separador_doble":
      return (
        <div className="my-1 border-t-2 border-double border-neutral-500" />
      );

    case "info":
      if (!linea.valor) {
        return <p className="break-words leading-snug">{linea.etiqueta}</p>;
      }
      return (
        <div className="flex justify-between gap-2 leading-snug">
          <span className="min-w-0 break-words">{linea.etiqueta}</span>
          <span className="shrink-0">{linea.valor}</span>
        </div>
      );

    case "item":
      return (
        <div className="mt-0.5">
          <div className="flex justify-between gap-2 leading-snug">
            <span className="min-w-0 break-words">
              {linea.cantidad}x {linea.nombre}
            </span>
            {linea.precio > 0 && (
              <span className="shrink-0 pl-1">{linea.precio.toFixed(2)}</span>
            )}
          </div>
          {linea.detalles?.map((detalle, j) => (
            <p
              key={j}
              className="break-words pl-3 leading-snug text-neutral-600"
            >
              {detalle}
            </p>
          ))}
        </div>
      );

    case "total_linea":
      return (
        <div
          className={cn(
            "flex justify-between gap-2 leading-snug",
            linea.negrita && "mt-0.5 text-xs font-bold",
          )}
        >
          <span className="min-w-0 break-words">{linea.etiqueta}</span>
          <span className="shrink-0">{linea.valor}</span>
        </div>
      );

    case "texto_centrado":
      return (
        <p className="break-words text-center leading-snug">{linea.texto}</p>
      );

    case "espacio":
      return <div className="h-2" />;

    default:
      return null;
  }
}
