"use client";

import { useState, useCallback } from "react";
import type { ProductoPOS } from "@/lib/services/ventas";

export type ItemCarrito = {
  key: string; // producto_id + variante_id (unique per line)
  producto_id: string;
  variante_id: string | null;
  producto_nombre: string;
  variante_nombre: string | null;
  producto_precio: number;
  cantidad: number;
  subtotal: number;
};

function buildKey(productoId: string, varianteId: string | null) {
  return `${productoId}::${varianteId ?? "base"}`;
}

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const agregarItem = useCallback(
    (
      producto: ProductoPOS,
      variante?: {
        id: string;
        nombre: string;
        precio: number;
      } | null,
    ) => {
      const precio = variante?.precio ?? producto.precio ?? 0;
      const varianteId = variante?.id ?? null;
      const varianteNombre = variante?.nombre ?? null;
      const key = buildKey(producto.id, varianteId);

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
            producto_precio: precio,
            cantidad: 1,
            subtotal: precio,
          },
        ];
      });
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
    cambiarCantidad,
    eliminarItem,
    limpiarCarrito,
    subtotal,
    totalItems,
    isEmpty: items.length === 0,
  };
}
