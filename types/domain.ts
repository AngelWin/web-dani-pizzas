/**
 * Tipos de dominio centralizados.
 * Los servicios en lib/services/ siguen siendo la fuente de verdad.
 * Este módulo reexporta los tipos más usados para que los componentes
 * puedan importar desde "@/types" en lugar de "@/lib/services/<feature>".
 */

// ─── Órdenes ──────────────────────────────────────────────────────────────────
export type {
  Orden,
  OrdenItem,
  OrdenConItems,
  EstadoOrden,
  TipoPedido,
  DeliveryMethod,
  EstadoDelivery,
  HistorialConUsuario,
  FiltroEstadoOrden,
  OrdenProgramadaResumen,
  CrearOrdenData,
} from "@/lib/services/ordenes";

// ─── Mesas ────────────────────────────────────────────────────────────────────
export type { Mesa, EstadoMesa } from "@/lib/services/mesas";

// ─── Sucursales ───────────────────────────────────────────────────────────────
export type { Sucursal } from "@/lib/services/sucursales";

// ─── Configuración ────────────────────────────────────────────────────────────
export type {
  ModeloNegocio,
  ConfiguracionNegocio,
} from "@/lib/services/configuracion";

// ─── Monedas ──────────────────────────────────────────────────────────────────
export type { Moneda, MonedaActiva } from "@/lib/services/monedas";

// ─── Productos / POS ──────────────────────────────────────────────────────────
export type {
  Categoria,
  Producto,
  CategoriaMedida,
  ProductoVariante,
  PizzaSabor,
  PizzaSaborConIngredientes,
  ProductoCompleto,
} from "@/lib/services/productos";

export type { ProductoPOS } from "@/lib/services/ventas";

// ─── Promociones ──────────────────────────────────────────────────────────────
export type {
  Promocion,
  PromocionConProductos,
  PromocionActivaPOS,
  PromocionComboItem,
} from "@/lib/services/promociones";

// ─── Membresías ───────────────────────────────────────────────────────────────
export type {
  NivelMembresia,
  ReglaPuntos,
  MembresiaConCliente,
} from "@/lib/services/membresias";

// ─── Clientes ─────────────────────────────────────────────────────────────────
export type { Cliente, ClienteConMembresia } from "@/lib/services/clientes";

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export type { UsuarioCompleto, Rol } from "@/lib/services/usuarios";

// ─── Caja ─────────────────────────────────────────────────────────────────────
export type {
  CajaSesion,
  CajaSesionConRelaciones,
  ResumenSesion,
} from "@/lib/services/caja-sesiones";

// ─── Entregas ─────────────────────────────────────────────────────────────────
export type {
  EntregaDetalle,
  RepartidorEntregas,
  ResumenEntregas,
} from "@/lib/services/entregas";

// ─── Delivery ─────────────────────────────────────────────────────────────────
export type { DeliveryServicio } from "@/lib/services/delivery-servicios";

// ─── Repartidor ───────────────────────────────────────────────────────────────
export type { RepartidorDetalles } from "@/lib/services/repartidor-detalles";
