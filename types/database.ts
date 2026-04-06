export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserEstado = "activo" | "inactivo" | "eliminado";

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sucursales: {
        Row: {
          id: string;
          nombre: string;
          direccion: string;
          telefono: string | null;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          direccion: string;
          telefono?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          direccion?: string;
          telefono?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          segundo_nombre: string | null;
          apellido_paterno: string;
          apellido_materno: string | null;
          tipo_documento: string;
          numero_documento: string | null;
          fecha_nacimiento: string | null;
          edad: number | null;
          sexo: string | null;
          foto_url: string | null;
          celular: string | null;
          codigo_pais: string;
          codigo_qr: string | null;
          estado: UserEstado;
          rol_id: string | null;
          sucursal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          segundo_nombre?: string | null;
          apellido_paterno: string;
          apellido_materno?: string | null;
          tipo_documento?: string;
          numero_documento?: string | null;
          fecha_nacimiento?: string | null;
          edad?: number | null;
          sexo?: string | null;
          foto_url?: string | null;
          celular?: string | null;
          codigo_pais?: string;
          codigo_qr?: string | null;
          estado?: UserEstado;
          rol_id?: string | null;
          sucursal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          segundo_nombre?: string | null;
          apellido_paterno?: string;
          apellido_materno?: string | null;
          tipo_documento?: string;
          numero_documento?: string | null;
          fecha_nacimiento?: string | null;
          edad?: number | null;
          sexo?: string | null;
          foto_url?: string | null;
          celular?: string | null;
          codigo_pais?: string;
          codigo_qr?: string | null;
          estado?: UserEstado;
          rol_id?: string | null;
          sucursal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categorias: {
        Row: {
          id: string;
          nombre: string;
          orden: number;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          orden?: number;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          orden?: number;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      productos: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          precio: number;
          categoria_id: string | null;
          imagen_url: string | null;
          disponible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          precio: number;
          categoria_id?: string | null;
          imagen_url?: string | null;
          disponible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          precio?: number;
          categoria_id?: string | null;
          imagen_url?: string | null;
          disponible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      promociones: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          tipo_descuento: string;
          valor_descuento: number;
          fecha_inicio: string;
          fecha_fin: string;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          tipo_descuento: string;
          valor_descuento: number;
          fecha_inicio: string;
          fecha_fin: string;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          tipo_descuento?: string;
          valor_descuento?: number;
          fecha_inicio?: string;
          fecha_fin?: string;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      promociones_productos: {
        Row: {
          id: string;
          promocion_id: string;
          producto_id: string;
        };
        Insert: {
          id?: string;
          promocion_id: string;
          producto_id: string;
        };
        Update: {
          id?: string;
          promocion_id?: string;
          producto_id?: string;
        };
      };
      membresias_niveles: {
        Row: {
          id: string;
          nombre: string;
          puntos_requeridos: number;
          descuento_porcentaje: number;
          beneficios: string | null;
          orden: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          puntos_requeridos?: number;
          descuento_porcentaje?: number;
          beneficios?: string | null;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          puntos_requeridos?: number;
          descuento_porcentaje?: number;
          beneficios?: string | null;
          orden?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      membresias: {
        Row: {
          id: string;
          perfil_id: string;
          nivel_id: string;
          puntos_acumulados: number;
          fecha_inicio: string;
          fecha_fin: string | null;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          nivel_id: string;
          puntos_acumulados?: number;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          nivel_id?: string;
          puntos_acumulados?: number;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reglas_puntos: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          soles_por_punto: number;
          puntos_otorgados: number;
          activa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          soles_por_punto?: number;
          puntos_otorgados?: number;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          soles_por_punto?: number;
          puntos_otorgados?: number;
          activa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ventas: {
        Row: {
          id: string;
          numero_venta: number;
          tipo_pedido: string;
          subtotal: number;
          descuento: number;
          delivery_fee: number;
          total: number;
          metodo_pago: string;
          delivery_method: string | null;
          delivery_address: string | null;
          delivery_referencia: string | null;
          delivery_status: string | null;
          delivery_status_updated_at: string | null;
          repartidor_id: string | null;
          third_party_name: string | null;
          sucursal_origen_id: string;
          cajero_id: string;
          promocion_id: string | null;
          mesa_referencia: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_venta?: number;
          tipo_pedido: string;
          subtotal: number;
          descuento?: number;
          delivery_fee?: number;
          total: number;
          metodo_pago: string;
          delivery_method?: string | null;
          delivery_address?: string | null;
          delivery_referencia?: string | null;
          delivery_status?: string | null;
          delivery_status_updated_at?: string | null;
          repartidor_id?: string | null;
          third_party_name?: string | null;
          sucursal_origen_id: string;
          cajero_id: string;
          promocion_id?: string | null;
          mesa_referencia?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_venta?: number;
          tipo_pedido?: string;
          subtotal?: number;
          descuento?: number;
          delivery_fee?: number;
          total?: number;
          metodo_pago?: string;
          delivery_method?: string | null;
          delivery_address?: string | null;
          delivery_referencia?: string | null;
          delivery_status?: string | null;
          delivery_status_updated_at?: string | null;
          repartidor_id?: string | null;
          third_party_name?: string | null;
          sucursal_origen_id?: string;
          cajero_id?: string;
          promocion_id?: string | null;
          mesa_referencia?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      venta_items: {
        Row: {
          id: string;
          venta_id: string;
          producto_id: string;
          producto_nombre: string;
          producto_precio: number;
          cantidad: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          venta_id: string;
          producto_id: string;
          producto_nombre: string;
          producto_precio: number;
          cantidad: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venta_id?: string;
          producto_id?: string;
          producto_nombre?: string;
          producto_precio?: number;
          cantidad?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      delivery_fees_config: {
        Row: {
          id: string;
          sucursal_id: string;
          tipo: string;
          monto: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sucursal_id: string;
          tipo: string;
          monto?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sucursal_id?: string;
          tipo?: string;
          monto?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_estado: UserEstado;
    };
  };
}
