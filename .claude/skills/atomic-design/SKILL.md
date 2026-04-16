---
name: atomic-design
description: Guía de diseño web moderno con metodología Atomic Design aplicada al proyecto. Usa cuando crees nuevos componentes, decidas dónde ubicarlos, diseñes un sistema de tokens o quieras asegurarte de que la jerarquía de componentes es coherente. Cubre átomos, moléculas, organismos, templates y páginas con Tailwind CSS + shadcn/ui.
---

# Atomic Design — DANI PIZZAS

Metodología de Brad Frost adaptada al stack del proyecto: Next.js 16 + Tailwind CSS + shadcn/ui.

---

## Los 5 Niveles

```
Átomos → Moléculas → Organismos → Templates → Páginas
```

| Nivel | Descripción | Ubicación en el proyecto |
|-------|-------------|--------------------------|
| **Átomo** | Unidad más pequeña. No se puede dividir más. | `components/ui/` |
| **Molécula** | Combinación de 2–4 átomos con una función clara. | `components/shared/` |
| **Organismo** | Sección compleja con lógica propia. | `components/[feature]/` |
| **Template** | Layout sin datos reales — estructura de la página. | `app/(dashboard)/layout.tsx`, layouts de feature |
| **Página** | Template + datos reales. El Server Component final. | `app/(dashboard)/[feature]/page.tsx` |

---

## Nivel 1 — Átomos (`components/ui/`)

Son los primitivos de shadcn/ui más cualquier elemento base del design system.

**Criterio:** Un átomo hace UNA sola cosa. No tiene estado propio de negocio. Es genérico y reutilizable en cualquier contexto.

**Átomos del proyecto (ya existentes vía shadcn):**
- `Button` — acción
- `Input`, `Textarea` — entrada de texto
- `Badge` — etiqueta de estado
- `Separator` — línea divisora
- `Label` — etiqueta de campo
- `Skeleton` — estado de carga
- `Avatar` — imagen de perfil
- `Switch` — toggle booleano
- `Checkbox`, `RadioGroup` — selección

**Cuándo crear un átomo nuevo:**
- Cuando un elemento se repite en 3+ lugares con la misma apariencia
- Cuando tiene variantes (size, color, estado) que necesitan centralización
- Ejemplo: `PrecioDisplay` — muestra `S/. XX.XX` con tipografía consistente

```tsx
// ✅ Átomo bien definido — genérico, sin datos de negocio
// components/ui/precio-display.tsx
interface PrecioDisplayProps {
  valor: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PrecioDisplay({ valor, size = "md", className }: PrecioDisplayProps) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl font-bold" };
  return (
    <span className={cn("tabular-nums font-mono", sizes[size], className)}>
      S/. {valor.toFixed(2)}
    </span>
  );
}
```

---

## Nivel 2 — Moléculas (`components/shared/`)

Combinan átomos para resolver una tarea específica pero reutilizable entre features.

**Criterio:** Una molécula hace UNA función de negocio genérica. Puede tener estado local simple (hover, focus, toggle). No conoce el dominio de una feature específica.

**Moléculas del proyecto (ya existentes):**
- `PageHeader` — título + descripción de página
- `ConfirmDialog` — dialog de confirmación reutilizable
- `EmptyState` — estado vacío con ícono + texto + acción
- `DataTablePagination` — controles de paginación
- `SucursalSelector` — selector de sucursal (transversal)

**Ejemplos de moléculas a crear si se necesitan:**
```tsx
// components/shared/search-input.tsx — buscador con ícono + clear
// components/shared/status-badge.tsx — badge con color por estado (genérico)
// components/shared/metric-card.tsx — card de métrica con título + valor + tendencia
// components/shared/date-range-picker.tsx — selector de rango de fechas
```

**Cómo saber si algo es molécula y no organismo:**
- ¿Funciona igual en `/ordenes`, `/ventas` y `/reportes`? → Molécula
- ¿Solo tiene sentido en el contexto de una feature? → Organismo

