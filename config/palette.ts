/**
 * PALETA DE COLORES — DANI PIZZAS
 *
 * Este archivo es la fuente centralizada de colores del sistema.
 * Para cambiar un color, actualiza el valor HSL aquí Y el correspondiente
 * en `app/globals.css` (secciones `:root` y `.dark`).
 *
 * Formato HSL: "matiz saturación% luminosidad%"
 * Herramienta recomendada para explorar colores: https://www.colorhexa.com
 */

// ─── Colores de marca ────────────────────────────────────────────────────────

export const BRAND = {
  /** Rojo pizza — color principal. CSS var: --primary */
  primary: "4 80% 56%", // hsl(4, 80%, 56%) → #E53935
  primaryDark: "#c62828", // Para hover/énfasis

  /** Naranja suave — acento. CSS var: --accent */
  accent: "14 100% 63%", // hsl(14, 100%, 63%) → #FF7043

  /** Gris oscuro — secundario. CSS var: --secondary (light) */
  secondary: "0 0% 20%", // hsl(0, 0%, 20%) → #333333
} as const;

// ─── Fondos y superficies ────────────────────────────────────────────────────

export const SURFACE = {
  /** Fondo general (light). CSS var: --background */
  backgroundLight: "0 0% 96%", // hsl(0, 0%, 96%) → #F5F5F5

  /** Fondo general (dark). CSS var: --background */
  backgroundDark: "0 0% 9%", // hsl(0, 0%, 9%) → #171717

  /** Tarjetas y paneles (light). CSS var: --card */
  cardLight: "0 0% 100%", // #FFFFFF

  /** Tarjetas y paneles (dark). CSS var: --card */
  cardDark: "0 0% 12%", // hsl(0, 0%, 12%) → #1F1F1F

  /** Elementos silenciados. CSS var: --muted */
  mutedLight: "0 0% 92%", // hsl(0, 0%, 92%) → #EBEBEB
  mutedDark: "0 0% 18%", // hsl(0, 0%, 18%) → #2E2E2E
} as const;

// ─── Bordes ──────────────────────────────────────────────────────────────────

export const BORDER = {
  /** Borde estándar (light). CSS var: --border */
  borderLight: "0 0% 88%", // hsl(0, 0%, 88%) → #E0E0E0

  /** Borde estándar (dark). CSS var: --border */
  borderDark: "0 0% 20%", // hsl(0, 0%, 20%) → #333333
} as const;

// ─── Texto ───────────────────────────────────────────────────────────────────

export const TEXT = {
  /** Texto principal (light). CSS var: --foreground */
  foregroundLight: "0 0% 13%", // hsl(0, 0%, 13%) → #212121

  /** Texto principal (dark). CSS var: --foreground */
  foregroundDark: "0 0% 96%", // hsl(0, 0%, 96%) → #F5F5F5

  /** Texto secundario (light). CSS var: --muted-foreground */
  mutedLight: "0 0% 46%", // hsl(0, 0%, 46%) → #757575

  /** Texto secundario (dark). CSS var: --muted-foreground */
  mutedDark: "0 0% 60%", // hsl(0, 0%, 60%) → #999999
} as const;

// ─── Estados / Semánticos ────────────────────────────────────────────────────

export const SEMANTIC = {
  /** Verde éxito. CSS var: --success */
  success: "122 39% 49%", // hsl(122, 39%, 49%) → #4CAF50

  /** Amarillo advertencia. CSS var: --warning */
  warning: "43 100% 50%", // hsl(43, 100%, 50%) → #FFB300

  /** Azul información. CSS var: --info */
  info: "207 90% 54%", // hsl(207, 90%, 54%) → #2196F3

  /** Rojo error (comparte valor con primary en light). CSS var: --destructive */
  destructiveLight: "4 80% 56%",
  destructiveDark: "0 72% 51%",
} as const;

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export const SIDEBAR = {
  /** Fondo del sidebar (light). CSS var: --sidebar */
  backgroundLight: "0 0% 100%",
  backgroundDark: "0 0% 12%",

  /** Ítem activo del sidebar. CSS var: --sidebar-accent */
  accentLight: "14 100% 95%", // Naranja muy claro
  accentDark: "0 0% 18%",
} as const;

// ─── Forma ───────────────────────────────────────────────────────────────────

export const SHAPE = {
  /** Border radius base. CSS var: --radius */
  radius: "0.75rem", // 12px → usa rounded-xl en Tailwind

  /** Sombra estándar */
  shadow: "0 4px 12px rgba(0,0,0,0.08)",
} as const;

/**
 * INSTRUCCIONES PARA CAMBIAR COLORES:
 *
 * 1. Identifica la variable que quieres cambiar en este archivo
 * 2. Abre `app/globals.css`
 * 3. Busca la variable CSS correspondiente (indicada en los comentarios arriba)
 * 4. Cambia el valor HSL en `:root` (modo claro) y/o `.dark` (modo oscuro)
 *
 * Ejemplo — cambiar el color primary de rojo a azul:
 *   En globals.css, busca `--primary: 4 80% 56%;`
 *   Cámbialo a `--primary: 220 90% 56%;` (azul)
 *   Haz lo mismo en `.dark` si aplica
 *   Actualiza BRAND.primary aquí: "220 90% 56%"
 */
