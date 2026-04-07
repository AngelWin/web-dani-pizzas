"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buscarClienteAction } from "@/actions/clientes";
import type { ClienteConMembresia } from "@/lib/services/clientes";

type Estado = "idle" | "no_encontrado" | "error";

type Props = {
  onClienteSeleccionado: (cliente: ClienteConMembresia | null) => void;
  clienteSeleccionado: ClienteConMembresia | null;
};

export function BuscadorCliente({
  onClienteSeleccionado,
  clienteSeleccionado,
}: Props) {
  const [dni, setDni] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleBuscar() {
    if (!dni.trim()) return;
    setEstado("idle");
    setErrorMsg(null);
    startTransition(async () => {
      const result = await buscarClienteAction(dni.trim());
      if (result.error) {
        setEstado("error");
        setErrorMsg(result.error);
        onClienteSeleccionado(null);
      } else if (result.data === null) {
        setEstado("no_encontrado");
        onClienteSeleccionado(null);
      } else {
        setEstado("idle");
        onClienteSeleccionado(result.data);
      }
    });
  }

  function handleLimpiar() {
    setDni("");
    setEstado("idle");
    setErrorMsg(null);
    onClienteSeleccionado(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBuscar();
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Cliente{" "}
        <span className="text-xs font-normal text-muted-foreground">
          (opcional)
        </span>
      </p>

      {/* Campo de búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="DNI o Carnet de Extranjería"
            className="h-11 pr-8"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value.replace(/\D/g, "").slice(0, 12));
              if (clienteSeleccionado) onClienteSeleccionado(null);
              setEstado("idle");
              setErrorMsg(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={pending}
            maxLength={12}
          />
          {(dni || clienteSeleccionado) && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          onClick={handleBuscar}
          disabled={pending || !dni.trim()}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Cliente encontrado */}
      {clienteSeleccionado && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-green-800 dark:text-green-200">
              {clienteSeleccionado.nombre}
              {clienteSeleccionado.apellido
                ? ` ${clienteSeleccionado.apellido}`
                : ""}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              DNI: {clienteSeleccionado.dni}
              {clienteSeleccionado.telefono &&
                ` · ${clienteSeleccionado.telefono}`}
            </p>
            {clienteSeleccionado.membresias && (
              <div
                className={cn(
                  "mt-1.5 flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                )}
              >
                <Star className="h-3 w-3" />
                {clienteSeleccionado.membresias.nivel?.nombre ??
                  "Miembro"} ·{" "}
                {clienteSeleccionado.membresias.puntos_acumulados} pts
                {clienteSeleccionado.membresias.nivel?.descuento_porcentaje &&
                  ` · ${clienteSeleccionado.membresias.nivel.descuento_porcentaje}% desc.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No encontrado */}
      {estado === "no_encontrado" && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          <UserX className="h-4 w-4 shrink-0" />
          <span>
            No se encontró cliente con ese documento. La orden se registrará sin
            cliente.
          </span>
        </div>
      )}

      {/* Error técnico */}
      {estado === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {errorMsg ?? "Error al buscar cliente. Intenta nuevamente."}
          </span>
        </div>
      )}
    </div>
  );
}
