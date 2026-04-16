import fs from "fs";
import path from "path";

/**
 * Lee el CHANGELOG.md y retorna la versión más reciente (ej: "v1.0.1").
 * Busca la primera línea con el patrón ## [vX.Y.Z].
 * Si no se puede leer el archivo, retorna "v?".
 */
export function getAppVersion(): string {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    const content = fs.readFileSync(changelogPath, "utf-8");
    const match = content.match(/##\s+\[(v\d+\.\d+\.\d+)\]/);
    return match?.[1] ?? "v?";
  } catch {
    return "v?";
  }
}
