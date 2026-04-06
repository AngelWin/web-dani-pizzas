---
name: nextjs-app-router
description: Best practices for Next.js App Router development. Use when creating pages, layouts, server components, server actions, middleware, or any Next.js specific pattern. Covers routing, data fetching, caching, and performance.
---

# Next.js App Router para DANI PIZZAS

## Estructura de Archivos

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Layout con sidebar
│   ├── dashboard/
│   │   └── page.tsx
│   ├── pos/
│   │   └── page.tsx
│   ├── productos/
│   │   └── page.tsx
│   ├── promociones/
│   │   └── page.tsx
│   ├── membresias/
│   │   └── page.tsx
│   ├── reportes/
│   │   └── page.tsx
│   ├── sucursales/
│   │   └── page.tsx
│   └── configuracion/
│       └── page.tsx
├── layout.tsx              # Root layout
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

## Server Components vs Client Components

- **Por defecto todo es Server Component** (sin `"use client"`)
- Usar `"use client"` SOLO cuando se necesite:
  - `useState`, `useEffect`, hooks de React
  - Event handlers (`onClick`, `onChange`)
  - APIs del navegador (`window`, `document`)
  - Librerías que requieren el DOM

## Server Actions

Usar para todas las mutations (crear, editar, eliminar):

```tsx
// app/actions/productos.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function crearProducto(formData: FormData) {
  const supabase = await createClient()
  // ... validar con zod, insertar en DB
  revalidatePath("/productos")
}
```

## Data Fetching

- Fetch datos en Server Components directamente
- Usar Supabase server client para queries con RLS
- No usar `useEffect` para fetch inicial de datos

```tsx
// app/(dashboard)/productos/page.tsx
export default async function ProductosPage() {
  const supabase = await createClient()
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("nombre")

  return <ProductosTable data={productos} />
}
```

## Middleware

Usar para proteger rutas y verificar autenticación:

```tsx
// middleware.ts
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
}
```

## Metadata

Definir metadata en cada page para SEO:

```tsx
export const metadata = {
  title: "Productos | DANI PIZZAS",
  description: "Gestión de productos",
}
```

## Performance

- Usar `loading.tsx` para skeleton loading states
- Usar `error.tsx` para error boundaries
- Usar `Suspense` para streaming de componentes pesados
- Importar componentes pesados con `dynamic()` si son client-only
- Optimizar imágenes con `next/image`
