"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { getNavItemsByRole } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  administrador: "Admin",
  cajero: "Cajero",
  mesero: "Mesero",
  repartidor: "Repartidor",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { role, nombreCompleto, fotoUrl } = useUser();

  const navItems = role ? getNavItemsByRole(role) : [];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/images/logo-dani-pizzas.png"
            alt="DANI PIZZAS"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">DANI PIZZAS</span>
            <span className="text-xs text-muted-foreground">
              Panel de Administración
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-11 rounded-xl",
                        isActive && "bg-primary/10 text-primary font-medium",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Image
            src={fotoUrl}
            alt={nombreCompleto}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {nombreCompleto}
            </span>
            {role && (
              <Badge variant="secondary" className="w-fit text-xs">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
