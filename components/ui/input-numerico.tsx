"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variante = "entero" | "precio" | "porcentaje" | "cantidad";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "step" | "onChange" | "value"
> & {
  variante?: Variante;
  value?: number | string | null;
  onChange?: (value: number | null) => void;
  allowNull?: boolean;
};

const CONFIG: Record<
  Variante,
  { step: string; min: number; max?: number; inputMode: "numeric" | "decimal" }
> = {
  entero: { step: "1", min: 0, inputMode: "numeric" },
  precio: { step: "any", min: 0, inputMode: "decimal" },
  porcentaje: { step: "any", min: 0, max: 100, inputMode: "decimal" },
  cantidad: { step: "1", min: 1, inputMode: "numeric" },
};

/**
 * Input numérico reutilizable con variantes predefinidas.
 *
 * Variantes:
 * - `entero` — números enteros (step=1, min=0)
 * - `precio` — montos monetarios (step=any, min=0)
 * - `porcentaje` — porcentajes (step=any, min=0, max=100)
 * - `cantidad` — cantidades de items (step=1, min=1)
 *
 * Usa `step="any"` para evitar el error nativo del navegador
 * "Ingresa un valor válido" con decimales.
 */
const InputNumerico = forwardRef<HTMLInputElement, Props>(
  (
    {
      variante = "precio",
      value,
      onChange,
      allowNull = false,
      className,
      min,
      max,
      ...rest
    },
    ref,
  ) => {
    const config = CONFIG[variante];

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      if (raw === "" || raw === "-") {
        onChange?.(allowNull ? null : 0);
        return;
      }
      const num =
        variante === "entero" || variante === "cantidad"
          ? parseInt(raw, 10)
          : parseFloat(raw);
      if (!isNaN(num)) {
        onChange?.(num);
      }
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      e.target.select();
    }

    const displayValue = value === null || value === undefined ? "" : value;

    return (
      <input
        ref={ref}
        type="number"
        inputMode={config.inputMode}
        step={config.step}
        min={min ?? config.min}
        max={max ?? config.max}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);

InputNumerico.displayName = "InputNumerico";

export { InputNumerico };
export type { Variante as InputNumericoVariante };
