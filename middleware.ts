import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLES, type Role } from "@/lib/constants";
import {
  hasAccess,
  getDefaultRoute,
  isPublicRoute,
  isProtectedRoute,
} from "@/lib/auth/permissions";

function isValidRole(role: unknown): role is Role {
  return (
    typeof role === "string" && Object.values(ROLES).includes(role as Role)
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Ruta pública + usuario autenticado → redirigir al default del rol
  if (isPublicRoute(pathname) && user) {
    const role = user.user_metadata?.display_name;
    if (isValidRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRoute(role);
      return NextResponse.redirect(url);
    }
  }

  // Ruta protegida + sin sesión → redirigir a login con mensaje de sesión expirada
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("expired", "true");
    return NextResponse.redirect(url);
  }

  // Ruta protegida + usuario autenticado → verificar RBAC
  if (isProtectedRoute(pathname) && user) {
    const role = user.user_metadata?.display_name;

    if (!isValidRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (!hasAccess(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRoute(role);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
