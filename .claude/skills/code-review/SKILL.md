---
name: code-review
description: Hace una revisión de código en 4 fases (Contexto → Alto nivel → Línea por línea → Resumen). Usa cuando el usuario pida revisar un archivo, componente, server action, servicio o cualquier pieza de código. Clasifica hallazgos por severidad: bloqueante, importante, sugerencia, nit.
---

# Code Review — DANI PIZZAS

Realiza la revisión en 4 fases. No omitas ninguna. Usa las severidades definidas abajo.

---

## Severidades

| Nivel | Icono | Criterio |
|-------|-------|----------|
| **Bloqueante** | 🔴 | Bug real, vulnerabilidad de seguridad, pérdida de datos, crash probable |
| **Importante** | 🟠 | Problema de rendimiento significativo, lógica incorrecta, falta de validación en boundary |
| **Sugerencia** | 🟡 | Mejor práctica no seguida, código difícil de mantener |
| **Nit** | ⚪ | Estilo, naming menor, comentario innecesario |

---

## Fase 1 — Contexto

Antes de revisar, responde:
- ¿Qué hace este código? (1-2 líneas)
- ¿Es Server Component, Client Component, Server Action, servicio o utilidad?
- ¿Toca datos sensibles? (auth, dinero, RLS)

---

## Fase 2 — Alto nivel

Evalúa la estructura general:

**Separación de responsabilidades**
- ¿El componente mezcla lógica de negocio con UI?
- ¿Los servicios en `lib/services/` hacen solo queries, sin lógica de presentación?
- ¿Las Server Actions validan con Zod antes de tocar la DB?

**Seguridad (prioridad máxima)**
- ¿Hay `.single()` sin guard en queries que pueden retornar 0 filas? → usar `.maybeSingle()`
- ¿Se filtran queries por `sucursal_id` donde corresponde?
- ¿Los Server Actions verifican rol y sesión antes de operar?
- ¿Algún dato del usuario llega sin sanitizar a una query?

**Manejo de errores**
- ¿Los errores de Supabase se capturan y retornan como `{ error }` en vez de lanzar al cliente?
- ¿Los try/catch silencian errores críticos?

**Tipos TypeScript**
- ¿Se usa `any` o `unknown` sin narrowing?
- ¿Los tipos de retorno de funciones están declarados explícitamente?

---

## Fase 3 — Línea por línea

Revisa el código completo. Para cada hallazgo usa este formato:

```
[SEVERIDAD] Línea X — descripción del problema
→ Cómo arreglarlo (código si aplica)
```

Checklist específica para este stack:

**Next.js / React**
- [ ] `"use client"` solo cuando hay hooks, eventos o APIs del browser
- [ ] No hay `useEffect` para fetch inicial (debe ser Server Component)
- [ ] `revalidatePath` llamado después de mutations
- [ ] `Promise.all` para fetches paralelos en Server Components
- [ ] No hay `any` en props de componentes

**Supabase**
- [ ] `.single()` solo cuando se garantiza exactamente 1 fila (PK lookup); `.maybeSingle()` en el resto
- [ ] `.select("*")` evitado en favor de columnas específicas en rutas críticas
- [ ] Queries dentro de loops → consolidar en una sola query con `.in()`
- [ ] Manejo del `error` de Supabase antes de usar `data`

**Server Actions**
- [ ] Validación con `zod.safeParse()` al inicio
- [ ] Verificación de `auth.getUser()` antes de cualquier operación
- [ ] Verificación de rol (`rolNombre`) antes de operaciones privilegiadas
- [ ] Retorna `ActionResult<T>` con `{ data, error }` tipado, no lanza excepciones al cliente

**Formularios (react-hook-form + zod)**
- [ ] Schema de validación definido con zod
- [ ] `resolver: zodResolver(schema)` en `useForm`
- [ ] Mensajes de error en español

**Tailwind / shadcn**
- [ ] No hay estilos inline (`style={{}}`) salvo casos justificados
- [ ] Variantes de shadcn usadas correctamente, no clases CSS custom cuando existe variante

---

## Fase 4 — Resumen

Genera una tabla resumen:

| Severidad | Cantidad | Items principales |
|-----------|----------|-------------------|
| 🔴 Bloqueante | N | ... |
| 🟠 Importante | N | ... |
| 🟡 Sugerencia | N | ... |
| ⚪ Nit | N | ... |

**Veredicto:** `Aprobado` / `Aprobado con observaciones` / `Requiere cambios`

Si hay bloqueantes → siempre `Requiere cambios`.

---

## Reglas de comportamiento

- Siempre completar las 4 fases, incluso si el código parece limpio
- Si no hay hallazgos en una severidad, escribir "Ninguno"
- No inventar problemas para parecer más completo
- Citar líneas específicas, no frases vagas como "el código podría mejorarse"
- Todos los comentarios en español
