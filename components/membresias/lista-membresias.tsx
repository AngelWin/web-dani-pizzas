"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Award,
  Coins,
  Pencil,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const FormularioNivelDialog = dynamic(
  () =>
    import("./formulario-nivel-dialog").then(
      (mod) => mod.FormularioNivelDialog,
    ),
  { ssr: false },
);

const FormularioReglaDialog = dynamic(
  () =>
    import("./formulario-regla-dialog").then(
      (mod) => mod.FormularioReglaDialog,
    ),
  { ssr: false },
);
import {
  deleteNivelMembresiaAction,
  deleteReglaPuntosAction,
  toggleReglaPuntosActivaAction,
  desactivarMembresiaAction,
} from "@/actions/membresias";
import type {
  NivelMembresia,
  ReglaPuntos,
  MembresiaConCliente,
} from "@/lib/services/membresias";
import { useCurrency } from "@/hooks/use-currency";

const AsignarMembresiaDialog = dynamic(
  () =>
    import("./asignar-membresia-dialog").then(
      (mod) => mod.AsignarMembresiaDialog,
    ),
  { ssr: false },
);

const NIVEL_COLORES = [
  "from-amber-600 to-amber-400",
  "from-slate-400 to-slate-300",
  "from-yellow-500 to-yellow-300",
  "from-cyan-500 to-cyan-300",
  "from-purple-500 to-purple-300",
];

type Props = {
  niveles: NivelMembresia[];
  reglas: ReglaPuntos[];
  miembros: MembresiaConCliente[];
};

