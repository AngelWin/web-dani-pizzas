---
paths: "app/**/*.tsx,components/**/*.tsx,components/**/*.ts"
---

# Reglas Frontend - DANI PIZZAS

## Componentes

- Usar shadcn/ui como base para todos los componentes UI
- Importar iconos SOLO desde `lucide-react`
- Usar `cn()` de `@/lib/utils` para combinar clases Tailwind
- Los componentes deben tener tipado TypeScript estricto (nunca `any`)
- Componentes reutilizables van en `/components`, componentes de página van en `/app`

## Formularios

- SIEMPRE usar `react-hook-form` + `zod` + componente `Form` de shadcn
- Validar todos los campos con esquemas zod
- Mostrar mensajes de error en español

## Estilos

- Usar las CSS variables del design system definidas en `globals.css`
- Border radius: `rounded-xl` (12px)
- Shadow: `shadow-[0_4px_12px_rgba(0,0,0,0.08)]`
- Botones grandes para interacción táctil en POS: `h-12 min-w-[44px]`
- Responsive: mobile-first, POS optimizado para tablet/PC táctil

## Textos

- TODOS los textos de UI deben estar en español (Perú)
- No usar inglés en labels, placeholders, mensajes de error ni botones
