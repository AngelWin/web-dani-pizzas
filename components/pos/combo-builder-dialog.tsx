"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Package, ShoppingCart, Tag } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { PromocionActivaPOS } from "@/lib/services/promociones";
import type { ProductoPOS } from "@/lib/services/ventas";
import type {
  PizzaSaborConIngredientes,
  ProductoExtra,
} from "@/lib/services/productos";
import type { ItemPromoCarrito } from "@/hooks/use-carrito";
import type {
  SaborOrden,
  ExtraOrden,
  AcompananteOrden,
} from "@/hooks/use-carrito";

const ConfiguradorProductoDialog = dynamic(
  () =>
    import("./configurador-producto-dialog").then(
      (mod) => mod.ConfiguradorProductoDialog,
    ),
  { ssr: false },
);

type ProductoConfigCombo = {
  producto_id: string;
  producto_nombre: string;
  variante_id: string | null;
  variante_nombre: string | null;
  medida_id: string | null;
  precio_unitario: number;
  configurado: boolean;
  sabores?: SaborOrden[];
  extras?: ExtraOrden[];
  acompanante?: AcompananteOrden;
};

type Props = {
  open: boolean;
  onClose: () => void;
  promo: PromocionActivaPOS;
  productos: ProductoPOS[];
  saboresPorCategoria: Record<string, PizzaSaborConIngredientes[]>;
  extrasPorCategoria: Record<string, ProductoExtra[]>;
  onAgregarAlCarrito: (item: ItemPromoCarrito) => void;
};

