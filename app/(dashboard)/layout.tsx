import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener perfil con rol via JOIN
  let profile: Profile | null = null;
  let sucursal: Sucursal | null = null;
  let roleName: string | null = null;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (profileData) {
    const { roles: roleData, ...profileOnly } = profileData as Profile & {
      roles: { nombre: string } | null;
    };
    profile = profileOnly;
    roleName = roleData?.nombre ?? null;

    // Obtener sucursal del perfil
    if (profileOnly.sucursal_id) {
      const { data: sucursalData } = await supabase
        .from("sucursales")
        .select("*")
        .eq("id", profileOnly.sucursal_id)
        .single<Sucursal>();

      sucursal = sucursalData;
    }
  }

  return (
    <AuthProvider
      initialUser={user}
      initialProfile={profile}
      initialSucursal={sucursal}
      initialRoleName={roleName}
    >
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <AppHeader />
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
