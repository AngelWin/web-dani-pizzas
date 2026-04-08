import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Rol = Database["public"]["Tables"]["roles"]["Row"];
export type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

export type UsuarioCompleto = Profile & {
  rol_nombre: string | null;
  sucursal_nombre: string | null;
};

export type CrearUsuarioData = {
  email: string;
  password: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  rol_id: string;
  sucursal_id: string | null;
};

export type ActualizarUsuarioData = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  rol_id: string;
  sucursal_id: string | null;
  estado: Database["public"]["Enums"]["user_estado"];
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getUsuarios(): Promise<UsuarioCompleto[]> {
  const supabase = await createClient();

  type ProfileRaw = Profile & {
    roles: { nombre: string } | null;
    sucursales: { nombre: string } | null;
  };

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "*, roles!profiles_rol_id_fkey(nombre), sucursales!profiles_sucursal_id_fkey(nombre)",
    )
    .neq("estado", "eliminado")
    .order("apellido_paterno");

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as ProfileRaw[]).map((p) => ({
    ...p,
    rol_nombre: p.roles?.nombre ?? null,
    sucursal_nombre: p.sucursales?.nombre ?? null,
  }));
}

export async function getRoles(): Promise<Rol[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSucursalesActivas(): Promise<Sucursal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .eq("activa", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countAdmins(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("estado", "activo")
    .eq("roles.nombre", "administrador");

  // Alternativa robusta: obtener todos los perfiles con rol admin
  const { data } = await supabase
    .from("profiles")
    .select("id, roles!profiles_rol_id_fkey(nombre)")
    .eq("estado", "activo");

  if (error || !data) return 0;

  type Row = { id: string; roles: { nombre: string } | null };
  return ((data as unknown as Row[]) ?? []).filter(
    (p) => p.roles?.nombre === "administrador",
  ).length;
}

// ─── Mutations (usan admin client) ───────────────────────────────────────────

export async function crearUsuario(data: CrearUsuarioData): Promise<void> {
  const admin = createAdminClient();

  // 1. Crear en auth.users con display_name = nombre del rol (para compatibilidad)
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nombre: data.nombre,
        apellido_paterno: data.apellido_paterno,
      },
    });

  if (authError) throw new Error(authError.message);
  if (!authUser.user) throw new Error("No se pudo crear el usuario");

  // 2. Actualizar el profile que el trigger ya creó
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      nombre: data.nombre,
      apellido_paterno: data.apellido_paterno,
      apellido_materno: data.apellido_materno ?? null,
      rol_id: data.rol_id,
      sucursal_id: data.sucursal_id,
      estado: "activo",
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUser.user.id);

  if (profileError) throw new Error(profileError.message);
}

export async function actualizarUsuario(
  profileId: string,
  data: ActualizarUsuarioData,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      nombre: data.nombre,
      apellido_paterno: data.apellido_paterno,
      apellido_materno: data.apellido_materno ?? null,
      rol_id: data.rol_id,
      sucursal_id: data.sucursal_id,
      estado: data.estado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw new Error(error.message);
}

export async function eliminarUsuario(profileId: string): Promise<void> {
  const admin = createAdminClient();

  // Soft delete: marcar como eliminado en profiles
  const { error: profileError } = await admin
    .from("profiles")
    .update({ estado: "eliminado", updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (profileError) throw new Error(profileError.message);

  // Eliminar de auth.users para que no pueda iniciar sesión
  const { error: authError } = await admin.auth.admin.deleteUser(profileId);
  if (authError) throw new Error(authError.message);
}

export async function cambiarContrasena(
  nuevaContrasena: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: nuevaContrasena,
  });
  if (error) throw new Error(error.message);
}

export async function actualizarNombrePerfil(
  profileId: string,
  nombre: string,
  apellidoPaterno: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nombre,
      apellido_paterno: apellidoPaterno,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
}
