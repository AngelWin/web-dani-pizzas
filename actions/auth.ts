"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  type LoginFormValues,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
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

export async function forgotPasswordAction(
  formData: ForgotPasswordFormValues,
): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return {
      data: null,
      error: "No se pudo enviar el enlace. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

export async function resetPasswordAction(
  formData: ResetPasswordFormValues,
): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      data: null,
      error:
        "No se pudo actualizar la contraseña. El enlace puede haber expirado.",
    };
  }

  redirect("/login?message=password-updated");
}
