import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { PrinterProvider } from "@/components/providers/printer-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getMonedaActiva } from "@/lib/services/monedas";
import { getAppVersion } from "@/lib/version";

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

  // Obtener perfil + sucursal en una sola query (JOIN)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*, sucursal:sucursales!profiles_sucursal_id_fkey(*)")
    .eq("id", user.id)
    .single<Profile & { sucursal: Sucursal | null }>();

  const profile: Profile | null = profileData
    ? ({ ...profileData, sucursal: undefined } as unknown as Profile)
    : null;
  const sucursal: Sucursal | null = profileData?.sucursal ?? null;

  const monedaActiva = await getMonedaActiva();
  const version = getAppVersion();

  return (
    <CurrencyProvider
      initialSimbolo={monedaActiva.simbolo}
      initialCodigo={monedaActiva.codigo}
    >
      <AuthProvider
        initialUser={user}
        initialProfile={profile}
        initialSucursal={sucursal}
        initialRoleName={roleName}
      >
        <PrinterProvider sucursalId={profile?.sucursal_id ?? "default"}>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar version={version} />
              <div className="flex min-w-0 flex-1 flex-col">
                <AppHeader />
                <main className="flex-1 p-4 md:p-6">{children}</main>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </PrinterProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
