"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Package, Tag } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import dynamic from "next/dynamic";
import { SelectorVarianteDialog } from "./selector-variante-dialog";

const ConfiguradorProductoDialog = dynamic(
  () =>
    import("./configurador-producto-dialog").then(
      (mod) => mod.ConfiguradorProductoDialog,
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
import {
  getDescripcionPromocion,
  productoTienePromo,
} from "@/lib/promociones-utils";
import { CatalogoPromos } from "./catalogo-promos";

type Categoria = { id: string; nombre: string };

type Props = {
  productos: ProductoPOS[];
  categorias: Categoria[];
  carrito: ReturnType<typeof useCarrito>;
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  extrasPorCategoria: Record<string, ProductoExtra[]>;
  promociones: PromocionActivaPOS[];
  onSeleccionarPromo: (promo: PromocionActivaPOS) => void;
};

export function CatalogoProductos({
  productos,
  categorias,
  carrito,
  saboresPorCategoria,
  extrasPorCategoria,
  promociones,
  onSeleccionarPromo,
}: Props) {
  const { formatCurrency } = useCurrency();
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [vistaActiva, setVistaActiva] = useState<"productos" | "promos">(
    "productos",
  );
  const [promoActiva, setPromoActiva] = useState<PromocionActivaPOS | null>(
    null,
  );
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
      // Si hay promo activa, solo mostrar productos elegibles
      const coincidePromo =
        !promoActiva ||
        promoActiva.productos_ids.length === 0 ||
        promoActiva.productos_ids.includes(p.id);
      return coincideCategoria && coincideBusqueda && coincidePromo;
    });
  }, [productos, categoriaActiva, busqueda, promoActiva]);

  // Calcular descuento para un precio según la promo activa
  function calcularPrecioPromo(precio: number): number | null {
    if (!promoActiva) return null;
    if (promoActiva.tipo_promocion === "descuento_porcentaje") {
      return (
        Math.round(precio * (1 - promoActiva.valor_descuento / 100) * 100) / 100
      );
    }
    if (promoActiva.tipo_promocion === "descuento_fijo") {
      return Math.max(0, precio - promoActiva.valor_descuento);
    }
    return null;
  }

  function handleSeleccionarPromoLocal(promo: PromocionActivaPOS) {
    if (
      promo.tipo_promocion === "descuento_porcentaje" ||
      promo.tipo_promocion === "descuento_fijo" ||
      promo.tipo_promocion === "2x1"
    ) {
      // Activar vista filtrada
      setPromoActiva(promo);
      setVistaActiva("productos");
      setCategoriaActiva(null);
    }
    // Delegar al padre para combos y delivery_gratis
    onSeleccionarPromo(promo);
  }

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
        carrito.agregarItem(
          producto,
          {
            id: v.id,
            nombre: v.categoria_medidas?.nombre ?? "",
            precio: v.precio,
            medida_id: v.medida_id,
          },
          promociones,
        );
      } else {
        setProductoParaVariante(producto);
      }
    } else {
      carrito.agregarItem(producto, null, promociones);
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
        {/* Tab Ofertas */}
        {promociones.length > 0 && (
          <Button
            variant={vistaActiva === "promos" ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 shrink-0 gap-1.5",
              vistaActiva === "promos" &&
                "bg-red-500 hover:bg-red-600 text-white",
            )}
            onClick={() =>
              setVistaActiva((v) => (v === "promos" ? "productos" : "promos"))
            }
          >
            <Tag className="h-3.5 w-3.5" />
            Ofertas
            <Badge className="ml-0.5 bg-white/20 text-white text-[9px] px-1.5 py-0">
              {promociones.length}
            </Badge>
          </Button>
        )}

        {/* Categorías (solo si estamos en vista productos) */}
        {vistaActiva === "productos" && (
          <>
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
          </>
        )}
      </div>

      {/* Vista de promos o productos */}
      <div className="flex-1 overflow-y-auto">
        {vistaActiva === "promos" ? (
          <CatalogoPromos
            promociones={promociones}
            productos={productos}
            onSeleccionarPromo={handleSeleccionarPromoLocal}
          />
        ) : (
          <div className="space-y-3">
            {/* Banner de promo activa */}
            {promoActiva && (
              <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      {promoActiva.nombre}
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-500">
                      {getDescripcionPromocion(promoActiva, formatCurrency)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-green-600 hover:text-green-800"
                  onClick={() => setPromoActiva(null)}
                >
                  Quitar
                </Button>
              </div>
            )}

            {productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {productosFiltrados.map((producto) => {
                  const variantesVenta = producto.producto_variantes.filter(
                    (v) => v.precio > 0,
                  );
                  const tieneVariantes = variantesVenta.length > 0;
                  const precioDesde = tieneVariantes
                    ? Math.min(...variantesVenta.map((v) => v.precio))
                    : (producto.precio ?? 0);
                  const precioConPromo = calcularPrecioPromo(precioDesde);
                  const numMedidas = variantesVenta.length;
                  const promoInfo = productoTienePromo(
                    promociones,
                    producto.id,
                  );

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
                          <Badge
                            variant="secondary"
                            className="text-[10px] w-fit"
                          >
                            {numMedidas}{" "}
                            {numMedidas === 1 ? "medida" : "medidas"}
                          </Badge>
                        )}
                        {precioConPromo !== null &&
                        precioConPromo < precioDesde ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground line-through">
                              {tieneVariantes
                                ? `Desde ${formatCurrency(precioDesde)}`
                                : formatCurrency(precioDesde)}
                            </span>
                            <span className="font-inter text-red-600 font-bold text-base tracking-tight">
                              {formatCurrency(precioConPromo)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-inter text-primary font-bold text-base tracking-tight">
                            {tieneVariantes
                              ? `Desde ${formatCurrency(precioDesde)}`
                              : formatCurrency(precioDesde)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <SelectorVarianteDialog
        producto={productoParaVariante}
        open={productoParaVariante !== null}
        onClose={() => setProductoParaVariante(null)}
        onSelect={(producto, variante) => {
          carrito.agregarItem(producto, variante, promociones);
        }}
        promociones={promociones}
      />

      <ConfiguradorProductoDialog
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
          carrito.agregarProductoConfigurado(data, promociones);
          setProductoParaConfigurar(null);
        }}
      />
    </div>
  );
}
