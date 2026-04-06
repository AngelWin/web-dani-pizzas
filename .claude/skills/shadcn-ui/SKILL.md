---
name: shadcn-ui
description: Guidelines for using shadcn/ui components in Next.js projects. Use when building UI components, forms, dialogs, tables, or any interface element. Includes component installation, theming, and composition patterns.
---

# shadcn/ui para DANI PIZZAS

## Instalación de Componentes

Instalar componentes individualmente con:
```bash
npx shadcn@latest add [componente]
```

Componentes recomendados para este proyecto:
- `button`, `input`, `label`, `select`, `textarea` — Formularios
- `card`, `badge`, `separator` — Layout
- `dialog`, `sheet`, `popover`, `dropdown-menu` — Overlays
- `table`, `data-table` — Listados
- `tabs`, `accordion` — Navegación
- `toast`, `alert` — Feedback
- `form` — Integración con react-hook-form + zod
- `sidebar` — Navegación lateral
- `chart` — Gráficos del dashboard

## Theming

Los colores del design system de DANI PIZZAS deben configurarse en `globals.css` usando CSS variables:

```css
:root {
  --primary: 4 80% 56%;        /* #E53935 Rojo pizza */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 20%;       /* #333333 Gris oscuro */
  --accent: 14 100% 63%;       /* #FF7043 Naranja suave */
  --background: 0 0% 96%;      /* #F5F5F5 */
  --card: 0 0% 100%;           /* #FFFFFF */
  --border: 0 0% 88%;          /* #E0E0E0 */
  --destructive: 4 80% 56%;    /* #E53935 */
  --success: 122 39% 49%;      /* #4CAF50 */
  --warning: 43 100% 50%;      /* #FFB300 */
  --info: 207 90% 54%;         /* #2196F3 */
  --radius: 0.75rem;           /* 12px */
}
```

## Composición de Componentes

- Componer componentes shadcn, no crear componentes custom desde cero
- Usar `cn()` de `lib/utils` para merge de clases Tailwind
- Usar variantes de componentes para estados diferentes
- Los formularios DEBEN usar `react-hook-form` + `zod` + componente `Form` de shadcn

## Patrones

```tsx
// Formulario con shadcn + react-hook-form + zod
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})
```

## Accesibilidad

- Todos los componentes shadcn ya son accesibles (basados en Radix UI)
- Mantener labels en formularios
- Usar `aria-label` cuando no hay label visible
- Contraste WCAG AA mínimo
