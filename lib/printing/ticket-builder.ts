/**
 * Construye la representación intermedia LineaTicket[] del ticket.
 * Esta estructura se usa tanto para el preview HTML como para generar bytes ESC/POS.
 */

import type { Orden, OrdenConItems } from "@/lib/services/ordenes";
import {
  parseSabores,
  parseExtras,
  parseAcompanante,
} from "@/lib/utils/orden-formatters";
import { TIPO_PEDIDO_LABELS } from "@/lib/constants";
import type { TipoPedido } from "@/lib/services/ordenes";

// ── Tipos ─────────────────────────────────────────────────────────

export type LineaTicket =
  | { tipo: "imagen"; src: string; ancho?: number; alto?: number }
  | { tipo: "titulo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "separador" }
  | { tipo: "separador_doble" }
  | { tipo: "info"; etiqueta: string; valor: string }
  | {
      tipo: "item";
      nombre: string;
      cantidad: number;
      precio: number;
      detalles?: string[];
    }
  | { tipo: "total_linea"; etiqueta: string; valor: string; negrita?: boolean }
  | { tipo: "texto_centrado"; texto: string }
  | { tipo: "espacio" };

// ── Logo ──────────────────────────────────────────────────────────

const LOGO_SRC = "/images/logo-dani-pizzas.png";

// ── Helpers ────────────────────────────────────────��──────────────

function formatFecha(isoString: string | null): string {
  if (!isoString) return "";
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatHora(isoString: string | null): string {
  if (!isoString) return "";
  const fecha = new Date(isoString);
  return fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNombreCajero(
  cajero: { nombre: string; apellido_paterno: string } | null,
): string {
  if (!cajero) return "";
  return cajero.nombre;
}

function buildDetallesItem(
  item: OrdenConItems["orden_items"][number],
): string[] {
  const detalles: string[] = [];

  // Sabores
  const sabores = parseSabores(item.sabores);
  if (sabores.length > 0) {
    const textoSabores = sabores
      .map((s) => {
        let txt = s.sabor_nombre;
        if (sabores.length > 1 && s.proporcion) {
          txt += ` (${s.proporcion})`;
        }
        if (s.exclusiones?.length > 0) {
          txt += ` sin ${s.exclusiones.join(", ")}`;
        }
        return txt;
      })
      .join(" / ");
    detalles.push(textoSabores);
  }

  // Extras
  const extras = parseExtras(item.extras);
  if (extras.length > 0) {
    detalles.push(`+${extras.map((e) => e.nombre).join(", ")}`);
  }

  // Acompañante
  const acompanante = parseAcompanante(item.acompanante);
  if (acompanante) {
    detalles.push(
      `+ ${acompanante.variante_nombre}: ${acompanante.sabor_nombre}`,
    );
  }

  // Notas del item
  if (item.notas_item) {
    detalles.push(`Nota: ${item.notas_item}`);
  }

  return detalles;
}

// ── Build Ticket Orden ────────────────────────────────────────────

export function buildTicketOrden(
  orden: OrdenConItems,
  sucursalNombre: string,
  formatCurrency: (amount: number) => string,
): LineaTicket[] {
  const lineas: LineaTicket[] = [];

  // Header: logo + sucursal
  lineas.push({ tipo: "imagen", src: LOGO_SRC, ancho: 200, alto: 80 });
  lineas.push({ tipo: "subtitulo", texto: sucursalNombre });
  lineas.push({ tipo: "separador_doble" });

  // Info de la orden
  const tipoPedidoLabel =
    TIPO_PEDIDO_LABELS[orden.tipo_pedido as TipoPedido] ?? orden.tipo_pedido;
  lineas.push({
    tipo: "info",
    etiqueta: `ORDEN #${orden.numero_orden}`,
    valor: tipoPedidoLabel ?? "",
  });

  if (orden.mesa_referencia) {
    lineas.push({
      tipo: "info",
      etiqueta: `Mesa: ${orden.mesa_referencia}`,
      valor: getNombreCajero(orden.cajero)
        ? `Cajero: ${getNombreCajero(orden.cajero)}`
        : "",
    });
  } else if (getNombreCajero(orden.cajero)) {
    lineas.push({
      tipo: "info",
      etiqueta: `Cajero: ${getNombreCajero(orden.cajero)}`,
      valor: "",
    });
  }

  // Cliente
  if (orden.cliente) {
    const nombreCliente = orden.cliente.apellido
      ? `${orden.cliente.nombre} ${orden.cliente.apellido}`
      : orden.cliente.nombre;
    lineas.push({ tipo: "info", etiqueta: "Cliente", valor: nombreCliente });
  }

  // Fecha y hora
  lineas.push({
    tipo: "info",
    etiqueta: formatFecha(orden.created_at),
    valor: formatHora(orden.created_at),
  });

  // Delivery info
  if (orden.tipo_pedido === "delivery") {
    if (orden.delivery_method) {
      const metodo = orden.delivery_method === "propio" ? "Propio" : "Tercero";
      const tercero = orden.third_party_name
        ? ` - ${orden.third_party_name}`
        : "";
      lineas.push({
        tipo: "info",
        etiqueta: "Delivery",
        valor: `${metodo}${tercero}`,
      });
    }
    if (orden.delivery_address) {
      lineas.push({
        tipo: "info",
        etiqueta: "Dirección",
        valor: orden.delivery_address,
      });
    }
    if (orden.delivery_referencia) {
      lineas.push({
        tipo: "info",
        etiqueta: "Ref",
        valor: orden.delivery_referencia,
      });
    }
    if (orden.repartidor) {
      lineas.push({
        tipo: "info",
        etiqueta: "Repartidor",
        valor: `${orden.repartidor.nombre} ${orden.repartidor.apellido_paterno}`,
      });
    }
  }

  lineas.push({ tipo: "separador" });

  // Items
  for (const item of orden.orden_items) {
    const nombreItem = item.variante_nombre
      ? `${item.producto_nombre} ${item.variante_nombre}`
      : item.producto_nombre;

    lineas.push({
      tipo: "item",
      nombre: nombreItem,
      cantidad: item.cantidad,
      precio: item.subtotal,
      detalles: buildDetallesItem(item),
    });
  }

  lineas.push({ tipo: "separador" });

  // Totales
  lineas.push({
    tipo: "total_linea",
    etiqueta: "Subtotal",
    valor: formatCurrency(orden.subtotal),
  });

  if (orden.descuento > 0) {
    lineas.push({
      tipo: "total_linea",
      etiqueta: "Descuento",
      valor: `- ${formatCurrency(orden.descuento)}`,
    });
  }

  if (orden.delivery_fee > 0) {
    lineas.push({
      tipo: "total_linea",
      etiqueta: "Delivery",
      valor: formatCurrency(orden.delivery_fee),
    });
  }

  lineas.push({
    tipo: "total_linea",
    etiqueta: "TOTAL",
    valor: formatCurrency(orden.total),
    negrita: true,
  });

  // Notas
  if (orden.notas) {
    lineas.push({ tipo: "espacio" });
    lineas.push({ tipo: "texto_centrado", texto: `Nota: ${orden.notas}` });
  }

  // Footer
  lineas.push({ tipo: "separador_doble" });
  lineas.push({ tipo: "texto_centrado", texto: "Gracias por su preferencia" });
  lineas.push({ tipo: "separador_doble" });

  return lineas;
}

// ── Build Comanda (ticket para cocina, SIN precios) ───────────────

/**
 * Comanda de cocina: items detallados sin precios.
 * Se genera al pasar una orden de "confirmada" → "en_preparación".
 */
export function buildTicketComanda(
  orden: OrdenConItems,
  sucursalNombre: string,
): LineaTicket[] {
  const lineas: LineaTicket[] = [];

  // Header
  lineas.push({ tipo: "separador_doble" });
  lineas.push({ tipo: "titulo", texto: "COMANDA DE COCINA" });
  lineas.push({ tipo: "separador_doble" });

  // Número de orden grande
  lineas.push({ tipo: "titulo", texto: `ORDEN #${orden.numero_orden}` });
  lineas.push({ tipo: "espacio" });

  // Info esencial
  const tipoPedidoLabel =
    TIPO_PEDIDO_LABELS[orden.tipo_pedido as TipoPedido] ?? orden.tipo_pedido;
  lineas.push({
    tipo: "info",
    etiqueta: "Tipo",
    valor: tipoPedidoLabel ?? "",
  });

  if (orden.mesa_referencia) {
    lineas.push({
      tipo: "info",
      etiqueta: "Mesa",
      valor: orden.mesa_referencia,
    });
  }

  lineas.push({
    tipo: "info",
    etiqueta: "Sucursal",
    valor: sucursalNombre,
  });

  lineas.push({
    tipo: "info",
    etiqueta: "Hora",
    valor: formatHora(orden.created_at),
  });

  // Cliente (si existe)
  if (orden.cliente) {
    const nombreCliente = orden.cliente.apellido
      ? `${orden.cliente.nombre} ${orden.cliente.apellido}`
      : orden.cliente.nombre;
    lineas.push({ tipo: "info", etiqueta: "Cliente", valor: nombreCliente });
  }

  lineas.push({ tipo: "separador_doble" });

  // Items SIN precios — con todos los detalles para cocina
  for (const item of orden.orden_items) {
    const nombreItem = item.variante_nombre
      ? `${item.producto_nombre} ${item.variante_nombre}`
      : item.producto_nombre;

    lineas.push({
      tipo: "item",
      nombre: nombreItem,
      cantidad: item.cantidad,
      precio: 0, // Sin precio en comanda
      detalles: buildDetallesItem(item),
    });
  }

  // Notas generales del pedido
  if (orden.notas) {
    lineas.push({ tipo: "separador" });
    lineas.push({ tipo: "titulo", texto: "NOTA:" });
    lineas.push({ tipo: "texto_centrado", texto: orden.notas });
  }

  // Delivery info (el cocinero puede necesitar saber si es delivery)
  if (orden.tipo_pedido === "delivery" && orden.delivery_address) {
    lineas.push({ tipo: "separador" });
    lineas.push({
      tipo: "info",
      etiqueta: "Dirección",
      valor: orden.delivery_address,
    });
  }

  lineas.push({ tipo: "separador_doble" });
  lineas.push({
    tipo: "texto_centrado",
    texto: `${formatFecha(orden.created_at)}  ${formatHora(orden.created_at)}`,
  });
  lineas.push({ tipo: "separador_doble" });

  return lineas;
}

// ── Build Ticket Mesa (grupo de órdenes) ──────────────────────────

export function buildTicketMesa(
  mesaRef: string,
  ordenes: OrdenConItems[],
  sucursalNombre: string,
  formatCurrency: (amount: number) => string,
): LineaTicket[] {
  const lineas: LineaTicket[] = [];

  // Header: logo
  lineas.push({ tipo: "imagen", src: LOGO_SRC, ancho: 200, alto: 80 });
  lineas.push({ tipo: "subtitulo", texto: sucursalNombre });
  lineas.push({ tipo: "separador_doble" });

  // Título de mesa
  lineas.push({ tipo: "titulo", texto: `CUENTA ${mesaRef}` });

  const ahora = new Date();
  lineas.push({
    tipo: "texto_centrado",
    texto: `${ahora.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}  ${ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`,
  });

  lineas.push({ tipo: "separador_doble" });

  // Cada orden
  let totalMesa = 0;

  for (const orden of ordenes) {
    lineas.push({
      tipo: "subtitulo",
      texto: `--- ORDEN #${orden.numero_orden} ---`,
    });

    for (const item of orden.orden_items) {
      const nombreItem = item.variante_nombre
        ? `${item.producto_nombre} ${item.variante_nombre}`
        : item.producto_nombre;

      lineas.push({
        tipo: "item",
        nombre: nombreItem,
        cantidad: item.cantidad,
        precio: item.subtotal,
        detalles: buildDetallesItem(item),
      });
    }

    lineas.push({
      tipo: "total_linea",
      etiqueta: `Subtotal #${orden.numero_orden}`,
      valor: formatCurrency(orden.total),
    });

    lineas.push({ tipo: "espacio" });
    totalMesa += orden.total;
  }

  // Total general de mesa
  lineas.push({ tipo: "separador_doble" });
  lineas.push({
    tipo: "total_linea",
    etiqueta: "TOTAL MESA",
    valor: formatCurrency(totalMesa),
    negrita: true,
  });
  lineas.push({ tipo: "separador_doble" });

  return lineas;
}

// ── Build Ticket Cobro (post-pago) ────────────────────────────────

export function buildTicketCobro(
  orden: OrdenConItems,
  sucursalNombre: string,
  formatCurrency: (amount: number) => string,
  metodoPago: string,
  vuelto?: number | null,
): LineaTicket[] {
  // Reutilizar ticket de orden
  const lineas = buildTicketOrden(orden, sucursalNombre, formatCurrency);

  // Insertar info de pago antes del footer (antes del último separador_doble + texto + separador_doble)
  // Buscar el índice del primer "Gracias por su preferencia"
  const idxGracias = lineas.findIndex(
    (l) =>
      l.tipo === "texto_centrado" && l.texto === "Gracias por su preferencia",
  );

  const infosPago: LineaTicket[] = [
    { tipo: "espacio" },
    {
      tipo: "info",
      etiqueta: "Método de pago",
      valor: metodoPago,
    },
  ];

  if (vuelto != null && vuelto > 0) {
    infosPago.push({
      tipo: "info",
      etiqueta: "Vuelto",
      valor: formatCurrency(vuelto),
    });
  }

  if (idxGracias !== -1) {
    // Insertar antes del separador_doble que precede a "Gracias..."
    lineas.splice(idxGracias - 1, 0, ...infosPago);
  } else {
    lineas.push(...infosPago);
  }

  return lineas;
}

// ── Build Ticket Resumen (Orden sin items expandidos) ─────────────

/**
 * Ticket resumido para OrdenConfirmadaDialog.
 * Solo muestra totales porque Orden no incluye orden_items.
 */
export function buildTicketOrdenResumen(
  orden: Orden,
  sucursalNombre: string,
  formatCurrency: (amount: number) => string,
): LineaTicket[] {
  const lineas: LineaTicket[] = [];

  // Header
  lineas.push({ tipo: "imagen", src: LOGO_SRC, ancho: 200, alto: 80 });
  lineas.push({ tipo: "subtitulo", texto: sucursalNombre });
  lineas.push({ tipo: "separador_doble" });

  // Info de la orden
  const tipoPedidoLabel =
    TIPO_PEDIDO_LABELS[orden.tipo_pedido as TipoPedido] ?? orden.tipo_pedido;
  lineas.push({
    tipo: "info",
    etiqueta: `ORDEN #${orden.numero_orden}`,
    valor: tipoPedidoLabel ?? "",
  });

  if (orden.mesa_referencia) {
    lineas.push({
      tipo: "info",
      etiqueta: "Mesa",
      valor: orden.mesa_referencia,
    });
  }

  lineas.push({
    tipo: "info",
    etiqueta: formatFecha(orden.created_at),
    valor: formatHora(orden.created_at),
  });

  lineas.push({ tipo: "separador" });

  // Totales
  lineas.push({
    tipo: "total_linea",
    etiqueta: "Subtotal",
    valor: formatCurrency(orden.subtotal),
  });

  if (orden.descuento > 0) {
    lineas.push({
      tipo: "total_linea",
      etiqueta: "Descuento",
      valor: `- ${formatCurrency(orden.descuento)}`,
    });
  }

  if (orden.delivery_fee > 0) {
    lineas.push({
      tipo: "total_linea",
      etiqueta: "Delivery",
      valor: formatCurrency(orden.delivery_fee),
    });
  }

  lineas.push({
    tipo: "total_linea",
    etiqueta: "TOTAL",
    valor: formatCurrency(orden.total),
    negrita: true,
  });

  lineas.push({ tipo: "separador_doble" });
  lineas.push({ tipo: "texto_centrado", texto: "Gracias por su preferencia" });
  lineas.push({ tipo: "separador_doble" });

  return lineas;
}
