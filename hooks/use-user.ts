"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { DEFAULT_USER_IMAGE } from "@/lib/constants";

export function useUser() {
  const { user, profile, role, isLoading } = useAuth();

  const nombre = profile?.nombre ?? "";
  const apellidoPaterno = profile?.apellido_paterno ?? "";
  const nombreCompleto = [nombre, apellidoPaterno].filter(Boolean).join(" ");

  return {
    user,
    profile,
    role,
    isLoading,
    nombre,
    apellidoPaterno,
    nombreCompleto,
    email: profile?.email ?? user?.email ?? "",
    fotoUrl: profile?.foto_url ?? DEFAULT_USER_IMAGE,
    celular: profile?.celular ?? "",
    codigoQr: profile?.codigo_qr ?? "",
    isAdmin: role === "administrador",
  };
}
