"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart2, Vault } from "lucide-react";

const TABS = [
  { href: "/reportes", label: "Ventas", icon: BarChart2 },
  { href: "/reportes/cierres", label: "Cierres de caja", icon: Vault },
];

export function TabsReporte() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activo
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
