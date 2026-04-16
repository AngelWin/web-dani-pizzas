import Image from "next/image";
import { LoginForm } from "./login-form";
import { LoginAlerts } from "./login-alerts";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/images/logo-dani-pizzas.png"
            alt="DANI PIZZAS"
            width={120}
            height={120}
            className="mb-4 rounded-xl"
            priority
          />
          <h1 className="text-3xl font-bold text-primary">DANI PIZZAS - QA</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa a tu cuenta para continuar
          </p>
        </div>
        <LoginAlerts expired={params.expired} message={params.message} />
        <LoginForm />
      </div>

      <span className="absolute top-4 left-4 font-mono text-sm font-semibold text-muted-foreground/50">
        v1.0.0
      </span>

      <footer className="py-4 text-center text-xs text-muted-foreground/60">
        <p>
          &copy; {new Date().getFullYear()} DANI PIZZAS - QA. Todos los derechos
          reservados.
        </p>
        <p className="mt-0.5">Desarrollado por Angel Abad</p>
      </footer>
    </div>
  );
}
