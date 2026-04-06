"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    startTransition(async () => {
      const result = await forgotPasswordAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setEmailSent(true);
      }
    });
  }

  if (emailSent) {
    return (
      <Card className="border-border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <CardContent className="pt-6 text-center">
          <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-lg font-semibold">Revisa tu correo</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Si existe una cuenta con ese correo, recibirás un enlace para
            restablecer tu contraseña.
          </p>
          <Link href="/login">
            <Button variant="outline" className="h-12 w-full rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="h-12 rounded-xl pl-10"
                disabled={isPending}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando enlace...
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
