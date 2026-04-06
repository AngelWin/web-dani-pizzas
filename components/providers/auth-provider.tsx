"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/constants";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  sucursal: Sucursal | null;
  role: Role | null;
  roleName: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  sucursal: null,
  role: null,
  roleName: null,
  isLoading: true,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: Profile | null;
  initialSucursal: Sucursal | null;
  initialRoleName: string | null;
}

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
  initialSucursal,
  initialRoleName,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [sucursal, setSucursal] = useState<Sucursal | null>(initialSucursal);
  const [roleName, setRoleName] = useState<string | null>(initialRoleName);
  const [isLoading, setIsLoading] = useState(false);

  const role = (roleName as Role) ?? null;

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setSucursal(null);
        setRoleName(null);
      } else if (session?.user) {
        setUser(session.user);

        // Refrescar perfil con rol via JOIN
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, roles(nombre)")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          const { roles: roleData, ...profileOnly } = profileData as Profile & {
            roles: { nombre: string } | null;
          };
          setProfile(profileOnly);
          setRoleName(roleData?.nombre ?? null);

          if (profileOnly.sucursal_id) {
            const { data: sucursalData } = await supabase
              .from("sucursales")
              .select("*")
              .eq("id", profileOnly.sucursal_id)
              .single<Sucursal>();
            setSucursal(sucursalData);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, sucursal, role, roleName, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
