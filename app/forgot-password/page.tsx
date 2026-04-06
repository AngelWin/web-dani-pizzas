import Image from "next/image";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/images/logo-dani-pizzas.png"
            alt="DANI PIZZAS"
            width={120}
            height={120}
            className="mb-4 rounded-xl"
            priority
          />
          <h1 className="text-3xl font-bold text-primary">DANI PIZZAS</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa tu correo para recuperar tu contraseña
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
