import Image from "next/image";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
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
            Establece tu nueva contraseña
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
