"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { SelectorVarianteDialog } from "./selector-variante-dialog";
import { ConfiguradorPizzaDialog } from "./configurador-pizza-dialog";
import type { ProductoPOS } from "@/lib/services/ventas";
import type {
  PizzaSaborConIngredientes,
  ProductoExtra,
} from "@/lib/services/productos";
import type { useCarrito } from "@/hooks/use-carrito";

type Categoria = { id: string; nombre: string };

type Props = {
  productos: ProductoPOS[];
  categorias: Categoria[];
  carrito: ReturnType<typeof useCarrito>;
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  extrasPorCategoria: Record<string, ProductoExtra[]>;
};

export function CatalogoProductos({
  productos,
  categorias,
  carrito,
  saboresPorCategoria,
  extrasPorCategoria,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [productoParaVariante, setProductoParaVariante] =
    useState<ProductoPOS | null>(null);
  const [productoParaConfigurar, setProductoParaConfigurar] =
    useState<ProductoPOS | null>(null);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria =
        !categoriaActiva || p.categoria_id === categoriaActiva;
      const coincideBusqueda =
        !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  function handleClickProducto(producto: ProductoPOS) {
    // Si la categoría tiene sabores → configurador de pizza
    if (producto.categorias?.tiene_sabores) {
      setProductoParaConfigurar(producto);
      return;
    }

    const tieneVariantes = producto.producto_variantes.length > 0;
    if (tieneVariantes) {
      if (producto.producto_variantes.length === 1) {
        const v = producto.producto_variantes[0];
        carrito.agregarItem(producto, {
          id: v.id,
          nombre: v.categoria_medidas?.nombre ?? "",
          precio: v.precio,
        });
      } else {
        setProductoParaVariante(producto);
      }
    } else {
      carrito.agregarItem(producto, null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Filtro por categoría — scroll horizontal en mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
        <Button
          variant={categoriaActiva === null ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0"
          onClick={() => setCategoriaActiva(null)}
        >
          Todos
        </Button>
        {categorias.map((cat) => (
          <Button
            key={cat.id}
            variant={categoriaActiva === cat.id ? "default" : "outline"}
            size="sm"
            className="h-9 shrink-0"
            onClick={() =>
              setCategoriaActiva(cat.id === categoriaActiva ? null : cat.id)
            }
          >
            {cat.nombre}
          </Button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto">
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {productosFiltrados.map((producto) => {
              // Excluir variantes acompañantes (precio 0 / es_acompanante)
              const variantesVenta = producto.producto_variantes.filter(
                (v) => !v.categoria_medidas?.es_acompanante && v.precio > 0,
              );
              const tieneVariantes = variantesVenta.length > 0;
              const precioDesde = tieneVariantes
                ? Math.min(...variantesVenta.map((v) => v.precio))
                : (producto.precio ?? 0);
              const numMedidas = variantesVenta.length;

              return (
                <button
                  key={producto.id}
                  onClick={() => handleClickProducto(producto)}
                  className={cn(
                    "group flex flex-col rounded-xl border bg-card p-3 text-left",
                    "shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all",
                    "hover:border-primary hover:shadow-md active:scale-95",
                    "min-h-[100px]",
                  )}
                >
                  <div className="flex items-start justify-between gap-1 mb-2 flex-1">
                    <span className="font-medium text-sm leading-tight line-clamp-3">
                      {producto.nombre}
                    </span>
                    {numMedidas > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs shrink-0 ml-1"
                      >
                        {numMedidas} {numMedidas === 1 ? "medida" : "medidas"}
                      </Badge>
                    )}
                  </div>
                  <span className="text-primary font-bold text-base">
                    {tieneVariantes
                      ? `Desde ${formatCurrency(precioDesde)}`
                      : formatCurrency(precioDesde)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SelectorVarianteDialog
        producto={productoParaVariante}
        open={productoParaVariante !== null}
        onClose={() => setProductoParaVariante(null)}
        onSelect={(producto, variante) => {
          carrito.agregarItem(producto, variante);
        }}
      />

      <ConfiguradorPizzaDialog
        producto={productoParaConfigurar}
        sabores={
          productoParaConfigurar?.categoria_id
            ? (saboresPorCategoria[productoParaConfigurar.categoria_id] ?? [])
            : []
        }
        extras={
          productoParaConfigurar?.categoria_id
            ? (extrasPorCategoria[productoParaConfigurar.categoria_id] ?? [])
            : []
        }
        open={productoParaConfigurar !== null}
        onClose={() => setProductoParaConfigurar(null)}
        onConfirmar={(data) => {
          carrito.agregarPizza(data);
          setProductoParaConfigurar(null);
        }}
      />
    </div>
  );
}
