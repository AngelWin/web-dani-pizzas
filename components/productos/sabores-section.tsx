"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Flame,
  X,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  createPizzaSaborAction,
  updatePizzaSaborAction,
  deletePizzaSaborAction,
  upsertSaborIngredientesAction,
} from "@/actions/productos";
import type {
  Categoria,
  PizzaSaborConIngredientes,
  SaborIngrediente,
} from "@/lib/services/productos";

// ─── Form de sabor ─────────────────────────────────────────────────────────

function SaborForm({
  categoriaId,
  sabor,
  onSuccess,
  onCancel,
}: {
  categoriaId: string;
  sabor?: PizzaSaborConIngredientes | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!sabor;
  const [nombre, setNombre] = useState(sabor?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(sabor?.descripcion ?? "");
  const [disponible, setDisponible] = useState(sabor?.disponible ?? true);
  const [ingredientes, setIngredientes] = useState<
    { nombre: string; es_principal: boolean; orden: number }[]
  >(
    (sabor?.sabor_ingredientes ?? []).map((i) => ({
      nombre: i.nombre,
      es_principal: i.es_principal,
      orden: i.orden,
    })),
  );
  const [nuevoIngrediente, setNuevoIngrediente] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agregarIngrediente = () => {
    const trimmed = nuevoIngrediente.trim();
    if (!trimmed) return;
    setIngredientes((prev) => [
      ...prev,
      { nombre: trimmed, es_principal: false, orden: prev.length },
    ]);
    setNuevoIngrediente("");
  };

  const eliminarIngrediente = (idx: number) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== idx));
  };

  const togglePrincipal = (idx: number) => {
    setIngredientes((prev) =>
      prev.map((ing, i) =>
        i === idx ? { ...ing, es_principal: !ing.es_principal } : ing,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setIsSubmitting(true);

    let saborId = sabor?.id;

    if (isEditing && saborId) {
      const result = await updatePizzaSaborAction(saborId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        disponible,
      });
      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }
    } else {
      const result = await createPizzaSaborAction({
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        disponible,
        orden: 0,
      });
      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }
      saborId = result.data?.id;
    }

    if (saborId) {
      const ingResult = await upsertSaborIngredientesAction(
        saborId,
        ingredientes.map((ing, idx) => ({ ...ing, orden: idx })),
      );
      if (ingResult.error) {
        toast.error(ingResult.error);
        setIsSubmitting(false);
        return;
      }
    }

    toast.success(isEditing ? "Sabor actualizado" : "Sabor creado");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Nombre *</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Americana, Hawaiana, Marina..."
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Descripción</Label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción opcional..."
          />
        </div>
        <div className="flex items-center gap-3 col-span-2">
          <Switch
            checked={disponible}
            onCheckedChange={setDisponible}
            id="sabor-disponible"
          />
          <Label htmlFor="sabor-disponible" className="cursor-pointer">
            Disponible
          </Label>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="space-y-2">
        <Label>Ingredientes</Label>
        <p className="text-xs text-muted-foreground">
          Agrega los ingredientes para permitir exclusiones en el POS
        </p>
        <div className="flex gap-2">
          <Input
            value={nuevoIngrediente}
            onChange={(e) => setNuevoIngrediente(e.target.value)}
            placeholder="Nombre del ingrediente..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarIngrediente();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={agregarIngrediente}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {ingredientes.length > 0 && (
          <div className="rounded-lg border divide-y">
            {ingredientes.map((ing, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="flex-1">{ing.nombre}</span>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={ing.es_principal}
                    onCheckedChange={() => togglePrincipal(idx)}
                    id={`principal-${idx}`}
                  />
                  <Label
                    htmlFor={`principal-${idx}`}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Principal
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => eliminarIngrediente(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Guardar"
              : "Crear sabor"}
        </Button>
      </div>
    </form>
  );
}

// ─── Panel de ingredientes (solo lectura, expandible) ─────────────────────

function IngredientesPanel({
  ingredientes,
}: {
  ingredientes: SaborIngrediente[];
}) {
  if (ingredientes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-6 py-2">
        Sin ingredientes registrados
      </p>
    );
  }
  return (
    <div className="px-6 py-2 flex flex-wrap gap-1.5">
      {ingredientes.map((ing) => (
        <Badge
          key={ing.id}
          variant={ing.es_principal ? "default" : "secondary"}
          className="text-xs"
        >
          {ing.nombre}
        </Badge>
      ))}
    </div>
  );
}

// ─── Sección principal ─────────────────────────────────────────────────────

interface SaboresSectionProps {
  categorias: Categoria[];
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  onRefresh: () => void;
}

export function SaboresSection({
  categorias,
  saboresPorCategoria,
  onRefresh,
}: SaboresSectionProps) {
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    categorias[0]?.id ?? "",
  );
  const [showForm, setShowForm] = useState(false);
  const [editSabor, setEditSabor] = useState<PizzaSaborConIngredientes | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoriaSeleccionada = categorias.find(
    (c) => c.id === selectedCategoriaId,
  );
  const sabores = saboresPorCategoria[selectedCategoriaId] ?? [];

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deletePizzaSaborAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sabor eliminado");
        setDeleteId(null);
        onRefresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Sabores de Pizza</h3>
          <p className="text-muted-foreground text-sm">
            Define los sabores disponibles y sus ingredientes (para exclusiones
            en el POS)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={!selectedCategoriaId}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo sabor
        </Button>
      </div>

      {/* Selector de categoría */}
      {categorias.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categorias.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategoriaId === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategoriaId(cat.id)}
            >
              {cat.nombre}
            </Button>
          ))}
        </div>
      )}

      {sabores.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Sin sabores"
          description={`Crea sabores para ${categoriaSeleccionada?.nombre ?? "esta categoría"}`}
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo sabor
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Sabor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Ingredientes</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sabores.map((s) => {
                const isExpanded = expandedId === s.id;
                return (
                  <>
                    <TableRow key={s.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setExpandedId((prev) =>
                              prev === s.id ? null : s.id,
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{s.nombre}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.descripcion ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {s.sabor_ingredientes.length === 0
                            ? "Sin ingredientes"
                            : `${s.sabor_ingredientes.length} ingrediente${s.sabor_ingredientes.length !== 1 ? "s" : ""}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.disponible ? "default" : "secondary"}>
                          {s.disponible ? "Disponible" : "No disponible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditSabor(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${s.id}-ing`}>
                        <TableCell colSpan={6} className="p-0 bg-muted/30">
                          <IngredientesPanel
                            ingredientes={s.sabor_ingredientes}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog nuevo sabor */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Nuevo sabor — {categoriaSeleccionada?.nombre}
            </DialogTitle>
          </DialogHeader>
          <SaborForm
            categoriaId={selectedCategoriaId}
            onSuccess={() => {
              setShowForm(false);
              onRefresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog editar sabor */}
      <Dialog
        open={!!editSabor}
        onOpenChange={(open) => !open && setEditSabor(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar sabor</DialogTitle>
          </DialogHeader>
          {editSabor && (
            <SaborForm
              categoriaId={selectedCategoriaId}
              sabor={editSabor}
              onSuccess={() => {
                setEditSabor(null);
                onRefresh();
              }}
              onCancel={() => setEditSabor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar sabor?"
        description="Se eliminarán también todos sus ingredientes."
        confirmLabel="Eliminar"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
