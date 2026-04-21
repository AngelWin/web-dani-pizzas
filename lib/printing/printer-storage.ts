/**
 * Persistencia de configuración de impresora en localStorage por sucursal.
 * Cada dispositivo/tablet tiene su propia configuración independiente.
 */

export type PrinterConfig = {
  /** Nombre del dispositivo Bluetooth (solo informativo, no se puede reconectar automáticamente) */
  deviceName: string | null;
  /** Si se muestra automáticamente el preview al confirmar orden */
  autoImprimir: boolean;
};

const DEFAULT_CONFIG: PrinterConfig = {
  deviceName: null,
  autoImprimir: false,
};

function storageKey(sucursalId: string): string {
  return `printer_config_${sucursalId}`;
}

export function getPrinterConfig(sucursalId: string): PrinterConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(storageKey(sucursalId));
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setPrinterConfig(
  sucursalId: string,
  config: Partial<PrinterConfig>,
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPrinterConfig(sucursalId);
    const updated = { ...current, ...config };
    localStorage.setItem(storageKey(sucursalId), JSON.stringify(updated));
  } catch {
    // localStorage puede fallar en modo incógnito
  }
}
