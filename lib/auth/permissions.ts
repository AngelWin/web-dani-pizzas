import { type Role } from "@/lib/constants";
import {
  ROLE_ROUTES,
  DEFAULT_ROUTE,
  PROTECTED_ROUTES,
  type ProtectedRoute,
} from "./roles";

/** Verifica si un rol tiene acceso a una ruta */
export function hasAccess(role: Role, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role];
  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/** Obtiene la ruta por defecto para un rol (post-login redirect) */
export function getDefaultRoute(role: Role): string {
  return DEFAULT_ROUTE[role];
}

/** Obtiene todas las rutas permitidas para un rol */
export function getAllowedRoutes(role: Role): readonly ProtectedRoute[] {
  return ROLE_ROUTES[role];
}

/** Verifica si una ruta es protegida */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/** Rutas públicas que no requieren autenticación */
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

/** Verifica si una ruta es pública */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}
