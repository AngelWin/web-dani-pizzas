"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-destructive">Error</h1>
      <p className="text-muted-foreground">Algo salio mal</p>
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
