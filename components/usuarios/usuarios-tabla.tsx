"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CrearUsuarioForm, EditarUsuarioForm } from "./usuario-form";
import { eliminarUsuarioAction } from "@/actions/usuarios";
import type { UsuarioCompleto, Rol, Sucursal } from "@/lib/services/usuarios";

type Props = {
  usuarios: UsuarioCompleto[];
  roles: Rol[];
  sucursales: Sucursal[];
  perfilActualId: string;
};

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  activo: {
    label: "Activo",
    className:
      "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400",
  },
  inactivo: {
    label: "Inactivo",
    className:
      "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
  },
};

export function UsuariosTabla({
  usuarios,
  roles,
  sucursales,
  perfilActualId,
}: Props) {
  const [crearOpen, setCrearOpen] = useState(false);
  const [editando, setEditando] = useState<UsuarioCompleto | null>(null);
  const [eliminando, setEliminando] = useState<UsuarioCompleto | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEliminar() {
    if (!eliminando) return;
    const esAdmin = eliminando.rol_nombre === "administrador";
    startTransition(async () => {
      const result = await eliminarUsuarioAction(eliminando.id, esAdmin);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuario eliminado");
        setEliminando(null);
      }
    });
  }

  return (
    <>
      {/* Header con botón crear */}
      <div className="flex justify-end">
        <Button
          className="h-10 gap-2 rounded-xl"
          onClick={() => setCrearOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((u) => {
              const esMiPerfil = u.id === perfilActualId;
              const estadoCfg = ESTADO_CONFIG[u.estado] ?? {
                label: u.estado,
                className: "",
              };
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {`${u.nombre} ${u.apellido_paterno}`}
                      {esMiPerfil && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
                        >
                          Tú
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {u.rol_nombre ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.sucursal_nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${estadoCfg.className}`}
                    >
                      {estadoCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setEditando(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!esMiPerfil && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => setEliminando(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog crear */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <CrearUsuarioForm
            roles={roles}
            sucursales={sucursales}
            onSuccess={() => setCrearOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog editar */}
      <Dialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editando && (
            <EditarUsuarioForm
              usuario={editando}
              roles={roles}
              sucursales={sucursales}
              onSuccess={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm eliminar */}
      <ConfirmDialog
        open={!!eliminando}
        onOpenChange={(open) => !open && setEliminando(null)}
        title="Eliminar usuario"
        description={
          eliminando?.rol_nombre === "administrador"
            ? `¿Eliminar al administrador ${eliminando?.nombre} ${eliminando?.apellido_paterno}? Solo es posible si hay otro administrador activo.`
            : `¿Eliminar a ${eliminando?.nombre} ${eliminando?.apellido_paterno}? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        variant="destructive"
        loading={isPending}
        onConfirm={handleEliminar}
      />
    </>
  );
}
