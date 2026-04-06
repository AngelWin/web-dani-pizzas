import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getDefaultRoute } from "@/lib/auth/permissions";
import { ROLES, type Role } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Si hay un parámetro next (ej: reset-password), redirigir ahí
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = user?.user_metadata?.display_name as Role;
      const redirectTo =
        role && Object.values(ROLES).includes(role)
          ? getDefaultRoute(role)
          : "/dashboard";
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
