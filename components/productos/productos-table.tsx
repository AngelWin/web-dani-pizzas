"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, MoreHorizontal, Loader2, Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import dynamic from "next/dynamic";
import { useCurrency } from "@/hooks/use-currency";

const ProductoForm = dynamic(
  () =>
    import("@/components/productos/producto-form").then(
      (mod) => mod.ProductoForm,
    ),
  { ssr: false },
);
import {
  deleteProductoAction,
  toggleDisponibleAction,
  getProductoCompletoAction,
} from "@/actions/productos";
import type {
  Categoria,
  CategoriaMedida,
  ProductoCompleto,
  ProductoConCategoria,
  Sucursal,
} from "@/lib/services/productos";

interface ProductosTableProps {
  productos: ProductoConCategoria[];
  categorias: Categoria[];
  categoriaMedidas: Record<string, CategoriaMedida[]>;
  sucursales: Sucursal[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function ProductosTable({
  productos,
  categorias,
  categoriaMedidas,
  sucursales,
  total,
  page,
  totalPages,
  perPage,
  onPageChange,
  onRefresh,
}: ProductosTableProps) {
  const [editProducto, setEditProducto] = useState<ProductoCompleto | null>(
    null,
  );
  const [duplicateProducto, setDuplicateProducto] =
    useState<ProductoCompleto | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [loadingDuplicateId, setLoadingDuplicateId] = useState<string | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { formatCurrency } = useCurrency();

  const handleEditClick = async (id: string) => {
    setLoadingEditId(id);
    const result = await getProductoCompletoAction(id);
    setLoadingEditId(null);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Error al cargar el producto");
      return;
    }
    setEditProducto(result.data);
  };

  const handleDuplicateClick = async (id: string) => {
    setLoadingDuplicateId(id);
    const result = await getProductoCompletoAction(id);
    setLoadingDuplicateId(null);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Error al cargar el producto");
      return;
    }
    setDuplicateProducto(result.data);
  };

  const handleToggleDisponible = (id: string, disponible: boolean) => {
    startTransition(async () => {
      const result = await toggleDisponibleAction(id, disponible);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          disponible ? "Producto disponible" : "Producto no disponible",
        );
        onRefresh();
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteProductoAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Producto eliminado");
        setDeleteId(null);
        onRefresh();
      }
    });
  };

  return (
    <>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Disponible</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-12 text-center"
                >
                  No hay productos
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {p.descripcion}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.categorias ? (
                      <Badge variant="secondary">{p.categorias.nombre}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {p.precio != null ? (
                      formatCurrency(Number(p.precio))
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Por variante
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={p.disponible ?? false}
                      disabled={isPending}
                      onCheckedChange={(val) =>
                        handleToggleDisponible(p.id, val)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {loadingEditId === p.id ||
                          loadingDuplicateId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditClick(p.id)}
                          disabled={
                            loadingEditId === p.id ||
                            loadingDuplicateId === p.id
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateClick(p.id)}
                          disabled={
                            loadingEditId === p.id ||
                            loadingDuplicateId === p.id
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPageChange={onPageChange}
      />

      {/* Dialog editar */}
      <Dialog
        open={!!editProducto}
        onOpenChange={(open) => !open && setEditProducto(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {editProducto && (
            <ProductoForm
              producto={editProducto}
              categorias={categorias}
              categoriaMedidas={categoriaMedidas}
              sucursales={sucursales}
              onSuccess={() => {
                setEditProducto(null);
                onRefresh();
              }}
              onCancel={() => setEditProducto(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog duplicar */}
      <Dialog
        open={!!duplicateProducto}
        onOpenChange={(open) => !open && setDuplicateProducto(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Duplicar producto</DialogTitle>
          </DialogHeader>
          {duplicateProducto && (
            <ProductoForm
              producto={duplicateProducto}
              isDuplicate
              categorias={categorias}
              categoriaMedidas={categoriaMedidas}
              sucursales={sucursales}
              onSuccess={() => {
                setDuplicateProducto(null);
                onRefresh();
              }}
              onCancel={() => setDuplicateProducto(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar producto?"
        description="Esta acción no se puede deshacer. El producto será eliminado permanentemente."
        confirmLabel="Eliminar"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
