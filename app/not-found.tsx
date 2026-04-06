import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Pagina no encontrada</p>
      <Link
        href="/login"
        className="rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
