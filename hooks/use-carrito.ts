"use client";

import { useState, useCallback } from "react";
import type { ProductoPOS } from "@/lib/services/ventas";
import type { TipoPromocion } from "@/lib/constants";

export interface SaborOrden {
  sabor_id: string;
  sabor_nombre: string;
  proporcion: string; // "1/1", "1/2", "1/3"
  exclusiones: string[]; // nombres de ingredientes excluidos
}

export interface ExtraOrden {
  extra_id: string;
  nombre: string;
  precio: number;
}

export interface AcompananteOrden {
  variante_id: string;
  variante_nombre: string; // nombre de la medida acompañante (ej: "Mini", "Chiquita")
  sabor_id: string;
  sabor_nombre: string;
}

export type ItemCarrito = {
  key: string; // único por configuración
  producto_id: string;
  variante_id: string | null;
  medida_id: string | null;
  producto_nombre: string;
  variante_nombre: string | null;
  precio_base: number; // precio variante sin extras
  producto_precio: number; // precio_base + extras (alias para compatibilidad)
  cantidad: number;
  subtotal: number;
  notas_item?: string;
  // Solo para pizzas con sabores:
  sabores?: SaborOrden[];
  extras?: ExtraOrden[];
  acompanante?: AcompananteOrden;
};

export type ItemPromoCarrito = {
  key: string;
  tipo: "promo";
  promocion_id: string;
  promo_nombre: string;
  promo_tipo: TipoPromocion;
  precio_promo: number;
  precio_original: number;
  descuento: number;
  items: {
    producto_id: string;
    producto_nombre: string;
    variante_id: string | null;
    variante_nombre: string | null;
    medida_id: string | null;
    precio_unitario: number;
    sabores?: SaborOrden[];
    extras?: ExtraOrden[];
    acompanante?: AcompananteOrden;
  }[];
};

function buildKey(
  productoId: string,
  varianteId: string | null,
  esPizza: boolean,
) {
  if (esPizza) {
    // Cada pizza configurada es un item separado
    return `${productoId}::${varianteId ?? "base"}::${Date.now()}`;
  }
  return `${productoId}::${varianteId ?? "base"}`;
}

function calcularPrecioUnitario(
  precioBase: number,
  extras?: ExtraOrden[],
): number {
  const totalExtras = (extras ?? []).reduce((acc, e) => acc + e.precio, 0);
  return precioBase + totalExtras;
}

function calcularProporciones(numSabores: number): string {
  if (numSabores === 1) return "1/1";
  if (numSabores === 2) return "1/2";
  return "1/3";
}

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [promoItems, setPromoItems] = useState<ItemPromoCarrito[]>([]);

  // Para productos sin sabores (bebidas, postres, etc.) — flujo original
  const agregarItem = useCallback(
    (
      producto: ProductoPOS,
      variante?: {
        id: string;
        nombre: string;
        precio: number;
        medida_id?: string;
      } | null,
    ) => {
      const precioBase = variante?.precio ?? producto.precio ?? 0;
      const varianteId = variante?.id ?? null;
      const varianteNombre = variante?.nombre ?? null;
      const medidaId = variante?.medida_id ?? null;
      const key = buildKey(producto.id, varianteId, false);

      setItems((prev) => {
        const idx = prev.findIndex((i) => i.key === key);
        if (idx !== -1) {
          return prev.map((i, index) =>
            index === idx
              ? {
                  ...i,
                  cantidad: i.cantidad + 1,
                  subtotal: (i.cantidad + 1) * i.producto_precio,
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            key,
            producto_id: producto.id,
            variante_id: varianteId,
            medida_id: medidaId,
            producto_nombre: producto.nombre,
            variante_nombre: varianteNombre,
            precio_base: precioBase,
            producto_precio: precioBase,
            cantidad: 1,
            subtotal: precioBase,
          },
        ];
      });
    },
    [],
  );

  // Para pizzas con sabores configurados
  const agregarPizza = useCallback(
    (data: {
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
    }) => {
      const { producto, variante, sabores, extras, acompanante } = data;
      const precioBase = variante.precio;
      const proporcion = calcularProporciones(sabores.length);
      const saboresConProporcion: SaborOrden[] = sabores.map((s) => ({
        ...s,
        proporcion,
      }));
      const precioUnitario = calcularPrecioUnitario(precioBase, extras);
      const key = buildKey(producto.id, variante.id, true);

      setItems((prev) => [
        ...prev,
        {
          key,
          producto_id: producto.id,
          variante_id: variante.id,
          medida_id: variante.medida_id ?? null,
          producto_nombre: producto.nombre,
          variante_nombre: variante.nombre,
          precio_base: precioBase,
          producto_precio: precioUnitario,
          cantidad: 1,
          subtotal: precioUnitario,
          sabores: saboresConProporcion,
          extras: extras.length > 0 ? extras : undefined,
          acompanante,
        },
      ]);
    },
    [],
  );

  const cambiarCantidad = useCallback((key: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, cantidad, subtotal: cantidad * i.producto_precio }
          : i,
      ),
    );
  }, []);

  const eliminarItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const agregarPromo = useCallback((data: ItemPromoCarrito) => {
    setPromoItems((prev) => [...prev, data]);
  }, []);

  const eliminarPromo = useCallback((key: string) => {
    setPromoItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const limpiarCarrito = useCallback(() => {
    setItems([]);
    setPromoItems([]);
  }, []);

  const subtotalItems = items.reduce((acc, i) => acc + i.subtotal, 0);
  const subtotalPromos = promoItems.reduce((acc, p) => acc + p.precio_promo, 0);
  const subtotal = subtotalItems + subtotalPromos;
  const totalItems =
    items.reduce((acc, i) => acc + i.cantidad, 0) +
    promoItems.reduce((acc, p) => acc + p.items.length, 0);
  const totalDescuentoPromos = promoItems.reduce(
    (acc, p) => acc + p.descuento,
    0,
  );

  return {
    items,
    promoItems,
    agregarItem,
    agregarPizza,
    agregarPromo,
    cambiarCantidad,
    eliminarItem,
    eliminarPromo,
    limpiarCarrito,
    subtotal,
    totalItems,
    totalDescuentoPromos,
    isEmpty: items.length === 0 && promoItems.length === 0,
  };
}