export function ComboBuilderDialog({
  open,
  onClose,
  promo,
  productos,
  saboresPorCategoria,
  extrasPorCategoria,
  onAgregarAlCarrito,
}: Props) {
  const { formatCurrency } = useCurrency();
  const [pasoActual, setPasoActual] = useState(0);
  const [productosConfig, setProductosConfig] = useState<ProductoConfigCombo[]>(
    [],
  );
  // Para abrir el configurador de producto cuando tiene sabores
  const [productoParaConfigurar, setProductoParaConfigurar] = useState<{
    producto: ProductoPOS;
    variante: ProductoPOS["producto_variantes"][number];
    idx: number;
  } | null>(null);

  // Construir pasos del combo:
  // Si hay medidas_ids → cada medida es un paso (mismo producto, medidas diferentes)
  // Si no hay medidas_ids → cada producto es un paso
  type PasoCombo = {
    producto: ProductoPOS;
    medidaForzada: ProductoPOS["producto_variantes"][number] | null;
    label: string;
  };

  const pasosCombo: PasoCombo[] = (() => {
    const productosUnicos = promo.productos_ids
      .map((pid) => productos.find((p) => p.id === pid))
      .filter(Boolean) as ProductoPOS[];

    if (promo.medidas_ids.length > 0) {
      // Crear un paso por cada medida seleccionada en la promo
      const pasos: PasoCombo[] = [];
      for (const prod of productosUnicos) {
        const variantesConMedida = prod.producto_variantes.filter((v) =>
          promo.medidas_ids.includes(v.medida_id),
        );
        if (variantesConMedida.length > 0) {
          for (const v of variantesConMedida) {
            pasos.push({
              producto: prod,
              medidaForzada: v,
              label: `${prod.nombre} (${v.categoria_medidas?.nombre ?? "Medida"})`,
            });
          }
        } else {
          // Producto sin variantes que coincidan → paso normal
          pasos.push({
            producto: prod,
            medidaForzada: null,
            label: prod.nombre,
          });
        }
      }
      return pasos;
    }

    // Sin medidas → un paso por producto
    return productosUnicos.map((p) => ({
      producto: p,
      medidaForzada: null,
      label: p.nombre,
    }));
  })();

  const productosDelCombo = pasosCombo.map((p) => p.producto);

  function inicializarFijo() {
    const items: ProductoConfigCombo[] = pasosCombo.map((paso) => {
      const variante =
        paso.medidaForzada ?? paso.producto.producto_variantes[0] ?? null;
      return {
        producto_id: paso.producto.id,
        producto_nombre: paso.label,
        variante_id: variante?.id ?? null,
        variante_nombre: variante?.categoria_medidas?.nombre ?? null,
        medida_id: variante?.medida_id ?? null,
        precio_unitario: variante?.precio ?? paso.producto.precio ?? 0,
        configurado: true,
      };
    });
    return items;
  }

  function seleccionarVariante(
    productoIdx: number,
    variante: ProductoPOS["producto_variantes"][number],
  ) {
    const prod = productosDelCombo[productoIdx];

    // Si el producto tiene sabores → abrir configurador
    if (prod.categorias?.tiene_sabores) {
      setProductoParaConfigurar({ producto: prod, variante, idx: productoIdx });
      return;
    }

    // Si no tiene sabores → configurar directo
    setProductosConfig((prev) => {
      const nuevo = [...prev];
      nuevo[productoIdx] = {
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        variante_id: variante.id,
        variante_nombre: variante.categoria_medidas?.nombre ?? null,
        medida_id: variante.medida_id,
        precio_unitario: variante.precio,
        configurado: true,
      };
      return nuevo;
    });
    if (productoIdx < productosDelCombo.length - 1) {
      setPasoActual(productoIdx + 1);
    }
  }

  // Callback del ConfiguradorProductoDialog
  function handleConfirmarProducto(data: {
    producto: ProductoPOS;
    variante: {
      id: string;
      nombre: string;
      precio: number;
      medida_id?: string;
    };
    sabores: {
      sabor_id: string;
      sabor_nombre: string;
      exclusiones: string[];
    }[];
    extras: ExtraOrden[];
    acompanante?: AcompananteOrden;
  }) {
    if (!productoParaConfigurar) return;
    const idx = productoParaConfigurar.idx;
    const precioExtras = data.extras.reduce((acc, e) => acc + e.precio, 0);

    setProductosConfig((prev) => {
      const nuevo = [...prev];
      nuevo[idx] = {
        producto_id: data.producto.id,
        producto_nombre: data.producto.nombre,
        variante_id: data.variante.id,
        variante_nombre: data.variante.nombre,
        medida_id: data.variante.medida_id ?? null,
        precio_unitario: data.variante.precio + precioExtras,
        configurado: true,
        sabores: data.sabores.map((s) => ({
          ...s,
          proporcion:
            data.sabores.length === 1
              ? "1/1"
              : data.sabores.length === 2
                ? "1/2"
                : "1/3",
        })),
        extras: data.extras.length > 0 ? data.extras : undefined,
        acompanante: data.acompanante,
      };
      return nuevo;
    });

    setProductoParaConfigurar(null);
    if (idx < productosDelCombo.length - 1) {
      setPasoActual(idx + 1);
    }
  }

  function handleAbrir() {
    if (!promo.permite_modificaciones) {
      setProductosConfig(inicializarFijo());
      setPasoActual(-1);
    } else {
      setProductosConfig(
        pasosCombo.map((paso) => ({
          producto_id: paso.producto.id,
          producto_nombre: paso.label,
          variante_id: null,
          variante_nombre: null,
          medida_id: null,
          precio_unitario: 0,
          configurado: false,
        })),
      );
      setPasoActual(0);
    }
  }

  function handleAgregar() {
    const precioOriginal = productosConfig.reduce(
      (acc, p) => acc + p.precio_unitario,
      0,
    );
    const precioPromo = promo.precio_combo ?? precioOriginal;
    const descuento = Math.max(0, precioOriginal - precioPromo);

    const item: ItemPromoCarrito = {
      key: `promo::${promo.id}::${Date.now()}`,
      tipo: "promo",
      promocion_id: promo.id,
      promo_nombre: promo.nombre,
      promo_tipo: promo.tipo_promocion,
      precio_promo: precioPromo,
      precio_original: precioOriginal,
      descuento,
      items: productosConfig.map((p) => ({
        producto_id: p.producto_id,
        producto_nombre: p.producto_nombre,
        variante_id: p.variante_id,
        variante_nombre: p.variante_nombre,
        medida_id: p.medida_id,
        precio_unitario: p.precio_unitario,
        sabores: p.sabores,
        extras: p.extras,
        acompanante: p.acompanante,
      })),
    };

    onAgregarAlCarrito(item);
    onClose();
  }

  const todosConfigurados =
    productosConfig.length > 0 && productosConfig.every((p) => p.configurado);
  const pasoActualCombo = pasosCombo[pasoActual] ?? null;
  const productoActual = pasoActualCombo?.producto ?? null;

  return (
    <>
      <Dialog
        open={open && !productoParaConfigurar}
        onOpenChange={(v) => {
          if (!v) onClose();
          else handleAbrir();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {promo.nombre}
            </DialogTitle>
          </DialogHeader>

          {/* Preview final o promo fija */}
          {(pasoActual === -1 || todosConfigurados) && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {promo.permite_modificaciones
                  ? "Revisa tu combo antes de agregar"
                  : "Combo con productos predefinidos"}
              </p>

              <div className="space-y-2">
                {productosConfig.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {item.producto_nombre}
                        </p>
                        {item.variante_nombre && (
                          <p className="text-xs text-muted-foreground">
                            {item.variante_nombre}
                          </p>
                        )}
                        {item.sabores && item.sabores.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.sabores
                              .map((s) => s.sabor_nombre)
                              .join(" · ")}
                          </p>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-primary/70">
                            +{item.extras.map((e) => e.nombre).join(", ")}
                          </p>
                        )}
                        {item.acompanante && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            + {item.acompanante.variante_nombre}:{" "}
                            {item.acompanante.sabor_nombre}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.precio_unitario)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Precio normal</span>
                  <span className="line-through">
                    {formatCurrency(
                      productosConfig.reduce(
                        (acc, p) => acc + p.precio_unitario,
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Precio combo</span>
                  <span className="text-primary">
                    {formatCurrency(promo.precio_combo ?? 0)}
                  </span>
                </div>
              </div>

              <Button className="w-full h-12 gap-2" onClick={handleAgregar}>
                <ShoppingCart className="h-4 w-4" />
                Agregar combo al carrito
              </Button>
            </div>
          )}

          {/* Flujo paso a paso */}
          {promo.permite_modificaciones &&
            pasoActual >= 0 &&
            !todosConfigurados &&
            productoActual && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {pasosCombo.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full ${
                        idx < pasoActual
                          ? "bg-green-500"
                          : idx === pasoActual
                            ? "bg-primary"
                            : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Paso {pasoActual + 1} de {pasosCombo.length} — Elige{" "}
                  <strong>
                    {pasoActualCombo?.label ?? productoActual.nombre}
                  </strong>
                  {productoActual.categorias?.tiene_sabores && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[9px] px-1.5 py-0"
                    >
                      Con sabores
                    </Badge>
                  )}
                </p>

                {/* Si hay medida forzada → auto-seleccionar y mostrar botón directo */}
                {pasoActualCombo?.medidaForzada ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-14 flex-col gap-0.5"
                      onClick={() =>
                        seleccionarVariante(
                          pasoActual,
                          pasoActualCombo.medidaForzada!,
                        )
                      }
                    >
                      <span className="font-medium">
                        {pasoActualCombo.medidaForzada.categoria_medidas
                          ?.nombre ?? "Medida"}{" "}
                        — {formatCurrency(pasoActualCombo.medidaForzada.precio)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Toca para elegir sabores
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Selecciona tamaño:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {productoActual.producto_variantes
                        .filter((v) => v.precio > 0)
                        .map((v) => (
                          <Button
                            key={v.id}
                            variant="outline"
                            className="h-14 flex-col gap-0.5"
                            onClick={() => seleccionarVariante(pasoActual, v)}
                          >
                            <span className="font-medium">
                              {v.categoria_medidas?.nombre ?? "Medida"}
                            </span>
                            <span className="text-xs text-primary">
                              {formatCurrency(v.precio)}
                            </span>
                          </Button>
                        ))}
                    </div>

                    {productoActual.producto_variantes.filter(
                      (v) => v.precio > 0,
                    ).length === 0 && (
                      <Button
                        variant="outline"
                        className="w-full h-12"
                        onClick={() => {
                          // Si tiene sabores → abrir configurador
                          if (productoActual.categorias?.tiene_sabores) {
                            setProductoParaConfigurar({
                              producto: productoActual,
                              variante: {
                                id: "",
                                medida_id: "",
                                precio: productoActual.precio ?? 0,
                                disponible: true,
                                orden: 0,
                                categoria_medidas: null,
                              },
                              idx: pasoActual,
                            });
                            return;
                          }
                          setProductosConfig((prev) => {
                            const nuevo = [...prev];
                            nuevo[pasoActual] = {
                              producto_id: productoActual.id,
                              producto_nombre: productoActual.nombre,
                              variante_id: null,
                              variante_nombre: null,
                              medida_id: null,
                              precio_unitario: productoActual.precio ?? 0,
                              configurado: true,
                            };
                            return nuevo;
                          });
                          if (pasoActual < pasosCombo.length - 1) {
                            setPasoActual(pasoActual + 1);
                          }
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {productoActual.nombre} —{" "}
                        {formatCurrency(productoActual.precio ?? 0)}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={onClose}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configurador de producto (sabores/extras) para items del combo */}
      {productoParaConfigurar && (
        <ConfiguradorProductoDialog
          producto={{
            ...productoParaConfigurar.producto,
            // Solo mostrar la variante forzada para que el paso 1 se auto-seleccione
            producto_variantes: [productoParaConfigurar.variante],
          }}
          sabores={
            productoParaConfigurar.producto.categoria_id
              ? (saboresPorCategoria[
                  productoParaConfigurar.producto.categoria_id
                ] ?? [])
              : []
          }
          extras={
            productoParaConfigurar.producto.categoria_id
              ? (extrasPorCategoria[
                  productoParaConfigurar.producto.categoria_id
                ] ?? [])
              : []
          }
          open={!!productoParaConfigurar}
          onClose={() => setProductoParaConfigurar(null)}
          onConfirmar={handleConfirmarProducto}
        />
      )}
    </>
  );
}
