/** Retorna la fecha actual en Lima (UTC-5) como string YYYY-MM-DD */
export function getHoyLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

/** Retorna la fecha de hace N días en Lima como string YYYY-MM-DD */
export function getDiasAtrasLima(dias: number): string {
  const d = new Date(Date.now() - 5 * 60 * 60 * 1000);
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}
