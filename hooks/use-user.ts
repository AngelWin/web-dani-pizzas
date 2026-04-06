"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function useUser() {
  const { user, profile, role, isLoading } = useAuth();

  return {
    user,
    profile,
    role,
    isLoading,
    nombreCompleto: profile?.nombre_completo ?? user?.email ?? "",
    email: profile?.email ?? user?.email ?? "",
    isAdmin: role === "administrador",
  };
}