export function ListaMembresias({
  niveles: inicial,
  reglas: inicialesReglas,
  miembros: inicialesMiembros,
}: Props) {
  const [niveles, setNiveles] = useState<NivelMembresia[]>(inicial);
  const [reglas, setReglas] = useState<ReglaPuntos[]>(inicialesReglas);
  const { simbolo } = useCurrency();

  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);
  const [nivelDialogOpen, setNivelDialogOpen] = useState(false);
  const [editandoNivel, setEditandoNivel] = useState<NivelMembresia | null>(
    null,
  );
  const [eliminandoNivel, setEliminandoNivel] = useState<NivelMembresia | null>(
    null,
  );

  const [reglaDialogOpen, setReglaDialogOpen] = useState(false);
  const [editandoRegla, setEditandoRegla] = useState<ReglaPuntos | null>(null);
  const [eliminandoRegla, setEliminandoRegla] = useState<ReglaPuntos | null>(
    null,
  );

  const [isPending, startTransition] = useTransition();

  // ── Niveles ────────────────────────────────────────────────────────────────

  function handleNuevoNivel() {
    setEditandoNivel(null);
    setNivelDialogOpen(true);
  }

  function handleEditarNivel(nivel: NivelMembresia) {
    setEditandoNivel(nivel);
    setNivelDialogOpen(true);
  }

  function handleCerrarNivelDialog() {
    setNivelDialogOpen(false);
    setEditandoNivel(null);
  }

  function handleEliminarNivel() {
    if (!eliminandoNivel) return;
    const id = eliminandoNivel.id;
    startTransition(async () => {
      const result = await deleteNivelMembresiaAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNiveles((prev) => prev.filter((n) => n.id !== id));
      setEliminandoNivel(null);
      toast.success("Nivel eliminado");
    });
  }

  // ── Reglas ─────────────────────────────────────────────────────────────────

  function handleNuevaRegla() {
    setEditandoRegla(null);
    setReglaDialogOpen(true);
  }

  function handleEditarRegla(regla: ReglaPuntos) {
    setEditandoRegla(regla);
    setReglaDialogOpen(true);
  }

  function handleCerrarReglaDialog() {
    setReglaDialogOpen(false);
    setEditandoRegla(null);
  }

  function handleToggleRegla(regla: ReglaPuntos, activa: boolean) {
    startTransition(async () => {
      const result = await toggleReglaPuntosActivaAction(regla.id, activa);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setReglas((prev) =>
        prev.map((r) => (r.id === regla.id ? { ...r, activa } : r)),
      );
      toast.success(activa ? "Regla activada" : "Regla desactivada");
    });
  }

  function handleEliminarRegla() {
    if (!eliminandoRegla) return;
    const id = eliminandoRegla.id;
    startTransition(async () => {
      const result = await deleteReglaPuntosAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setReglas((prev) => prev.filter((r) => r.id !== id));
      setEliminandoRegla(null);
      toast.success("Regla eliminada");
    });
  }

  return (
    <>
      <Tabs defaultValue="niveles">
        <TabsList className="h-10">
          <TabsTrigger value="niveles" className="gap-2">
            <Award className="h-4 w-4" />
            Niveles
            {niveles.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {niveles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reglas" className="gap-2">
            <Coins className="h-4 w-4" />
            Reglas de puntos
            {reglas.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {reglas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="miembros" className="gap-2">
            <Star className="h-4 w-4" />
            Miembros
            {inicialesMiembros.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {inicialesMiembros.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Niveles ────────────────────────────────────────────────── */}
        <TabsContent value="niveles" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {niveles.length === 0
                ? "Sin niveles registrados"
                : `${niveles.length} nivel${niveles.length !== 1 ? "es" : ""}`}
            </p>
            <Button className="h-10 gap-2" onClick={handleNuevoNivel}>
              <Plus className="h-4 w-4" />
              Nuevo nivel
            </Button>
          </div>

          {niveles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <Award className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">Sin niveles</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Crea niveles como Bronce, Plata u Oro para tu programa de
                membresías
              </p>
              <Button className="mt-4 h-10 gap-2" onClick={handleNuevoNivel}>
                <Plus className="h-4 w-4" />
                Nuevo nivel
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {niveles.map((nivel, idx) => (
                <div
                  key={nivel.id}
                  className="rounded-xl border border-border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden"
                >
                  {/* Cabecera con degradado */}
                  <div
                    className={`bg-gradient-to-r ${NIVEL_COLORES[idx % NIVEL_COLORES.length]} p-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-white" />
                        <span className="font-bold text-white">
                          {nivel.nombre}
                        </span>
                      </div>
                      {nivel.orden !== null && nivel.orden !== undefined && (
                        <Badge className="bg-white/20 text-white text-[10px] border-0">
                          #{nivel.orden}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">
                          Puntos requeridos
                        </p>
                        <p className="font-bold text-foreground">
                          {nivel.puntos_requeridos.toLocaleString("es-PE")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">
                          Descuento
                        </p>
                        <p className="font-bold text-primary">
                          {nivel.descuento_porcentaje ?? 0}%
                        </p>
                      </div>
                    </div>

                    {nivel.beneficios && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {nivel.beneficios}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 gap-1.5 rounded-xl text-xs"
                        onClick={() => handleEditarNivel(nivel)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-xl text-xs text-destructive hover:text-destructive"
                        onClick={() => setEliminandoNivel(nivel)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Reglas de Puntos ───────────────────────────────────────── */}
        <TabsContent value="reglas" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {reglas.length === 0
                ? "Sin reglas registradas"
                : `${reglas.length} regla${reglas.length !== 1 ? "s" : ""}`}
            </p>
            <Button className="h-10 gap-2" onClick={handleNuevaRegla}>
              <Plus className="h-4 w-4" />
              Nueva regla
            </Button>
          </div>

          {reglas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <Coins className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">Sin reglas</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Define cómo los clientes acumulan puntos en cada compra
              </p>
              <Button className="mt-4 h-10 gap-2" onClick={handleNuevaRegla}>
                <Plus className="h-4 w-4" />
                Nueva regla
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {reglas.map((regla) => (
                <div
                  key={regla.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {regla.nombre}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            regla.activa
                              ? "mt-0.5 gap-1 border-green-300 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px] px-1.5 py-0"
                              : "mt-0.5 gap-1 border-gray-300 text-gray-500 text-[10px] px-1.5 py-0"
                          }
                        >
                          {regla.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={regla.activa ?? false}
                      onCheckedChange={(v) => handleToggleRegla(regla, v)}
                      disabled={isPending}
                      className="shrink-0 mt-1"
                    />
                  </div>

                  {regla.descripcion && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {regla.descripcion}
                    </p>
                  )}

                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-primary">
                      {regla.puntos_otorgados} punto
                      {regla.puntos_otorgados !== 1 ? "s" : ""} por cada{" "}
                      {simbolo} {regla.soles_por_punto}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 gap-1.5 rounded-xl text-xs"
                      onClick={() => handleEditarRegla(regla)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 rounded-xl text-xs text-destructive hover:text-destructive"
                      onClick={() => setEliminandoRegla(regla)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Miembros ──────────────────────────────────────────────── */}
        <TabsContent value="miembros" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {inicialesMiembros.length === 0
                ? "Sin miembros registrados"
                : `${inicialesMiembros.length} miembro${inicialesMiembros.length !== 1 ? "s" : ""}`}
            </p>
            <Button
              className="h-10 gap-2"
              onClick={() => setAsignarDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Asignar membresía
            </Button>
          </div>

          {inicialesMiembros.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">
                No hay miembros
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Asigna membresías a tus clientes
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {inicialesMiembros.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {m.cliente?.nombre} {m.cliente?.apellido ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DNI: {m.cliente?.dni ?? "—"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        m.activa
                          ? "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px]"
                          : "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-[10px]"
                      }
                    >
                      {m.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Nivel</span>
                      <span className="font-medium text-foreground">
                        {m.nivel?.nombre ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plan</span>
                      <span className="font-medium text-foreground">
                        {m.tipo_plan === "mensual"
                          ? "Mensual"
                          : m.tipo_plan === "trimestral"
                            ? "Trimestral"
                            : m.tipo_plan === "anual"
                              ? "Anual"
                              : (m.tipo_plan ?? "—")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Puntos</span>
                      <span className="font-medium text-foreground">
                        {m.puntos_acumulados}
                      </span>
                    </div>
                    {m.fecha_ultimo_pago && (
                      <div className="flex justify-between">
                        <span>Último pago</span>
                        <span className="font-medium text-foreground">
                          {new Date(m.fecha_ultimo_pago).toLocaleDateString(
                            "es-PE",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                    )}
                    {m.fecha_fin && (
                      <div className="flex justify-between">
                        <span>Vence</span>
                        <span
                          className={`font-medium ${new Date(m.fecha_fin) < new Date() ? "text-red-600" : "text-foreground"}`}
                        >
                          {new Date(m.fecha_fin).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {m.activa && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs text-destructive hover:text-destructive"
                      onClick={async () => {
                        const result = await desactivarMembresiaAction(m.id);
                        if (result.error) toast.error(result.error);
                        else toast.success("Membresía desactivada");
                      }}
                    >
                      Desactivar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs niveles */}
      <FormularioNivelDialog
        open={nivelDialogOpen}
        onClose={handleCerrarNivelDialog}
        nivel={editandoNivel}
      />

      <AlertDialog
        open={!!eliminandoNivel}
        onOpenChange={(v) => !v && setEliminandoNivel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nivel?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el nivel{" "}
              <strong>{eliminandoNivel?.nombre}</strong>. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminarNivel}
              disabled={isPending}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs reglas */}
      <FormularioReglaDialog
        open={reglaDialogOpen}
        onClose={handleCerrarReglaDialog}
        regla={editandoRegla}
      />

      <AlertDialog
        open={!!eliminandoRegla}
        onOpenChange={(v) => !v && setEliminandoRegla(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la regla{" "}
              <strong>{eliminandoRegla?.nombre}</strong>. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminarRegla}
              disabled={isPending}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog asignar membresía */}
      <AsignarMembresiaDialog
        open={asignarDialogOpen}
        onClose={() => setAsignarDialogOpen(false)}
        niveles={niveles}
      />
    </>
  );
}
