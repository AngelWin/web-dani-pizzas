"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, PackageOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductosTable } from "@/components/productos/productos-table";
import { ProductoForm } from "@/components/productos/producto-form";
import { CategoriasSection } from "@/components/productos/categorias-section";
import type { Categoria, ProductoConCategoria } from "@/lib/services/productos";

interface ProductosClienteProps {
  productos: ProductoConCategoria[];
  categorias: Categoria[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  searchParam: string;
  categoriaParam: string;
}

export function ProductosCliente({
  productos,
  categorias,
  total,
  page,
  totalPages,
  perPage,
  searchParam,
  categoriaParam,
}: ProductosClienteProps) {
  const router = useRouter();
  const [showNuevo, setShowNuevo] = useState(false);

  const updateParams = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(window.location.search);
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
        else sp.delete(k);
      });
      router.push(`/productos?${sp.toString()}`);
    },
    [router],
  );

  const handleSearch = (value: string) => {
    updateParams({ search: value, page: "1" });
  };

  const handleCategoria = (value: string) => {
    updateParams({ categoria: value === "todas" ? "" : value, page: "1" });
  };

  const handlePage = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  return (
    <>
      <Tabs defaultValue="productos">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowNuevo(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo producto
          </Button>
        </div>

        <TabsContent value="productos" className="mt-4 space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar producto..."
                className="pl-9"
                defaultValue={searchParam}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select
              defaultValue={categoriaParam || "todas"}
              onValueChange={handleCategoria}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          {productos.length === 0 && !searchParam && !categoriaParam ? (
            <EmptyState
              icon={PackageOpen}
              title="Sin productos"
              description="Agrega tu primer producto para comenzar"
              action={
                <Button onClick={() => setShowNuevo(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nuevo producto
                </Button>
              }
            />
          ) : (
            <ProductosTable
              productos={productos}
              categorias={categorias}
              total={total}
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={handlePage}
              onRefresh={() => router.refresh()}
            />
          )}
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <CategoriasSection
            categorias={categorias}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog nuevo producto */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <ProductoForm
            categorias={categorias}
            onSuccess={() => {
              setShowNuevo(false);
              router.refresh();
            }}
            onCancel={() => setShowNuevo(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
