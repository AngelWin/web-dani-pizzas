"use client";

import { createContext, useContext } from "react";
import { usePrinter, type UsePrinterReturn } from "@/hooks/use-printer";

const PrinterContext = createContext<UsePrinterReturn | null>(null);

type Props = {
  sucursalId: string;
  children: React.ReactNode;
};

export function PrinterProvider({ sucursalId, children }: Props) {
  const printer = usePrinter(sucursalId);

  return (
    <PrinterContext.Provider value={printer}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinterContext(): UsePrinterReturn {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error("usePrinterContext debe usarse dentro de PrinterProvider");
  }
  return ctx;
}
