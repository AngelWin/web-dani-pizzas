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

  // El rol viene del JWT (app_metadata) — sin query DB extra
  const roleName = (user.app_metadata?.role as string | undefined) ?? null;

  // Obtener perfil
  let profile: Profile | null = null;
  let sucursal: Sucursal | null = null;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profileData) {
    profile = profileData;

    if (profileData.sucursal_id) {
      const { data: sucursalData } = await supabase
        .from("sucursales")
        .select("*")
        .eq("id", profileData.sucursal_id)
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
