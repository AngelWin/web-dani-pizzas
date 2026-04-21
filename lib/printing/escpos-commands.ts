/**
 * Comandos ESC/POS para impresoras térmicas 80mm (48 chars/línea).
 * Compatible con BIENEX 80mm y otras impresoras térmicas genéricas.
 */

// ── Constantes de comandos ────────────────────────────────────────

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;

/** Ancho de línea en caracteres para papel 80mm */
export const LINE_WIDTH = 48;

/** Inicializar impresora (reset) */
export const INIT = new Uint8Array([ESC, 0x40]);

/** Cortar papel (corte parcial) */
export const CUT = new Uint8Array([GS, 0x56, 0x41, 0x00]);

/** Alimentar N líneas */
export function feed(n: number): Uint8Array {
  return new Uint8Array([ESC, 0x64, n]);
}

// ── Alineación ────────────────────────────────────────────────────

export const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
export const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
export const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]);

// ── Estilo de texto ───────────────────────────────────────────────

export const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
export const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);

/** Tamaño doble (alto + ancho) */
export const DOUBLE_SIZE = new Uint8Array([GS, 0x21, 0x11]);

/** Solo doble alto */
export const DOUBLE_HEIGHT = new Uint8Array([GS, 0x21, 0x01]);

/** Tamaño normal */
export const NORMAL_SIZE = new Uint8Array([GS, 0x21, 0x00]);

// ── Codepage para español (Latin-1 / CP858) ──────────────────────

/** Seleccionar codepage 19 = CP858 (soporta ñ, tildes, €) */
export const SET_CODEPAGE_858 = new Uint8Array([ESC, 0x74, 19]);

// ── Utilidades de bytes ───────────────────────────────────────────

/** Combinar múltiples Uint8Array en uno solo */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Convertir texto a bytes Latin-1 (CP858).
 * Mapea caracteres especiales del español manualmente.
 */
export function textToBytes(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0xff) {
      bytes.push(code);
    } else {
      // Caracteres fuera de Latin-1: reemplazar con '?'
      bytes.push(0x3f);
    }
  }
  return new Uint8Array(bytes);
}

/** Texto + salto de línea */
export function textLine(text: string): Uint8Array {
  return concatBytes(textToBytes(text), new Uint8Array([LF]));
}

/** Línea vacía */
export const EMPTY_LINE = new Uint8Array([LF]);

/**
 * Línea con texto alineado a izquierda y derecha.
 * Ej: "Subtotal            S/. 63.00"
 */
export function lineaDosColumnas(
  izquierda: string,
  derecha: string,
  ancho: number = LINE_WIDTH,
): Uint8Array {
  const espaciosDisponibles = ancho - izquierda.length - derecha.length;
  if (espaciosDisponibles <= 0) {
    // Si no cabe en una línea, poner en dos
    return concatBytes(textLine(izquierda), textLine(derecha.padStart(ancho)));
  }
  const linea = izquierda + " ".repeat(espaciosDisponibles) + derecha;
  return textLine(linea);
}

/**
 * Línea separadora.
 * Ej: "------------------------------------------------"
 */
export function lineaSeparador(
  char: string = "-",
  ancho: number = LINE_WIDTH,
): Uint8Array {
  return textLine(char.repeat(ancho));
}

/**
 * Línea separadora doble.
 * Ej: "================================================"
 */
export function lineaSeparadorDoble(ancho: number = LINE_WIDTH): Uint8Array {
  return lineaSeparador("=", ancho);
}

/**
 * Texto centrado en el ancho de línea.
 */
export function textoCentrado(text: string): Uint8Array {
  return concatBytes(ALIGN_CENTER, textLine(text), ALIGN_LEFT);
}

/**
 * Imprimir imagen como bitmap raster (ESC/POS GS v 0).
 * Recibe los bytes raw del bitmap monocromo (1 bit por pixel).
 * anchoPixels debe ser múltiplo de 8.
 */
export function imagenBitmap(
  bitmapData: Uint8Array,
  anchoPixels: number,
  altoPixels: number,
): Uint8Array {
  const anchoBytes = anchoPixels / 8;
  // GS v 0 m xL xH yL yH [data]
  const cmd = new Uint8Array([
    GS,
    0x76,
    0x30,
    0x00, // modo normal
    anchoBytes & 0xff,
    (anchoBytes >> 8) & 0xff,
    altoPixels & 0xff,
    (altoPixels >> 8) & 0xff,
  ]);
  return concatBytes(cmd, bitmapData);
}
