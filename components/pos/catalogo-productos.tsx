"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import dynamic from "next/dynamic";
import { SelectorVarianteDialog } from "./selector-variante-dialog";

const ConfiguradorPizzaDialog = dynamic(
  () =>
    import("./configurador-pizza-dialog").then(
      (mod) => mod.ConfiguradorPizzaDialog,
    ),
  { ssr: false },
);
import type { ProductoPOS } from "@/lib/services/ventas";
import type {
  PizzaSaborConIngredientes,
  ProductoExtra,
} from "@/lib/services/productos";
import type { useCarrito } from "@/hooks/use-carrito";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import { productoTienePromo } from "@/lib/promociones-utils";

type Categoria = { id: string; nombre: string };

type Props = {
  productos: ProductoPOS[];
  categorias: Categoria[];
  carrito: ReturnType<typeof useCarrito>;
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  extrasPorCategoria: Record<string, ProductoExtra[]>;
  promociones: PromocionActivaPOS[];
};

export function CatalogoProductos({
  productos,
  categorias,
  carrito,
  saboresPorCategoria,
  extrasPorCategoria,
  promociones,
}: Props) {
  const { formatCurrency } = useCurrency();
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
          medida_id: v.medida_id,
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
              // Solo excluir variantes sin precio (las acompañantes sí se cuentan)
              const variantesVenta = producto.producto_variantes.filter(
                (v) => v.precio > 0,
              );
              const tieneVariantes = variantesVenta.length > 0;
              const precioDesde = tieneVariantes
                ? Math.min(...variantesVenta.map((v) => v.precio))
                : (producto.precio ?? 0);
              const numMedidas = variantesVenta.length;
              const promoInfo = productoTienePromo(promociones, producto.id);

              return (
                <button
                  key={producto.id}
                  onClick={() => handleClickProducto(producto)}
                  className={cn(
                    "group flex flex-col rounded-xl border bg-card overflow-hidden text-left",
                    "shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all",
                    "hover:border-primary hover:shadow-md active:scale-[0.97]",
                    promoInfo.tienePromo && "ring-1 ring-red-400/50",
                  )}
                >
                  {/* Imagen */}
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {promoInfo.tienePromo && (
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 font-bold shadow-sm">
                          {promoInfo.etiqueta}
                        </Badge>
                      </div>
                    )}
                    {producto.imagen_url ? (
                      <Image
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                        <Package className="h-10 w-10" />
                        <span className="text-xs mt-1">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 p-3">
                    <span className="font-medium text-sm leading-tight line-clamp-2">
                      {producto.nombre}
                    </span>
                    {numMedidas > 0 && (
                      <Badge variant="secondary" className="text-[10px] w-fit">
                        {numMedidas} {numMedidas === 1 ? "medida" : "medidas"}
                      </Badge>
                    )}
                    <span className="font-inter text-primary font-bold text-base tracking-tight">
                      {tieneVariantes
                        ? `Desde ${formatCurrency(precioDesde)}`
                        : formatCurrency(precioDesde)}
                    </span>
                  </div>
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
        promociones={promociones}
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
        promociones={promociones}
        onConfirmar={(data) => {
          carrito.agregarPizza(data);
          setProductoParaConfigurar(null);
        }}
      />
    </div>
  );
}
