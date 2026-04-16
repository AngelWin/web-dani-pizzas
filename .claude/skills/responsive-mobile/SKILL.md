---
name: responsive-mobile
description: Guía de diseño responsive mobile-first con buenas prácticas. Usa cuando construyas o revises páginas, componentes o layouts para asegurarte de que funcionen bien en móvil, tablet y escritorio. Cubre breakpoints Tailwind, touch targets, tipografía fluida, navegación móvil y optimización táctil para el POS.
---

# Diseño Responsive Mobile-First — DANI PIZZAS

---

## Principio fundamental: Mobile-First

Diseñar primero para el viewport más pequeño (375px) y agregar complejidad hacia arriba. En Tailwind esto significa escribir la clase base para móvil y usar prefijos para pantallas mayores.

```tsx
// ❌ Desktop-first (mal)
<div className="flex-row md:flex-col sm:flex-col">

// ✅ Mobile-first (bien)
<div className="flex-col sm:flex-row lg:flex-row">
```

---

## Breakpoints del Proyecto

| Prefijo Tailwind | Ancho mínimo | Uso en DANI PIZZAS |
|-----------------|--------------|---------------------|
| (base) | 0px — 639px | Móviles (cajero con teléfono, repartidor) |
| `sm:` | 640px | Teléfonos grandes, landscape |
| `md:` | 768px | Tablets (uso principal del POS) |
| `lg:` | 1024px | Tablets grandes, laptops |
| `xl:` | 1280px | Escritorio (panel admin) |
| `2xl:` | 1536px | Pantallas anchas |

**POS:** Diseñar prioritariamente para `md:` (tablet) — es el dispositivo principal en caja.
**Dashboard/Reportes:** Diseñar para `lg:` como viewport primario.
**Repartidor:** Diseñar para base (375px) — usa el teléfono en movimiento.

---

## Touch Targets — Regla de los 44px

Todo elemento interactivo debe tener mínimo **44×44px** de área táctil (estándar WCAG 2.5.5).

```tsx
// ❌ Botón demasiado pequeño para toque
<button className="h-8 px-2 text-xs">Cobrar</button>

// ✅ Touch-friendly
<button className="h-11 px-4 text-sm">Cobrar</button>

// ✅ Para POS (acción principal) — aún más grande
<button className="h-12 px-6 text-base font-medium">Cobrar S/. 45.00</button>
```

**Reglas de tamaño mínimo en este proyecto:**
- Botones de acción principal en POS: `h-12` (48px)
- Botones secundarios y de lista: `h-10` (40px) — mínimo `h-9` (36px)
- Ítems de lista clicables: `min-h-[44px]` con `py-3`
- Iconos clicables solos: `p-2` para agregar área táctil alrededor

---

## Layout Responsive

### Grid adaptativo

```tsx
// Cards de productos en el POS
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

// Estadísticas del dashboard
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Formulario de 2 columnas
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

### Sidebar + contenido (patrón del proyecto)

```tsx
// Layout principal — sidebar colapsable en móvil
<div className="flex h-screen">
  {/* Sidebar: oculto en móvil, visible en md+ */}
  <aside className="hidden md:flex md:w-64 flex-col">...</aside>

  {/* Contenido: full width en móvil */}
  <main className="flex-1 overflow-auto p-4 md:p-6">...</main>
</div>
```

### POS — split layout

```tsx
// Catálogo izquierda / carrito derecha
<div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] gap-0">
  {/* Catálogo: full en móvil, 60% en desktop */}
  <div className="flex-1 lg:flex-[3] overflow-auto">...</div>

  {/* Carrito: drawer en móvil, panel fijo en desktop */}
  <div className="lg:flex-[2] lg:border-l">...</div>
</div>
```

---

## Tipografía Fluida

```tsx
// Títulos que escalan
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
<h2 className="text-lg sm:text-xl font-semibold">
<p className="text-sm sm:text-base">

// Precio en POS — grande y legible
<span className="text-2xl sm:text-3xl font-bold tabular-nums">S/. 45.90</span>
```

**Tamaño mínimo de texto legible:** `text-sm` (14px) — nunca menos en texto de contenido.
**Texto de acción táctil:** mínimo `text-base` (16px) para evitar zoom en iOS.

---

## Espaciado Responsive

```tsx
// Padding de página
<div className="p-4 sm:p-6 lg:p-8">

// Gap entre cards
<div className="gap-3 sm:gap-4 lg:gap-6">

