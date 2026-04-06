import { type Role, ROLES } from "@/lib/constants";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/pos",
  "/productos",
  "/promociones",
  "/membresias",
  "/reportes",
  "/sucursales",
  "/configuracion",
] as const;

export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];

/** Rutas permitidas por rol */
export const ROLE_ROUTES: Record<Role, readonly ProtectedRoute[]> = {
  [ROLES.ADMINISTRADOR]: PROTECTED_ROUTES,
  [ROLES.CAJERO]: ["/pos", "/reportes"],
  [ROLES.MESERO]: ["/pos"],
  [ROLES.REPARTIDOR]: ["/pos"],
};

/** Ruta por defecto tras login según rol */
export const DEFAULT_ROUTE: Record<Role, string> = {
  [ROLES.ADMINISTRADOR]: "/dashboard",
  [ROLES.CAJERO]: "/pos",
  [ROLES.MESERO]: "/pos",
  [ROLES.REPARTIDOR]: "/pos",
};
