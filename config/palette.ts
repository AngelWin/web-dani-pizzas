/**
 * PALETAS DE COLORES — DANI PIZZAS
 *
 * Archivo centralizado con todas las paletas del sistema.
 * Para cambiar de paleta, modifica PALETA_ACTIVA al final del archivo
 * y actualiza los valores en `app/globals.css` con los de la paleta elegida.
 *
 * Formato HSL: "matiz saturación% luminosidad%"
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface PaletaColor {
  nombre: string;
  descripcion: string;
  brand: {
    primary: string; // CSS var: --primary
    primaryDark: string; // Para hover/énfasis
    accent: string; // CSS var: --accent
    secondary: string; // CSS var: --secondary (light)
  };
  surface: {
    backgroundLight: string;
    backgroundDark: string;
    cardLight: string;
    cardDark: string;
    mutedLight: string;
    mutedDark: string;
  };
  border: {
    borderLight: string;
    borderDark: string;
  };
  text: {
    foregroundLight: string;
    foregroundDark: string;
    mutedLight: string;
    mutedDark: string;
  };
  semantic: {
    success: string;
    warning: string;
    info: string;
    destructiveLight: string;
    destructiveDark: string;
  };
  sidebar: {
    backgroundLight: string;
    backgroundDark: string;
    accentLight: string;
    accentDark: string;
  };
  shape: {
    radius: string;
    shadow: string;
  };
}

// ─── Paleta Dani Pizzas (Original) ─────────────────────────────────────────

export const paletaColorDaniPizzas: PaletaColor = {
  nombre: "Dani Pizzas",
  descripcion: "Rojo pizza vibrante con naranja suave — estilo pizzería",
  brand: {
    primary: "4 80% 56%", // hsl(4, 80%, 56%)  → #E53935 Rojo pizza
    primaryDark: "#c62828",
    accent: "14 100% 63%", // hsl(14, 100%, 63%) → #FF7043 Naranja suave
    secondary: "0 0% 20%", // hsl(0, 0%, 20%)   → #333333 Gris oscuro
  },
  surface: {
    backgroundLight: "0 0% 96%", // #F5F5F5
    backgroundDark: "0 0% 9%", // #171717
    cardLight: "0 0% 100%", // #FFFFFF
    cardDark: "0 0% 12%", // #1F1F1F
    mutedLight: "0 0% 92%", // #EBEBEB
    mutedDark: "0 0% 18%", // #2E2E2E
  },
  border: {
    borderLight: "0 0% 88%", // #E0E0E0
    borderDark: "0 0% 20%", // #333333
  },
  text: {
    foregroundLight: "0 0% 13%", // #212121
    foregroundDark: "0 0% 96%", // #F5F5F5
    mutedLight: "0 0% 46%", // #757575
    mutedDark: "0 0% 60%", // #999999
  },
  semantic: {
    success: "122 39% 49%", // #4CAF50
    warning: "43 100% 50%", // #FFB300
    info: "207 90% 54%", // #2196F3
    destructiveLight: "4 80% 56%",
    destructiveDark: "0 72% 51%",
  },
  sidebar: {
    backgroundLight: "0 0% 100%",
    backgroundDark: "0 0% 12%",
    accentLight: "14 100% 95%", // Naranja muy claro
    accentDark: "0 0% 18%",
  },
  shape: {
    radius: "0.75rem",
    shadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

// ─── Paleta Enterprise ─────────────────────────────────────────────────────

export const paletaColorEnterprise: PaletaColor = {
  nombre: "Enterprise",
  descripcion: "Azul profesional con teal — estilo corporativo serio",
  brand: {
    primary: "221 83% 53%", // hsl(221, 83%, 53%) → #3B82F6 Azul profesional
    primaryDark: "#1D4ED8", // Blue 700
    accent: "173 80% 40%", // hsl(173, 80%, 40%) → #14B8A6 Teal corporativo
    secondary: "215 19% 35%", // hsl(215, 19%, 35%) → #475569 Slate
  },
  surface: {
    backgroundLight: "210 20% 98%", // #F8FAFC Slate-50
    backgroundDark: "222 47% 11%", // #0F172A Slate-900
    cardLight: "0 0% 100%", // #FFFFFF
    cardDark: "217 33% 17%", // #1E293B Slate-800
    mutedLight: "210 40% 96%", // #F1F5F9 Slate-100
    mutedDark: "217 33% 17%", // #1E293B
  },
  border: {
    borderLight: "214 32% 91%", // #CBD5E1 Slate-300
    borderDark: "217 19% 27%", // #334155 Slate-700
  },
  text: {
    foregroundLight: "222 47% 11%", // #0F172A Slate-900
    foregroundDark: "210 40% 98%", // #F8FAFC Slate-50
    mutedLight: "215 16% 47%", // #64748B Slate-500
    mutedDark: "215 20% 65%", // #94A3B8 Slate-400
  },
  semantic: {
    success: "160 84% 39%", // #059669 Emerald-600
    warning: "38 92% 50%", // #D97706 Amber-600
    info: "199 89% 48%", // #0EA5E9 Sky-500
    destructiveLight: "0 84% 60%", // #EF4444 Red-500
    destructiveDark: "0 63% 31%", // #991B1B Red-800
  },
  sidebar: {
    backgroundLight: "210 40% 98%", // Slate-50
    backgroundDark: "222 47% 11%", // Slate-900
    accentLight: "214 95% 93%", // #DBEAFE Blue-100
    accentDark: "217 33% 17%", // Slate-800
  },
  shape: {
    radius: "0.625rem", // 10px — ligeramente más sutil
    shadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
  },
};

// ─── Selector de Paleta Activa ──────────────────────────────────────────────

/**
 * CAMBIAR PALETA:
 * Cambia esta constante a la paleta que quieras usar.
 * Luego copia los valores HSL correspondientes a `app/globals.css`.
 *
 * Opciones disponibles:
 *   - paletaColorDaniPizzas  (rojo pizza, estilo pizzería)
 *   - paletaColorEnterprise  (azul profesional, estilo corporativo)
 */
export const PALETA_ACTIVA = paletaColorDaniPizzas;

/**
 * INSTRUCCIONES PARA APLICAR UNA PALETA:
 *
 * 1. Cambia PALETA_ACTIVA arriba a la paleta deseada
 * 2. Abre `app/globals.css`
 * 3. Reemplaza los valores HSL en `:root` y `.dark` según la paleta:
 *
 *    :root {
 *      --primary: [brand.primary];
 *      --accent: [brand.accent];
 *      --secondary: [brand.secondary];
 *      --background: [surface.backgroundLight];
 *      --foreground: [text.foregroundLight];
 *      --card: [surface.cardLight];
 *      --muted: [surface.mutedLight];
 *      --muted-foreground: [text.mutedLight];
 *      --border: [border.borderLight];
 *      --destructive: [semantic.destructiveLight];
 *      --success: [semantic.success];
 *      --warning: [semantic.warning];
 *      --info: [semantic.info];
 *      --ring: [brand.primary];
 *      --sidebar: [sidebar.backgroundLight];
 *      --sidebar-accent: [sidebar.accentLight];
 *      --radius: [shape.radius];
 *    }
 *
 *    .dark { ... usar las variantes Dark ... }
 */
