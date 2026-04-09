"use client";

import { createContext, useCallback, useContext } from "react";

interface CurrencyContextType {
  simbolo: string;
  codigo: string;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  simbolo: "S/.",
  codigo: "PEN",
  formatCurrency: (amount) => `S/. ${amount.toFixed(2)}`,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  initialSimbolo: string;
  initialCodigo: string;
}

export function CurrencyProvider({
  children,
  initialSimbolo,
  initialCodigo,
}: CurrencyProviderProps) {
  const formatCurrencyFn = useCallback(
    (amount: number) => `${initialSimbolo} ${amount.toFixed(2)}`,
    [initialSimbolo],
  );

  return (
    <CurrencyContext.Provider
      value={{
        simbolo: initialSimbolo,
        codigo: initialCodigo,
        formatCurrency: formatCurrencyFn,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
