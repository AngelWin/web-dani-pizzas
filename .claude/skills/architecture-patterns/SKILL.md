---
name: architecture-patterns
description: Analiza y evalúa decisiones de arquitectura y patrones de diseño. Usa cuando el usuario pregunte cómo estructurar una feature, dónde colocar código, si un patrón es correcto, o cuando haya dudas sobre la organización del proyecto. Cubre patrones para Next.js App Router, Supabase, servicios y componentes.
---

# Arquitectura y Patrones — DANI PIZZAS

---

## Estructura del Proyecto

```
app/
├── (auth)/              # Rutas públicas (login, reset-password)
├── (dashboard)/         # Rutas protegidas por middleware
│   ├── layout.tsx       # Sidebar + auth check
│   ├── pos/
│   ├── ordenes/
│   ├── productos/
│   └── ...
└── api/                 # Route Handlers (webhooks, keep-alive)

components/
├── ui/                  # shadcn primitivos (Button, Dialog, etc.)
├── shared/              # Componentes reutilizables entre features
└── [feature]/           # Componentes específicos de cada feature

lib/
├── services/            # Toda la lógica de acceso a datos (Supabase queries)
├── validations/         # Schemas de Zod reutilizables
└── supabase/            # Clients (server, client, middleware)

types/
├── database.ts          # Tipos generados por Supabase
└── index.ts             # Tipos de dominio de la app
```

---

## Patrón de Capas

```
Page (Server Component)
  ↓ fetches data via
Service (lib/services/)
  ↓ queries
Supabase (DB con RLS)

User action
  ↓ calls
Server Action (app/.../actions.ts)
  ↓ validates → calls
Service (lib/services/)
  ↓ mutates
Supabase (DB con RLS)
```

**Regla de oro:** Las páginas no llaman a Supabase directamente. Todo va por `lib/services/`.

---

## Patrones Correctos

### Server Component con fetch paralelo
```tsx
// ✅ Correcto — fetch paralelo en Server Component
export default async function Page() {
  const [productos, config, sesion] = await Promise.all([
    getProductos(sucursalId),
    getConfiguracionNegocio(),
    getSesionActiva(sucursalId).catch(() => null),
  ]);
  return <ClientComponent productos={productos} config={config} />;
}
```

### Server Action con validación completa
```ts
// ✅ Patrón estándar de Server Action
"use server"

export async function crearOrdenAction(rawData: unknown): Promise<ActionResult<Orden>> {
  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  // 2. Rol
  const { data: rol } = await supabase.rpc("get_user_role");
  if (!["administrador", "cajero", "mesero"].includes(rol ?? "")) {
    return { data: null, error: "Sin permisos" };
  }

  // 3. Validación
  const parsed = crearOrdenSchema.safeParse(rawData);
  if (!parsed.success) return { data: null, error: parsed.error.errors[0].message };

  // 4. Lógica de negocio en el servicio
  const orden = await crearOrden(parsed.data);

  // 5. Revalidar
  revalidatePath("/ordenes");
  return { data: orden, error: null };
}
```

### Servicio de datos
```ts
// ✅ Servicio limpio — solo query, sin lógica de UI
export async function getOrdenes(
  sucursalId: string | null,
  fecha?: string,
): Promise<Orden[]> {
  const supabase = await createClient();
  let query = supabase.from("ordenes").select("*, orden_items(*)");
  if (sucursalId) query = query.eq("sucursal_id", sucursalId);
  if (fecha) query = query.gte("created_at", `${fecha}T00:00:00`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
```

### Tipo de retorno estándar para Server Actions
```ts
// types/index.ts
export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};
```

---

## Anti-patrones — Evitar

### ❌ Fetch de datos en Client Component
```tsx
// ❌ Mal — useEffect para fetch inicial
function Productos() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/productos").then(...).then(setData);
  }, []);
}

// ✅ Bien — Server Component
async function ProductosPage() {
  const data = await getProductos(sucursalId);
  return <ProductosTable data={data} />;
}
```

### ❌ Lógica de negocio en el componente
```tsx
// ❌ Mal — lógica en el componente
function OrdenCard({ orden }) {
  const total = orden.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const descuento = orden.cliente?.membresia ? total * 0.1 : 0;
  // ...
}

// ✅ Bien — lógica en el servicio o en el action, el componente recibe datos calculados
```

### ❌ .single() en queries que pueden retornar 0 filas
```ts
// ❌ Crash si la tabla está vacía
const { data } = await supabase.from("config").select("*").single();

// ✅ Retorna null sin error
const { data } = await supabase.from("config").select("*").maybeSingle();
const valor = data?.campo ?? "default";
```

### ❌ Query dentro de un loop
```ts
// ❌ N queries al DB
for (const orden of ordenes) {
  const { data: items } = await supabase
    .from("orden_items").select("*").eq("orden_id", orden.id);
}

// ✅ Una query con join o .in()
const { data: items } = await supabase
  .from("orden_items").select("*")
  .in("orden_id", ordenes.map(o => o.id));
```

---

## Dónde va cada cosa

| Tipo de código | Ubicación |
|----------------|-----------|
| Query/mutation a Supabase | `lib/services/[feature].ts` |
| Validación de formulario | `lib/validations/[feature].ts` (Zod schema) |
| Mutation llamada desde UI | `app/(dashboard)/[feature]/actions.ts` |
| Componente reutilizable entre features | `components/shared/` |
| Componente específico de una feature | `components/[feature]/` |
| Primitivo de UI (shadcn) | `components/ui/` |
| Tipos de la DB | `types/database.ts` (generado) |
| Tipos de dominio | `types/index.ts` |
| Página (fetch + layout) | `app/(dashboard)/[feature]/page.tsx` |
| Route Handler (API REST) | `app/api/[ruta]/route.ts` |

---

## Checklist al diseñar una nueva feature

- [ ] ¿Los datos se fetchean en un Server Component?
- [ ] ¿Las mutations van por Server Action con validación Zod?
- [ ] ¿El servicio en `lib/services/` es la única capa que toca Supabase?
- [ ] ¿Los tipos de retorno están explícitamente declarados?
- [ ] ¿Las queries filtran por `sucursal_id` donde aplica?
- [ ] ¿El `ActionResult<T>` es consistente con el resto de actions?
- [ ] ¿Se llama `revalidatePath` después de mutations?
- [ ] ¿Los componentes nuevos van en `components/[feature]/` o `components/shared/`?
- [ ] ¿Hay `loading.tsx` para estados de carga si la page es lenta?

---

## Reglas de comportamiento

- Al proponer dónde colocar código, siempre justificar con la capa correspondiente
- Si el usuario muestra un anti-patrón, explicar por qué es problemático antes de sugerir la alternativa
- Las sugerencias deben ser consistentes con el código existente del proyecto
- Todos los ejemplos de código en TypeScript estricto, sin `any`
- Respuestas en español
