import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";
import { EditarNombreForm } from "@/components/usuarios/editar-nombre-form";
import { CambiarContrasenaForm } from "@/components/usuarios/cambiar-contrasena-form";
import { User, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    profileResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select(
        "id, nombre, apellido_paterno, email, rol_id, roles!profiles_rol_id_fkey(nombre)",
      )
      .maybeSingle(),
  ]);

  const { data: profile } = profileResult;

  const rolNombre =
    (profile as unknown as { roles: { nombre: string } | null } | null)?.roles
      ?.nombre ?? null;

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader
        title="Mi perfil"
        description="Gestiona tus datos personales"
      />

      {/* Info actual */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm text-muted-foreground">
          Correo:{" "}
          <span className="font-medium text-foreground">
            {profile?.email ?? user?.email}
          </span>
        </p>
        {rolNombre && (
          <p className="text-sm text-muted-foreground">
            Rol:{" "}
            <span className="font-medium text-foreground capitalize">
              {rolNombre}
            </span>
          </p>
        )}
      </div>

      {/* Sección nombre */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Datos personales</h2>
        </div>
        <EditarNombreForm
          profileId={profile?.id ?? user?.id ?? ""}
          nombre={profile?.nombre ?? ""}
          apellidoPaterno={profile?.apellido_paterno ?? ""}
        />
      </section>

      <Separator />

      {/* Sección contraseña */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Cambiar contraseña</h2>
        </div>
        <CambiarContrasenaForm />
      </section>
    </div>
  );
}
