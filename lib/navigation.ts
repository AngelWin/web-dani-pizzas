import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Tag,
  Crown,
  BarChart3,
  Store,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/constants";
import { ROLE_ROUTES } from "@/lib/auth/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { title: "Órdenes", href: "/ordenes", icon: ClipboardList },
  { title: "Productos", href: "/productos", icon: Package },
  { title: "Promociones", href: "/promociones", icon: Tag },
  { title: "Membresías", href: "/membresias", icon: Crown },
  { title: "Reportes", href: "/reportes", icon: BarChart3 },
  { title: "Sucursales", href: "/sucursales", icon: Store },
  { title: "Usuarios", href: "/usuarios", icon: Users },
  { title: "Configuración", href: "/configuracion", icon: Settings },
];

export function getNavItemsByRole(role: Role): NavItem[] {
  const allowedRoutes = ROLE_ROUTES[role];
  return ALL_NAV_ITEMS.filter((item) =>
    allowedRoutes.some(
      (route) => item.href === route || item.href.startsWith(route + "/"),
    ),
  );
}