```tsx
// ✅ Molécula — reutilizable en cualquier feature
// components/shared/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

---

## Nivel 3 — Organismos (`components/[feature]/`)

Secciones completas con lógica de negocio propia. Conocen el dominio.

**Criterio:** Un organismo puede tener estado complejo (useState, useReducer, hooks custom). Conoce los tipos del dominio (Orden, Producto, Cliente). Puede llamar Server Actions.

**Organismos del proyecto:**

| Feature | Organismos |
|---------|-----------|
| `pos/` | `PosClient`, `Catalogo`, `Carrito`, `CobrarDialog`, `FormularioPedidoDialog` |
| `ordenes/` | `ListaOrdenes`, `TarjetaOrden`, `CobroDialog` |
| `productos/` | `TablaProductos`, `ProductoForm`, `ConfiguradorVariantes` |
| `caja/` | `SesionActiva`, `AbrirCajaDialog`, `CerrarCajaDialog` |
| `dashboard/` | `ResumenVentas`, `PedidosRecientes`, `GraficoVentas` |

```tsx
// ✅ Organismo — conoce el dominio, tiene estado propio
// components/ordenes/tarjeta-orden.tsx
interface TarjetaOrdenProps {
  orden: OrdenConItems;          // Tipo de dominio específico
  rol: string | null;
  modeloNegocio: ModeloNegocio;
  onEstadoCambiado: () => void;
}
```

**Lo que NO debe hacer un organismo:**
- Llamar directamente a Supabase (eso lo hacen los servicios vía Server Actions)
- Contener lógica de cálculo matemático compleja (eso va en `lib/utils/`)
- Renderizar otra página completa dentro de sí mismo

---

## Nivel 4 — Templates (Layouts)

Define la estructura de la página sin datos reales.

**Criterio:** Un template es el esqueleto. Define zonas, proporciones y relaciones entre organismos. No tiene datos de negocio.

**Templates del proyecto:**

```tsx
// app/(dashboard)/layout.tsx — Template principal
// Define: sidebar + header + área de contenido
<div className="flex h-screen bg-background">
  <AppSidebar />           {/* Organismo: navegación */}
  <div className="flex flex-col flex-1 overflow-hidden">
    <AppHeader />           {/* Organismo: cabecera */}
    <main className="flex-1 overflow-auto p-4 md:p-6">
      {children}            {/* Aquí van las páginas */}
    </main>
  </div>
