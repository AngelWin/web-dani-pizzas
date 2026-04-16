"use client";

import { Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePrinterContext } from "@/components/providers/printer-provider";

const ESTADO_CONFIG = {
  conectado: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    dotColor: "bg-green-500",
    label: "Conectada",
  },
  desconectado: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-500",
    label: "Desconectada",
  },
  conectando: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    dotColor: "bg-blue-500",
    label: "Conectando...",
  },
  imprimiendo: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    dotColor: "bg-blue-500",
    label: "Imprimiendo...",
  },
  error: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    dotColor: "bg-red-500",
    label: "Error",
  },
  no_soportado: {
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted",
    dotColor: "bg-muted-foreground",
    label: "No compatible",
  },
} as const;

export function PrinterStatusIndicator() {
  const { estado, nombreDispositivo, conectar, desconectar } =
    usePrinterContext();

  const config = ESTADO_CONFIG[estado];
  const isClickable =
    estado === "desconectado" || estado === "conectado" || estado === "error";
  const isLoading = estado === "conectando" || estado === "imprimiendo";

  function handleClick() {
    if (estado === "desconectado" || estado === "error") {
      conectar();
    } else if (estado === "conectado") {
      desconectar();
    }
  }

  const tooltipText =
    estado === "no_soportado"
      ? "Usa Chrome o Edge para conectar la impresora Bluetooth"
      : estado === "conectado"
        ? `${nombreDispositivo} — Click para desconectar`
        : estado === "error"
          ? "Error de conexión — Click para reintentar"
          : estado === "desconectado"
            ? "Click para conectar impresora"
            : config.label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={isClickable ? handleClick : undefined}
          disabled={!isClickable}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            config.bgColor,
            config.borderColor,
            config.color,
            isClickable && "cursor-pointer hover:opacity-80",
            !isClickable && "cursor-default opacity-70",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Printer className="h-3.5 w-3.5" />
          )}
          <span className={cn("hidden sm:inline", config.color)}>
            {estado === "conectado" && nombreDispositivo
              ? nombreDispositivo
              : config.label}
          </span>
          <span
            className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)}
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
