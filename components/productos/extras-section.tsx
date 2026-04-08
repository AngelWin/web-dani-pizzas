"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
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
  createProductoExtraAction,
  updateProductoExtraAction,
  deleteProductoExtraAction,
} from "@/actions/productos";
import { formatCurrency } from "@/lib/utils";
import type { Categoria, ProductoExtra } from "@/lib/services/productos";

// ─── Form de extra ─────────────────────────────────────────────────────────

function ExtraForm({
  categoriaId,
  extra,
  onSuccess,
  onCancel,
}: {
  categoriaId: string;
  extra?: ProductoExtra | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!extra;
  const [nombre, setNombre] = useState(extra?.nombre ?? "");
  const [precio, setPrecio] = useState(String(extra?.precio ?? ""));
  const [disponible, setDisponible] = useState(extra?.disponible ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      toast.error("El precio debe ser un número mayor o igual a 0");
      return;
    }
    setIsSubmitting(true);

    const result = isEditing
      ? await updateProductoExtraAction(extra.id, {
          nombre: nombre.trim(),
          precio: precioNum,
          disponible,
        })
      : await createProductoExtraAction({
          categoria_id: categoriaId,
          nombre: nombre.trim(),
          precio: precioNum,
          disponible,
          orden: 0,
        });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }
    toast.success(isEditing ? "Extra actualizado" : "Extra creado");
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
            placeholder="Extra Queso, Champiñón, Jamón..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Precio (S/.)*</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch
            checked={disponible}
            onCheckedChange={setDisponible}
            id="extra-disponible"
          />
          <Label htmlFor="extra-disponible" className="cursor-pointer">
            Disponible
          </Label>
        </div>
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
              : "Crear extra"}
        </Button>
      </div>
    </form>
  );
}

// ─── Sección principal ─────────────────────────────────────────────────────

interface ExtrasSectionProps {
  categorias: Categoria[];
  extrasPorCategoria: Record<string, ProductoExtra[]>;
  onRefresh: () => void;
}

export function ExtrasSection({
  categorias,
  extrasPorCategoria,
  onRefresh,
}: ExtrasSectionProps) {
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    categorias[0]?.id ?? "",
  );
  const [showForm, setShowForm] = useState(false);
  const [editExtra, setEditExtra] = useState<ProductoExtra | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoriaSeleccionada = categorias.find(
    (c) => c.id === selectedCategoriaId,
  );
  const extras = extrasPorCategoria[selectedCategoriaId] ?? [];

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteProductoExtraAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Extra eliminado");
        setDeleteId(null);
        onRefresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Extras pagados</h3>
          <p className="text-muted-foreground text-sm">
            Toppings o ingredientes adicionales con costo extra
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={!selectedCategoriaId}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo extra
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

      {extras.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Sin extras"
          description={`Agrega extras para ${categoriaSeleccionada?.nombre ?? "esta categoría"}`}
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo extra
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Precio</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {extras.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-medium">{ex.nombre}</TableCell>
                  <TableCell className="text-center font-mono">
                    {formatCurrency(ex.precio)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={ex.disponible ? "default" : "secondary"}>
                      {ex.disponible ? "Disponible" : "No disponible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditExtra(ex)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteId(ex.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog nuevo extra */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nuevo extra — {categoriaSeleccionada?.nombre}
            </DialogTitle>
          </DialogHeader>
          <ExtraForm
            categoriaId={selectedCategoriaId}
            onSuccess={() => {
              setShowForm(false);
              onRefresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog editar extra */}
      <Dialog
        open={!!editExtra}
        onOpenChange={(open) => !open && setEditExtra(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar extra</DialogTitle>
          </DialogHeader>
          {editExtra && (
            <ExtraForm
              categoriaId={selectedCategoriaId}
              extra={editExtra}
              onSuccess={() => {
                setEditExtra(null);
                onRefresh();
              }}
              onCancel={() => setEditExtra(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar extra?"
        description="Se eliminará este extra de la lista del POS."
        confirmLabel="Eliminar"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
