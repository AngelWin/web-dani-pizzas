"use client";

import Image from "next/image";
import { useTransition } from "react";
import { LogOut, Moon, Store, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";
import { useSucursal } from "@/hooks/use-sucursal";
import { logoutAction } from "@/actions/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SucursalSelector } from "@/components/shared/sucursal-selector";
import { PrinterStatusIndicator } from "@/components/printing/printer-status-indicator";

export function AppHeader() {
  const { nombreCompleto, email, role, fotoUrl } = useUser();
  const { canSelectSucursal, selectedSucursal } = useSucursal();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      {/* Selector de sucursal (solo admin) */}
      {canSelectSucursal && <SucursalSelector />}

      <div className="ml-auto flex items-center gap-2">
        {/* Nombre de sucursal (solo roles no-admin) */}
        {!canSelectSucursal && selectedSucursal && (
          <div className="flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {selectedSucursal.nombre}
            </span>
          </div>
        )}

        {/* Indicador de impresora */}
        <PrinterStatusIndicator />

        {/* Toggle tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* Menu de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full p-0"
            >
              <Image
                src={fotoUrl}
                alt={nombreCompleto}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="sr-only">Menú de usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Image
                  src={fotoUrl}
                  alt={nombreCompleto}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">
                    {nombreCompleto}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                  {role && (
                    <span className="mt-0.5 text-xs capitalize text-primary">
                      {role}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/perfil">
                <UserCircle2 className="mr-2 h-4 w-4" />
                Mi perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
