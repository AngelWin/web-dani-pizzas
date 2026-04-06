"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginAlertsProps {
  expired?: string;
  message?: string;
}

export function LoginAlerts({ expired, message }: LoginAlertsProps) {
  return (
    <div className="mb-4 space-y-2">
      {expired === "true" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
          </AlertDescription>
        </Alert>
      )}
      {message === "password-updated" && (
        <Alert className="border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar
            sesión.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
