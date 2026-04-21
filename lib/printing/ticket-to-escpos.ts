/**
 * Convierte LineaTicket[] a Uint8Array de comandos ESC/POS
 * para enviar a la impresora térmica.
 */

import type { LineaTicket } from "./ticket-builder";
import {
  INIT,
  CUT,
  SET_CODEPAGE_858,
  ALIGN_CENTER,
  ALIGN_LEFT,
  BOLD_ON,
  BOLD_OFF,
  DOUBLE_SIZE,
  NORMAL_SIZE,
  EMPTY_LINE,
  concatBytes,
  textLine,
  lineaDosColumnas,
  lineaSeparador,
  lineaSeparadorDoble,
  feed,
} from "./escpos-commands";

/**
 * Convierte un array de LineaTicket a bytes ESC/POS listos para imprimir.
 * Las líneas de tipo "imagen" se omiten en ESC/POS (solo se muestran en preview HTML).
 * Para imprimir el logo como bitmap, usar `prependLogoBitmap()` por separado.
 */
export function ticketToEscpos(lineas: LineaTicket[]): Uint8Array {
  const parts: Uint8Array[] = [INIT, SET_CODEPAGE_858];

  for (const linea of lineas) {
    switch (linea.tipo) {
      case "imagen":
        // El logo se imprime como bitmap aparte o se omite en texto puro.
        // En modo texto, ponemos el nombre del negocio como fallback.
        parts.push(ALIGN_CENTER, BOLD_ON, DOUBLE_SIZE);
        parts.push(textLine("DANI PIZZAS"));
        parts.push(NORMAL_SIZE, BOLD_OFF, ALIGN_LEFT);
        break;

      case "titulo":
        parts.push(ALIGN_CENTER, BOLD_ON, DOUBLE_SIZE);
        parts.push(textLine(linea.texto));
        parts.push(NORMAL_SIZE, BOLD_OFF, ALIGN_LEFT);
        break;

      case "subtitulo":
        parts.push(ALIGN_CENTER);
        parts.push(textLine(linea.texto));
        parts.push(ALIGN_LEFT);
        break;

      case "separador":
        parts.push(lineaSeparador());
        break;

      case "separador_doble":
        parts.push(lineaSeparadorDoble());
        break;

      case "info":
        if (linea.valor) {
          parts.push(lineaDosColumnas(linea.etiqueta, linea.valor));
        } else {
          parts.push(textLine(linea.etiqueta));
        }
        break;

      case "item": {
        // Línea principal: "2x Pizza Grande       S/. 56.00"
        const prefijo = `${linea.cantidad}x ${linea.nombre}`;
        const precio = linea.precio > 0 ? `${linea.precio.toFixed(2)}` : "";
        parts.push(lineaDosColumnas(prefijo, precio));

        // Detalles indentados
        if (linea.detalles) {
          for (const detalle of linea.detalles) {
            parts.push(textLine(`   ${detalle}`));
          }
        }
        break;
      }

      case "total_linea":
        if (linea.negrita) {
          parts.push(BOLD_ON);
          parts.push(lineaDosColumnas(linea.etiqueta, linea.valor));
          parts.push(BOLD_OFF);
        } else {
          parts.push(lineaDosColumnas(linea.etiqueta, linea.valor));
        }
        break;

      case "texto_centrado":
        parts.push(ALIGN_CENTER);
        parts.push(textLine(linea.texto));
        parts.push(ALIGN_LEFT);
        break;

      case "espacio":
        parts.push(EMPTY_LINE);
        break;
    }
  }

  // Alimentar papel y cortar
  parts.push(feed(4));
  parts.push(CUT);

  return concatBytes(...parts);
}
