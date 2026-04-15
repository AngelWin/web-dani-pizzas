"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Vault } from "lucide-react";
import { AbrirCajaDialog } from "@/components/caja/abrir-caja-dialog";
import { SesionActiva } from "@/components/caja/sesion-activa";
import type {
  CajaSesionConRelaciones,
  ResumenSesion,
} from "@/lib/services/caja-sesiones";

type Props = {
  rol: string;
  sucursalId: string;
  sucursales: { id: string; nombre: string }[];
  sesionActiva: CajaSesionConRelaciones | null;
  resumenInicial: ResumenSesion | null;
};

export function CajaClient({
  rol,
  sucursalId,
  sesionActiva,
  resumenInicial,
}: Props) {
  const router = useRouter();
  const [abrirOpen, setAbrirOpen] = useState(!sesionActiva);

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Vault className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Control de caja</h1>
          <p className="text-sm text-muted-foreground">
            {sesionActiva
              ? `Sesión abierta · ${sesionActiva.sucursales?.nombre ?? ""}`
              : "No hay sesión activa en esta sucursal"}
          </p>
        </div>
      </div>

      {/* Contenido */}
      {sesionActiva && resumenInicial ? (
        <SesionActiva resumen={resumenInicial} onCerrar={handleRefresh} />
      ) : (
        <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-4">
          <Vault className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
          <div>
            <p className="font-medium">No hay caja abierta</p>
            <p className="text-sm text-muted-foreground mt-1">
              Abre la caja para empezar a registrar ventas del turno.
            </p>
          </div>
          <button
            onClick={() => setAbrirOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
          >
            <Vault className="h-5 w-5" />
            Abrir caja
          </button>
        </div>
      )}

      {/* Dialog abrir caja */}
      <AbrirCajaDialog
        open={abrirOpen}
        sucursalId={sucursalId}
        onSuccess={() => {
          setAbrirOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
