"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Pencil,
  CheckCircle2,
  XCircle,
  Plus,
  Armchair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const SucursalForm = dynamic(
  () => import("./sucursal-form").then((mod) => mod.SucursalForm),
  { ssr: false },
);
import { MesaAdminDialog } from "@/components/mesas/mesa-admin-dialog";
import type { Sucursal } from "@/lib/services/sucursales";
import type { Mesa } from "@/lib/services/mesas";

type Props = {
  sucursales: Sucursal[];
  mesasPorSucursal: Record<string, Mesa[]>;
};

export function SucursalesCliente({
  sucursales: inicial,
  mesasPorSucursal,
}: Props) {
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [creando, setCreando] = useState(false);
  const [gestionandoMesas, setGestionandoMesas] = useState<Sucursal | null>(
    null,
  );

  return (
    <>
      {/* Botón nueva sucursal */}
      <div className="flex justify-end">
        <Button
          className="h-10 gap-2 rounded-xl"
          onClick={() => setCreando(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva sucursal
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inicial.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{s.nombre}</p>
                  <div className="mt-0.5">
                    {s.activa ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-green-300 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px] px-1.5 py-0"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-[10px] px-1.5 py-0"
                      >
                        <XCircle className="h-3 w-3" />
                        Inactiva
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl text-xs"
                onClick={() => setEditando(s)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </div>

            {/* Datos */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span>{s.direccion}</span>
              </div>
              {s.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <span>{s.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span>
                  {(mesasPorSucursal[s.id] ?? []).length}{" "}
                  {(mesasPorSucursal[s.id] ?? []).length === 1
                    ? "mesa"
                    : "mesas"}
                </span>
              </div>
            </div>

            {/* Botón gestionar mesas */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-full gap-1.5 rounded-xl text-xs"
              onClick={() => setGestionandoMesas(s)}
            >
              <Armchair className="h-3.5 w-3.5" />
              Gestionar mesas
            </Button>
          </div>
        ))}
      </div>

      {/* Dialog de creación */}
      <Dialog
        open={creando}
        onOpenChange={(open) => !open && setCreando(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
          </DialogHeader>
          <SucursalForm onSuccess={() => setCreando(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
          </DialogHeader>
          {editando && (
            <SucursalForm
              sucursal={editando}
              onSuccess={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de gestión de mesas */}
      {gestionandoMesas && (
        <MesaAdminDialog
          open={!!gestionandoMesas}
          onOpenChange={(open) => !open && setGestionandoMesas(null)}
          sucursal={gestionandoMesas}
          mesas={mesasPorSucursal[gestionandoMesas.id] ?? []}
        />
      )}
    </>
  );
}