// Stack vertical en móvil, horizontal en desktop
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
```

---

## Navegación Móvil

### Sidebar con Sheet en móvil

```tsx
// Patrón recomendado para el sidebar del proyecto
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// En móvil: botón hamburguesa + Sheet lateral
// En md+: sidebar fijo visible siempre
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="h-11 w-11">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-64 p-0">
      <NavContent />
    </SheetContent>
  </Sheet>
</div>
```

### Bottom navigation (alternativa para repartidor)

```tsx
// Barra inferior para la vista del repartidor en móvil
<nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t">
  <div className="flex justify-around items-center h-16">
    <NavItem icon={<Package />} label="Entregas" href="/entregas" />
    <NavItem icon={<User />} label="Perfil" href="/perfil" />
  </div>
</nav>
```

---

## Tablas Responsive

Las tablas no escalan bien en móvil. Opciones:

**Opción 1 — Scroll horizontal (tablas de datos)**
```tsx
<div className="overflow-x-auto rounded-lg border">
  <table className="min-w-full">...</table>
</div>
```

**Opción 2 — Card list en móvil, tabla en desktop (listas de órdenes)**
```tsx
{/* En móvil: tarjetas apiladas */}
<div className="md:hidden space-y-3">
  {ordenes.map(o => <OrdenCard key={o.id} orden={o} />)}
</div>

{/* En desktop: tabla */}
<div className="hidden md:block">
  <TablaOrdenes ordenes={ordenes} />
</div>
```

---

## Formularios en Móvil

```tsx
// Inputs full-width siempre — nunca width fijo en formularios móvil
<Input className="w-full" />

// Font-size mínimo 16px en inputs para evitar zoom en iOS
<Input className="text-base sm:text-sm" />

// Botones de submit full-width en móvil
<Button className="w-full sm:w-auto" type="submit">
  Guardar
</Button>

// Stack de botones en móvil, inline en desktop
<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
  <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
  <Button className="w-full sm:w-auto">Guardar</Button>
</div>
```

---

## Imágenes y Media

```tsx
// Imagen responsive con next/image
<Image
  src={producto.imagen_url}
  alt={producto.nombre}
  width={400}
  height={300}
  className="w-full h-auto object-cover rounded-lg"
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
/>
```

---

## Checklist de Revisión Mobile

Antes de marcar un componente como listo, verificar:

**Layout**
- [ ] ¿Se ve bien en 375px de ancho (iPhone SE)?
- [ ] ¿Se ve bien en 768px (iPad)?
- [ ] ¿No hay overflow horizontal no intencional?
- [ ] ¿El texto no queda cortado?

**Touch**
- [ ] ¿Todos los botones tienen al menos `h-10` (idealmente `h-11` o `h-12`)?
- [ ] ¿Los ítems de lista clicables tienen `min-h-[44px]`?
- [ ] ¿Los iconos interactivos solos tienen padding suficiente (`p-2`)?
- [ ] ¿Los inputs tienen `text-base` para evitar zoom en iOS?

**Contenido**
- [ ] ¿La tipografía usa escalas responsive (`text-sm sm:text-base`)?
- [ ] ¿Las tablas tienen scroll horizontal o versión card?
- [ ] ¿Los formularios tienen botones full-width en móvil?

**Navegación**
- [ ] ¿El sidebar está oculto en móvil con un trigger accesible?
- [ ] ¿Los dialogs/sheets se abren correctamente en móvil?

---

## Patrones anti-responsive a evitar

```tsx
// ❌ Ancho fijo que rompe en móvil
<div className="w-[600px]">

// ✅ Máximo ancho con full width en móvil
<div className="w-full max-w-2xl">

// ❌ Texto que no escala
<h1 className="text-4xl font-bold">

// ✅ Título escalable
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

// ❌ Grid rígido que rompe en móvil
<div className="grid grid-cols-4">

// ✅ Grid adaptativo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

// ❌ Flex horizontal sin wrap que rompe
<div className="flex gap-4">
  <LargeComponent />
  <LargeComponent />
</div>

// ✅ Con wrap o breakpoint
<div className="flex flex-col sm:flex-row gap-4">
```

---

## Reglas de comportamiento

- Siempre mencionar en qué breakpoint hay un problema cuando se detecte
- Si el componente es del POS, priorizar diseño tablet (`md:`) sobre desktop
- Si el componente es para el repartidor, priorizar móvil (base)
- Nunca proponer `fixed` positioning sin verificar que funcione en móvil con teclado virtual
- Los ejemplos de código siempre con clases Tailwind, nunca CSS inline
- Respuestas en español
