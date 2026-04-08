"use client";

import { useState, useCallback } from "react";
import type { ProductoPOS } from "@/lib/services/ventas";

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

export type ItemCarrito = {
  key: string; // único por configuración
  producto_id: string;
  variante_id: string | null;
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

  // Para productos sin sabores (bebidas, postres, etc.) — flujo original
  const agregarItem = useCallback(
    (
      producto: ProductoPOS,
      variante?: {
        id: string;
        nombre: string;
        precio: number;
      } | null,
    ) => {
      const precioBase = variante?.precio ?? producto.precio ?? 0;
      const varianteId = variante?.id ?? null;
      const varianteNombre = variante?.nombre ?? null;
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
      variante: { id: string; nombre: string; precio: number };
      sabores: {
        sabor_id: string;
        sabor_nombre: string;
        exclusiones: string[];
      }[];
      extras: ExtraOrden[];
    }) => {
      const { producto, variante, sabores, extras } = data;
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
          producto_nombre: producto.nombre,
          variante_nombre: variante.nombre,
          precio_base: precioBase,
          producto_precio: precioUnitario,
          cantidad: 1,
          subtotal: precioUnitario,
          sabores: saboresConProporcion,
          extras: extras.length > 0 ? extras : undefined,
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

  const limpiarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return {
    items,
    agregarItem,
    agregarPizza,
    cambiarCantidad,
    eliminarItem,
    limpiarCarrito,
    subtotal,
    totalItems,
    isEmpty: items.length === 0,
  };
}