</div>
```

**Cuándo crear un layout de feature:**
```tsx
// app/(dashboard)/reportes/layout.tsx — Template de reportes
// Define: tabs de navegación entre /reportes y /reportes/cierres
export default function ReportesLayout({ children }) {
  return (
    <div className="space-y-6">
      <TabsReporte />        {/* Navegación entre reportes */}
      {children}
    </div>
  );
}
```

---

## Nivel 5 — Páginas (`app/(dashboard)/[feature]/page.tsx`)

Template + datos reales. Son Server Components que orquestan el fetch y pasan datos a los organismos.

**Criterio:** Una página NO tiene lógica de UI. Solo fetcha datos, valida permisos y pasa props. Todo lo visual va en organismos.

```tsx
// ✅ Página bien estructurada
export default async function OrdenesPage({ searchParams }) {
  // 1. Resolver params
  const params = await searchParams;

  // 2. Auth + rol
  const supabase = await createClient();
  const [{ data: rol }, { data: sucursalId }] = await Promise.all([...]);

  // 3. Fetch de datos en paralelo
  const [ordenes, config, niveles] = await Promise.all([
    getOrdenes(sucursalId, "todas", fecha),
    getConfiguracionNegocio(),
    getNivelesMembresia(),
  ]);

  // 4. Renderizar — solo JSX con organismos, sin lógica de UI
  return (
    <div className="space-y-6">
      <PageHeader title="Órdenes" />          {/* Molécula */}
      <ListaOrdenes                            {/* Organismo */}
        ordenes={ordenes}
        rol={rol}
        modeloNegocio={config?.modelo_negocio ?? "simple"}
      />
    </div>
  );
}
```

---

## Design Tokens del Proyecto

Los tokens son los valores del design system que deben ser consistentes en todos los niveles.

### Tokens de Color (definidos en `globals.css`)

```css
/* Mapeo de variables CSS del proyecto */
--primary: rojo pizza (#E53935)
--secondary: gris oscuro (#333333)
--accent: naranja (#FF7043)
--background: fondo claro (#F5F5F5)
--foreground: texto principal (#212121)
--muted-foreground: texto secundario (#757575)
--destructive: error (#E53935)
--success: éxito (#4CAF50)
--warning: advertencia (#FFB300)
```

**Usar siempre variables CSS, nunca colores hardcodeados:**
```tsx
// ❌ Color hardcodeado
<span className="text-[#E53935]">Error</span>

// ✅ Token semántico
<span className="text-destructive">Error</span>
```

### Tokens de Espaciado

| Token | Tailwind | Uso |
|-------|---------|-----|
| Espaciado interno de card | `p-4 md:p-6` | Cards de dashboard |
| Gap entre secciones | `space-y-6` | Dentro de páginas |
| Gap entre cards | `gap-4` | Grids de cards |
| Padding de página | `p-4 md:p-6 lg:p-8` | Main content |

### Tokens de Tipografía

| Uso | Clase Tailwind |
|-----|---------------|
| Título de página | `text-2xl sm:text-3xl font-bold` |
| Subtítulo de sección | `text-lg font-semibold` |
| Cuerpo de texto | `text-sm text-foreground` |
| Texto secundario | `text-sm text-muted-foreground` |
| Label de campo | `text-sm font-medium` |
| Precio POS | `text-2xl font-bold tabular-nums` |

### Tokens de Radio de Borde

```tsx
// Del design system del proyecto: border-radius 12px = rounded-xl
<Card className="rounded-xl">          // Cards
<Button className="rounded-lg">        // Botones
<Input className="rounded-lg">         // Inputs
<Badge className="rounded-full">       // Badges de estado
```

---

## Cómo decidir dónde va un componente nuevo

Sigue este árbol de decisión:

```
¿Es un primitivo de UI genérico (botón, input, badge)?
  → components/ui/ (Átomo)

¿Combina 2-4 átomos y funciona igual en cualquier feature?
  → components/shared/ (Molécula)

¿Es específico de una feature y conoce sus tipos de dominio?
  → components/[feature]/ (Organismo)

¿Define la estructura sin datos, solo zonas y layouts?
  → app/(dashboard)/[feature]/layout.tsx (Template)

¿Fetcha datos y orquesta organismos?
  → app/(dashboard)/[feature]/page.tsx (Página)
```

---

## Checklist Atomic Design

Antes de crear un componente nuevo:

- [ ] ¿Ya existe un átomo/molécula que puedo reutilizar o extender?
- [ ] ¿El componente tiene una responsabilidad única y clara?
- [ ] ¿Está ubicado en el nivel correcto de la jerarquía?
- [ ] ¿Usa los tokens del design system (colores CSS vars, espaciados, radios)?
- [ ] ¿Las props tienen tipos TypeScript explícitos con `interface`?
- [ ] ¿Es responsive desde su nivel (mobile-first)?
- [ ] ¿Usa componentes de `components/ui/` como base antes de crear CSS custom?

Al revisar un componente existente:
- [ ] ¿Hay lógica de negocio en un átomo/molécula que debería estar en un organismo?
- [ ] ¿Hay UI embebida en una página que debería ser un organismo?
- [ ] ¿El componente mezcla dos responsabilidades distintas?

---

## Anti-patrones a evitar

```tsx
// ❌ Átomo con lógica de negocio
// components/ui/boton-cobrar.tsx — MAL: conoce el dominio de cobro
export function BotonCobrar({ ordenId }: { ordenId: string }) {
  async function cobrar() { await cobrarOrdenAction(ordenId, ...); }
  return <Button onClick={cobrar}>Cobrar</Button>;
}

// ✅ Átomo genérico + lógica en organismo
// El Button de shadcn es el átomo
// El organismo TarjetaOrden contiene la lógica de cobro

// ❌ Organismo en components/shared/ (conoce el dominio)
// components/shared/tarjeta-orden.tsx — MAL: es específico de órdenes

// ✅ En su feature
// components/ordenes/tarjeta-orden.tsx

// ❌ Página con lógica de UI
export default async function Page() {
  const ordenes = await getOrdenes();
  // MAL: lógica de presentación en la página
  const ordenesAgrupadas = ordenes.reduce((acc, o) => {
    if (!acc[o.estado]) acc[o.estado] = [];
    acc[o.estado].push(o);
    return acc;
  }, {});
  return <div>...</div>;
}

// ✅ La agrupación va en el organismo o en lib/utils/
export default async function Page() {
  const ordenes = await getOrdenes();
  return <ListaOrdenes ordenes={ordenes} />; // El organismo agrupa internamente
}
```

---

## Reglas de comportamiento

- Al proponer un componente nuevo, siempre indicar su nivel atómico y por qué
- Si hay duda entre molécula y organismo, preguntar si el componente conoce tipos del dominio
- Usar siempre `components/ui/` como base antes de crear elementos visuales desde cero
- Los design tokens siempre vía variables CSS o clases Tailwind semánticas, nunca colores hex directos
- Respuestas en español
