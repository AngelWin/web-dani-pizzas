export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categoria_medidas: {
        Row: {
          activa: boolean;
          categoria_id: string;
          created_at: string | null;
          descripcion: string | null;
          id: string;
          nombre: string;
          orden: number;
          updated_at: string | null;
        };
        Insert: {
          activa?: boolean;
          categoria_id: string;
          created_at?: string | null;
          descripcion?: string | null;
          id?: string;
          nombre: string;
          orden?: number;
          updated_at?: string | null;
        };
        Update: {
          activa?: boolean;
          categoria_id?: string;
          created_at?: string | null;
          descripcion?: string | null;
          id?: string;
          nombre?: string;
          orden?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categoria_medidas_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      categorias: {
        Row: {
          activa: boolean | null;
          created_at: string | null;
          id: string;
          nombre: string;
          orden: number | null;
          updated_at: string | null;
        };
        Insert: {
          activa?: boolean | null;
          created_at?: string | null;
          id?: string;
          nombre: string;
          orden?: number | null;
          updated_at?: string | null;
        };
        Update: {
          activa?: boolean | null;
          created_at?: string | null;
          id?: string;
          nombre?: string;
          orden?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      delivery_fees_config: {
        Row: {
          created_at: string | null;
          id: string;
          monto: number;
          sucursal_id: string;
          tipo: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          monto?: number;
          sucursal_id: string;
          tipo: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          monto?: number;
          sucursal_id?: string;
          tipo?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_fees_config_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      membresias: {
        Row: {
          activa: boolean;
          created_at: string;
          fecha_fin: string | null;
          fecha_inicio: string;
          id: string;
          nivel_id: string;
          perfil_id: string;
          puntos_acumulados: number;
          updated_at: string;
        };
        Insert: {
          activa?: boolean;
          created_at?: string;
          fecha_fin?: string | null;
          fecha_inicio?: string;
          id?: string;
          nivel_id: string;
          perfil_id: string;
          puntos_acumulados?: number;
          updated_at?: string;
        };
        Update: {
          activa?: boolean;
          created_at?: string;
          fecha_fin?: string | null;
          fecha_inicio?: string;
          id?: string;
          nivel_id?: string;
          perfil_id?: string;
          puntos_acumulados?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membresias_nivel_id_fkey";
            columns: ["nivel_id"];
            isOneToOne: false;
            referencedRelation: "membresias_niveles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membresias_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      membresias_niveles: {
        Row: {
          beneficios: string | null;
          created_at: string | null;
          descuento_porcentaje: number | null;
          id: string;
          nombre: string;
          orden: number | null;
          puntos_requeridos: number;
          updated_at: string | null;
        };
        Insert: {
          beneficios?: string | null;
          created_at?: string | null;
          descuento_porcentaje?: number | null;
          id?: string;
          nombre: string;
          orden?: number | null;
          puntos_requeridos?: number;
          updated_at?: string | null;
        };
        Update: {
          beneficios?: string | null;
          created_at?: string | null;
          descuento_porcentaje?: number | null;
          id?: string;
          nombre?: string;
          orden?: number | null;
          puntos_requeridos?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      producto_sucursal: {
        Row: {
          created_at: string | null;
          disponible: boolean;
          id: string;
          producto_id: string;
          sucursal_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          disponible?: boolean;
          id?: string;
          producto_id: string;
          sucursal_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          disponible?: boolean;
          id?: string;
          producto_id?: string;
          sucursal_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "producto_sucursal_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "producto_sucursal_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      producto_variantes: {
        Row: {
          created_at: string | null;
          disponible: boolean;
          id: string;
          medida_id: string;
          orden: number;
          precio: number;
          producto_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          disponible?: boolean;
          id?: string;
          medida_id: string;
          orden?: number;
          precio: number;
          producto_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          disponible?: boolean;
          id?: string;
          medida_id?: string;
          orden?: number;
          precio?: number;
          producto_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "producto_variantes_medida_id_fkey";
            columns: ["medida_id"];
            isOneToOne: false;
            referencedRelation: "categoria_medidas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "producto_variantes_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      productos: {
        Row: {
          categoria_id: string | null;
          created_at: string | null;
          descripcion: string | null;
          disponible: boolean | null;
          id: string;
          imagen_url: string | null;
          nombre: string;
          precio: number | null;
          updated_at: string | null;
        };
        Insert: {
          categoria_id?: string | null;
          created_at?: string | null;
          descripcion?: string | null;
          disponible?: boolean | null;
          id?: string;
          imagen_url?: string | null;
          nombre: string;
          precio?: number | null;
          updated_at?: string | null;
        };
        Update: {
          categoria_id?: string | null;
          created_at?: string | null;
          descripcion?: string | null;
          disponible?: boolean | null;
          id?: string;
          imagen_url?: string | null;
          nombre?: string;
          precio?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          apellido_materno: string | null;
          apellido_paterno: string;
          celular: string | null;
          codigo_pais: string;
          codigo_qr: string | null;
          created_at: string | null;
          edad: number | null;
          email: string;
          estado: Database["public"]["Enums"]["user_estado"];
          fecha_nacimiento: string | null;
          foto_url: string | null;
          id: string;
          nombre: string;
          numero_documento: string | null;
          rol_id: string | null;
          segundo_nombre: string | null;
          sexo: string | null;
          sucursal_id: string | null;
          tipo_documento: string;
          updated_at: string | null;
        };
        Insert: {
          apellido_materno?: string | null;
          apellido_paterno: string;
          celular?: string | null;
          codigo_pais?: string;
          codigo_qr?: string | null;
          created_at?: string | null;
          edad?: number | null;
          email: string;
          estado?: Database["public"]["Enums"]["user_estado"];
          fecha_nacimiento?: string | null;
          foto_url?: string | null;
          id: string;
          nombre: string;
          numero_documento?: string | null;
          rol_id?: string | null;
          segundo_nombre?: string | null;
          sexo?: string | null;
          sucursal_id?: string | null;
          tipo_documento?: string;
          updated_at?: string | null;
        };
        Update: {
          apellido_materno?: string | null;
          apellido_paterno?: string;
          celular?: string | null;
          codigo_pais?: string;
          codigo_qr?: string | null;
          created_at?: string | null;
          edad?: number | null;
          email?: string;
          estado?: Database["public"]["Enums"]["user_estado"];
          fecha_nacimiento?: string | null;
          foto_url?: string | null;
          id?: string;
          nombre?: string;
          numero_documento?: string | null;
          rol_id?: string | null;
          segundo_nombre?: string | null;
          sexo?: string | null;
          sucursal_id?: string | null;
          tipo_documento?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_rol_id_fkey";
            columns: ["rol_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      promociones: {
        Row: {
          activa: boolean | null;
          created_at: string | null;
          descripcion: string | null;
          fecha_fin: string;
          fecha_inicio: string;
          id: string;
          nombre: string;
          tipo_descuento: string;
          updated_at: string | null;
          valor_descuento: number;
        };
        Insert: {
          activa?: boolean | null;
          created_at?: string | null;
          descripcion?: string | null;
          fecha_fin: string;
          fecha_inicio: string;
          id?: string;
          nombre: string;
          tipo_descuento: string;
          updated_at?: string | null;
          valor_descuento: number;
        };
        Update: {
          activa?: boolean | null;
          created_at?: string | null;
          descripcion?: string | null;
          fecha_fin?: string;
          fecha_inicio?: string;
          id?: string;
          nombre?: string;
          tipo_descuento?: string;
          updated_at?: string | null;
          valor_descuento?: number;
        };
        Relationships: [];
      };
      promociones_productos: {
        Row: {
          id: string;
          producto_id: string | null;
          promocion_id: string | null;
        };
        Insert: {
          id?: string;
          producto_id?: string | null;
          promocion_id?: string | null;
        };
        Update: {
          id?: string;
          producto_id?: string | null;
          promocion_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promociones_productos_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promociones_productos_promocion_id_fkey";
            columns: ["promocion_id"];
            isOneToOne: false;
            referencedRelation: "promociones";
            referencedColumns: ["id"];
          },
        ];
      };
      reglas_puntos: {
        Row: {
          activa: boolean | null;
          created_at: string | null;
          descripcion: string | null;
          id: string;
          nombre: string;
          puntos_otorgados: number;
          soles_por_punto: number;
          updated_at: string | null;
        };
        Insert: {
          activa?: boolean | null;
          created_at?: string | null;
          descripcion?: string | null;
          id?: string;
          nombre: string;
          puntos_otorgados?: number;
          soles_por_punto?: number;
          updated_at?: string | null;
        };
        Update: {
          activa?: boolean | null;
          created_at?: string | null;
          descripcion?: string | null;
          id?: string;
          nombre?: string;
          puntos_otorgados?: number;
          soles_por_punto?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          activo: boolean;
          created_at: string;
          descripcion: string | null;
          id: string;
          nombre: string;
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre: string;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sucursales: {
        Row: {
          activa: boolean | null;
          created_at: string | null;
          direccion: string;
          id: string;
          nombre: string;
          telefono: string | null;
          updated_at: string | null;
        };
        Insert: {
          activa?: boolean | null;
          created_at?: string | null;
          direccion: string;
          id?: string;
          nombre: string;
          telefono?: string | null;
          updated_at?: string | null;
        };
        Update: {
          activa?: boolean | null;
          created_at?: string | null;
          direccion?: string;
          id?: string;
          nombre?: string;
          telefono?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      venta_items: {
        Row: {
          cantidad: number;
          created_at: string | null;
          id: string;
          producto_id: string;
          producto_nombre: string;
          producto_precio: number;
          subtotal: number;
          variante_id: string | null;
          variante_nombre: string | null;
          venta_id: string;
        };
        Insert: {
          cantidad: number;
          created_at?: string | null;
          id?: string;
          producto_id: string;
          producto_nombre: string;
          producto_precio: number;
          subtotal: number;
          variante_id?: string | null;
          variante_nombre?: string | null;
          venta_id: string;
        };
        Update: {
          cantidad?: number;
          created_at?: string | null;
          id?: string;
          producto_id?: string;
          producto_nombre?: string;
          producto_precio?: number;
          subtotal?: number;
          variante_id?: string | null;
          variante_nombre?: string | null;
          venta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venta_items_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venta_items_variante_id_fkey";
            columns: ["variante_id"];
            isOneToOne: false;
            referencedRelation: "producto_variantes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
        ];
      };
      ventas: {
        Row: {
          cajero_id: string;
          created_at: string | null;
          delivery_address: string | null;
          delivery_fee: number | null;
          delivery_method: string | null;
          delivery_referencia: string | null;
          delivery_status: string | null;
          delivery_status_updated_at: string | null;
          descuento: number | null;
          id: string;
          mesa_referencia: string | null;
          metodo_pago: string;
          notas: string | null;
          numero_venta: number;
          promocion_id: string | null;
          repartidor_id: string | null;
          subtotal: number;
          sucursal_origen_id: string;
          third_party_name: string | null;
          tipo_pedido: string;
          total: number;
          updated_at: string | null;
        };
        Insert: {
          cajero_id: string;
          created_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number | null;
          delivery_method?: string | null;
          delivery_referencia?: string | null;
          delivery_status?: string | null;
          delivery_status_updated_at?: string | null;
          descuento?: number | null;
          id?: string;
          mesa_referencia?: string | null;
          metodo_pago: string;
          notas?: string | null;
          numero_venta?: number;
          promocion_id?: string | null;
          repartidor_id?: string | null;
          subtotal: number;
          sucursal_origen_id: string;
          third_party_name?: string | null;
          tipo_pedido: string;
          total: number;
          updated_at?: string | null;
        };
        Update: {
          cajero_id?: string;
          created_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number | null;
          delivery_method?: string | null;
          delivery_referencia?: string | null;
          delivery_status?: string | null;
          delivery_status_updated_at?: string | null;
          descuento?: number | null;
          id?: string;
          mesa_referencia?: string | null;
          metodo_pago?: string;
          notas?: string | null;
          numero_venta?: number;
          promocion_id?: string | null;
          repartidor_id?: string | null;
          subtotal?: number;
          sucursal_origen_id?: string;
          third_party_name?: string | null;
          tipo_pedido?: string;
          total?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_cajero_id_fkey";
            columns: ["cajero_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_promocion_id_fkey";
            columns: ["promocion_id"];
            isOneToOne: false;
            referencedRelation: "promociones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_repartidor_id_fkey";
            columns: ["repartidor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ventas_sucursal_origen_id_fkey";
            columns: ["sucursal_origen_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_codigo_qr: { Args: never; Returns: string };
      get_user_role: { Args: never; Returns: string };
      get_user_sucursal: { Args: never; Returns: string };
    };
    Enums: {
      user_estado: "activo" | "inactivo" | "eliminado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      user_estado: ["activo", "inactivo", "eliminado"],
    },
  },
} as const;
