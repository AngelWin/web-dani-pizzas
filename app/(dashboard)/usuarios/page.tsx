import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UsuariosTabla } from "@/components/usuarios/usuarios-tabla";
import {
  getUsuarios,
  getRoles,
  getSucursalesActivas,
} from "@/lib/services/usuarios";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (rolNombre !== "administrador") {
    redirect("/dashboard");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [usuarios, roles, sucursales] = await Promise.all([
    getUsuarios(),
    getRoles(),
    getSucursalesActivas(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios y sus roles en el sistema"
      />
      <UsuariosTabla
        usuarios={usuarios}
        roles={roles}
        sucursales={sucursales}
        perfilActualId={user?.id ?? ""}
      />
    </div>
  );
}
