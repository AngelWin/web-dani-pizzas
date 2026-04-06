"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  categoriaSchema,
  type CategoriaFormValues,
} from "@/lib/validations/productos";
import {
  createCategoriaAction,
  updateCategoriaAction,
  deleteCategoriaAction,
} from "@/actions/productos";
import type { Categoria } from "@/lib/services/productos";
import { Tag } from "lucide-react";

interface CategoriasSectionProps {
  categorias: Categoria[];
  onRefresh: () => void;
}

function CategoriaForm({
  categoria,
  onSuccess,
  onCancel,
}: {
  categoria?: Categoria | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!categoria;
  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      orden: categoria?.orden ?? 0,
      activa: categoria?.activa ?? true,
    },
  });

  const onSubmit = async (values: CategoriaFormValues) => {
    const result = isEditing
      ? await updateCategoriaAction(categoria.id, values)
      : await createCategoriaAction(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Categoría actualizada" : "Categoría creada");
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Pizzas, Bebidas..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="orden"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="activa"
            render={({ field }) => (
              <FormItem className="flex items-end gap-3 space-y-0 pb-1">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Activa</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando..."
              : isEditing
                ? "Guardar"
                : "Crear categoría"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CategoriasSection({
  categorias,
  onRefresh,
}: CategoriasSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editCategoria, setEditCategoria] = useState<Categoria | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteCategoriaAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Categoría eliminada");
        setDeleteId(null);
        onRefresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Categorías</h3>
          <p className="text-muted-foreground text-sm">
            Organiza los productos por categoría
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {categorias.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin categorías"
          description="Crea una categoría para organizar tus productos"
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva categoría
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Orden</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <GripVertical className="text-muted-foreground h-4 w-4" />
                  </TableCell>
                  <TableCell className="font-medium">{cat.nombre}</TableCell>
                  <TableCell className="text-center">{cat.orden}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cat.activa ? "default" : "secondary"}>
                      {cat.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditCategoria(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteId(cat.id)}
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

      {/* Dialog nueva categoría */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <CategoriaForm
            onSuccess={() => {
              setShowForm(false);
              onRefresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog editar categoría */}
      <Dialog
        open={!!editCategoria}
        onOpenChange={(open) => !open && setEditCategoria(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {editCategoria && (
            <CategoriaForm
              categoria={editCategoria}
              onSuccess={() => {
                setEditCategoria(null);
                onRefresh();
              }}
              onCancel={() => setEditCategoria(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar categoría?"
        description="Solo se puede eliminar si no tiene productos asociados."
        confirmLabel="Eliminar"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
