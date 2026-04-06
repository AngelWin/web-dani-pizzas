"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { getDefaultRoute } from "@/lib/auth/permissions";
import type { Role } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import type { ActionResult } from "@/types";

export async function loginAction(
  formData: LoginFormValues,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { data: null, error: "Credenciales incorrectas" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.display_name as Role;

  const defaultRoute =
    role && Object.values(ROLES).includes(role)
      ? getDefaultRoute(role)
      : "/login";

  redirect(defaultRoute);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
