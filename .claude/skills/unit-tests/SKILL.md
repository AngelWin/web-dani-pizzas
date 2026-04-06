---
name: unit-tests
description: Crear y ejecutar unit tests para el proyecto DANI PIZZAS. Usa cuando necesites escribir tests para Server Actions, componentes React, utilidades, o validaciones de esquemas Zod. Stack de testing: Vitest + Testing Library + MSW.
---

# Unit Tests — DANI PIZZAS

## Stack de Testing

```json
{
  "devDependencies": {
    "vitest": "latest",
    "@vitejs/plugin-react": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@testing-library/jest-dom": "latest",
    "msw": "latest",
    "happy-dom": "latest"
  }
}
```

Instalar con:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom msw happy-dom
```

## Configuración

### `vitest.config.ts`
```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
})
```

### `tests/setup.ts`
```ts
import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}))

// Mock del cliente Supabase
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}))
```

### Scripts en `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Estructura de Tests

```
tests/
├── setup.ts
├── actions/
│   ├── productos.test.ts
│   ├── ventas.test.ts
│   └── delivery.test.ts
├── components/
│   ├── pos/
│   │   └── PosForm.test.tsx
│   └── ui/
│       └── ProductoCard.test.tsx
├── lib/
│   └── validations.test.ts
└── roles/
    ├── admin.test.ts
    ├── cajero.test.ts
    ├── mesero.test.ts
    └── repartidor.test.ts
```

## Patrones de Tests

### 1. Test de Server Action

```ts
// tests/actions/productos.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { crearProducto } from "@/app/actions/productos"

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({ select: () => ({ single: vi.fn().mockResolvedValue({
        data: { id: "uuid-123", nombre: "Pizza Margherita", precio: 25 },
        error: null
      })})})
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-id" } } }) }
  })
}))

describe("crearProducto", () => {
  it("crea un producto correctamente", async () => {
    const formData = new FormData()
    formData.append("nombre", "Pizza Margherita")
    formData.append("precio", "25")
    formData.append("descripcion", "Tomate, queso, albahaca")

    const resultado = await crearProducto(formData)
    expect(resultado.error).toBeNull()
    expect(resultado.data?.nombre).toBe("Pizza Margherita")
  })

  it("rechaza precio negativo", async () => {
    const formData = new FormData()
    formData.append("nombre", "Pizza")
    formData.append("precio", "-5")

    const resultado = await crearProducto(formData)
    expect(resultado.error).toBeDefined()
  })
})
```

### 2. Test de Validación Zod

```ts
// tests/lib/validations.test.ts
import { describe, it, expect } from "vitest"
import { productoSchema, ventaSchema, deliverySchema } from "@/lib/validations"

describe("productoSchema", () => {
  it("valida un producto correcto", () => {
    const resultado = productoSchema.safeParse({
      nombre: "Pizza Margherita",
      precio: 25,
      descripcion: "Tomate, queso, albahaca",
    })
    expect(resultado.success).toBe(true)
  })

  it("falla con nombre vacío", () => {
    const resultado = productoSchema.safeParse({ nombre: "", precio: 25 })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0].path).toContain("nombre")
  })
})

describe("deliverySchema", () => {
  it("requiere dirección cuando tipo es delivery", () => {
    const resultado = deliverySchema.safeParse({
      tipo_pedido: "delivery",
      delivery_method: "propio",
      delivery_address: "",
    })
    expect(resultado.success).toBe(false)
  })

  it("no requiere dirección para pedido en local", () => {
    const resultado = deliverySchema.safeParse({ tipo_pedido: "en_local" })
    expect(resultado.success).toBe(true)
  })
})
```

### 3. Test de Componente React

```tsx
// tests/components/pos/PosForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import PosForm from "@/components/pos/PosForm"

describe("PosForm", () => {
  it("muestra campos de delivery al seleccionar tipo delivery", async () => {
    const user = userEvent.setup()
    render(<PosForm sucursalId="sucursal-1" rol="cajero" />)

    await user.click(screen.getByRole("radio", { name: /delivery/i }))

    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/método de delivery/i)).toBeInTheDocument()
  })

  it("no muestra opción delivery para mesero", () => {
    render(<PosForm sucursalId="sucursal-1" rol="mesero" />)
    expect(screen.queryByRole("radio", { name: /delivery/i })).not.toBeInTheDocument()
  })

  it("auto-llena costo propio en 3 soles", async () => {
    const user = userEvent.setup()
    render(<PosForm sucursalId="sucursal-1" rol="cajero" />)

    await user.click(screen.getByRole("radio", { name: /delivery/i }))
    await user.click(screen.getByRole("radio", { name: /propio/i }))

    expect(screen.getByLabelText(/costo de delivery/i)).toHaveValue("3")
  })
})
```

### 4. Test de Permisos por Rol

```ts
// tests/roles/cajero.test.ts
import { describe, it, expect, vi } from "vitest"
import { puedeAcceder } from "@/lib/auth/permissions"

describe("Permisos Cajero", () => {
  const rol = "cajero"

  it("puede acceder al POS", () => {
    expect(puedeAcceder(rol, "/pos")).toBe(true)
  })

  it("puede acceder a reportes", () => {
    expect(puedeAcceder(rol, "/reportes")).toBe(true)
  })

  it("NO puede acceder a productos", () => {
    expect(puedeAcceder(rol, "/productos")).toBe(false)
  })

  it("NO puede acceder a configuración", () => {
    expect(puedeAcceder(rol, "/configuracion")).toBe(false)
  })
})
```

## Comandos

```bash
# Correr todos los tests
npm test

# Correr en modo watch
npm test

# Correr una sola vez (CI)
npm run test:run

# Ver cobertura
npm run test:coverage

# UI visual de tests
npm run test:ui
```

## Buenas Prácticas

- Un archivo de test por módulo/componente
- Nombrar tests en español: `it("crea un producto correctamente")`
- Usar `describe` para agrupar por feature
- Mockear Supabase siempre (nunca conectar a la DB real en tests)
- Probar casos de éxito Y casos de error
- Probar permisos de cada rol explícitamente
