# Design Guidelines — Cadabams Consult Frontend

## Style Name: Compact Card UI

This app uses a **Compact Card UI** style — a mobile-first design language common in modern health and wellness apps (similar to Material You / iOS Health). The core idea is:

> **Grouped list cards + gradient accent tiles replace individual item cards and images.**

Content without images gets visual identity through **colored gradient icon tiles** derived from its type or category. Layouts are tight, scannable, and thumb-friendly.

---

## 1. Page Layout

Every page follows this exact structure:

```
min-h-screen bg-background pb-24
  └── Header (BackButton + title + optional action)
  └── Content (px-4, sections with mb-5/mb-6)
        └── Section heading
        └── Card (grouped list) or grid
```

### Header pattern

**Use this on every inner page — no gradient banners.**

```tsx
<div className="flex items-center gap-2 px-4 pt-5 pb-3">
  <BackButton fallback="/home" />
  <h1 className="flex-1 text-lg font-bold text-foreground">Page Title</h1>
  {/* Optional: one action button */}
  <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
    <SomeIcon className="w-3.5 h-3.5" />
    Action
  </Button>
</div>
```

- Always use `<BackButton>` from `components/shared/navigation/back-button.tsx` — never a raw `ArrowLeft` + Button.
- Keep the header flat (white/background). The home page is the only page with a gradient header (`HomeHeader` component).
- One optional right-side action max. Use `variant="outline"` with `rounded-xl`.

### Bottom padding

Always add `pb-24` to the page root so content is not hidden behind the bottom tab bar.

---

## 2. Section Layout

Each content section inside a page:

```tsx
<section className="mb-5">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-base font-bold text-foreground">Section Title</h2>
    <span className="text-xs text-muted-foreground">subtitle / count</span>
  </div>
  {/* content */}
</section>
```

---

## 3. Grouped List Cards

**Do not render one `<Card>` per list item.** Group items into a single card with `<Separator>` between rows. This is the most important layout rule.

```tsx
<Card>
  <CardContent className="py-0 px-3">
    {items.map((item, i) => (
      <div key={item.id}>
        <ItemRow item={item} />
        {i < items.length - 1 && <Separator />}
      </div>
    ))}
  </CardContent>
</Card>
```

Each row inside the card:
- `py-3` vertical padding
- `flex items-start gap-3` layout
- Left: **gradient icon tile** (see §4)
- Middle: name + subtitle/meta (`flex-1 min-w-0`)
- Right: time / chevron / action buttons (`flex-shrink-0`)

---

## 4. Gradient Icon Tiles (replacing images)

When a list item has no image, give it a **colored gradient tile** based on its semantic type. This is the signature visual element of this design system.

### Anatomy

```tsx
<div className={cn(
  'relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0',
  'flex items-center justify-center overflow-hidden shadow-sm',
  gradient   // e.g. 'from-violet-500 to-purple-600'
)}>
  {/* Decorative circle — always include */}
  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
  <SomeIcon className="w-5 h-5 text-white" />
</div>
```

- Size: `w-11 h-11` for list rows, `w-12 h-12` for slightly larger rows
- Shape: `rounded-2xl` (not fully round)
- Always include the decorative `bg-white/10` circle — it adds depth
- Icon: `w-5 h-5 text-white`
- Optional small label (e.g. file extension): `text-[8px] font-bold text-white/80`

### Standard color palette

| Category | Gradient classes |
|---|---|
| Journey / Progress | `from-violet-500 to-purple-600` |
| Appointment / Session | `from-emerald-500 to-teal-600` |
| Doctor / Consultation | `from-sky-500 to-blue-600` |
| Alert / Announcement | `from-orange-400 to-amber-500` |
| PDF document | `from-red-500 to-rose-600` |
| Image file | `from-sky-500 to-blue-600` |
| Word / Doc file | `from-indigo-500 to-violet-600` |
| Text / CSV / Code | `from-slate-400 to-slate-600` |
| Generic / Default | `from-teal-500 to-emerald-600` |
| Active / In Progress | `from-emerald-500 to-teal-600` |
| Pending / Booked | `from-orange-500 to-amber-500` |
| Completed / Done | `from-slate-400 to-slate-500` |

Derive the gradient from a **config object or function**, not inline conditionals:

```ts
function getConfig(type: string): { gradient: string; Icon: React.ElementType } {
  if (type === 'journey') return { gradient: 'from-violet-500 to-purple-600', Icon: Route };
  if (type === 'appointment') return { gradient: 'from-emerald-500 to-teal-600', Icon: CalendarCheck };
  return { gradient: 'from-teal-500 to-emerald-600', Icon: Bell };
}
```

---

## 5. Featured / Hero Cards

For a single featured item (e.g. a featured package, a highlighted journey), use a full-width gradient card with decorative layered circles:

```tsx
<Card className="relative w-full overflow-hidden cursor-pointer active:scale-[0.98] transition-all border-0 shadow-lg">
  {/* Gradient background */}
  <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
  {/* Decorative circles */}
  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
  <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
  {/* Content — pinned to bottom */}
  <div className="absolute bottom-0 left-0 right-0 p-5">
    {/* badges, title, subtitle, CTA button */}
  </div>
</Card>
```

Minimum height: `style={{ minHeight: 220 }}` or `h-[220px]`.

---

## 6. Horizontal Scroll Cards

For "My X" sections with 2–5 items, use a fixed-width horizontal scroll strip:

```tsx
<div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
  {items.map((item) => (
    <Card key={item.id} className="flex-shrink-0 w-56 ...">
      {/* gradient header + white footer */}
    </Card>
  ))}
</div>
```

Card structure: gradient header (initials/icon + status badge) + white footer (price/meta + arrow).

---

## 7. Empty States

```tsx
<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
    <SomeIcon className="w-8 h-8 text-muted-foreground" />
  </div>
  <div>
    <p className="font-semibold text-foreground">Short headline</p>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Supporting sentence.
    </p>
  </div>
  {/* Optional CTA */}
  <Button variant="outline">Take action</Button>
</div>
```

---

## 8. Loading Skeletons

Match the shape of the real content exactly so there is no layout shift.

- List row: `w-11 h-11 rounded-2xl` (matches the gradient tile) + two text lines
- Full card: `h-[220px] rounded-2xl` for hero cards
- Slim row: `h-16 w-full rounded-xl`

```tsx
{Array.from({ length: 5 }).map((_, i) => (
  <div key={i} className="flex items-center gap-3 py-3">
    <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-2/3 rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
    </div>
    <Skeleton className="w-8 h-3 rounded" />
  </div>
))}
```

---

## 9. Touch Interactions

- Tappable cards: `active:scale-[0.97] transition-transform` (cards) or `active:scale-[0.98]` (hero)
- Tappable rows: `transition-colors hover:bg-muted/50 active:bg-muted`
- Never use `cursor-pointer` alone — always pair with an `active:` scale or bg class

---

## 10. shadcn/ui Component Rules

**Always reach for shadcn primitives first.** Do not write custom HTML when a shadcn component covers the use case.

| Need | Use |
|---|---|
| List container | `<Card><CardContent className="py-0 px-3">` |
| Row divider | `<Separator />` |
| Status label | `<Badge variant="secondary">` or custom gradient badge |
| Text input / search | `<Input className="rounded-xl">` |
| Destructive confirm | `<AlertDialog>` |
| Loading placeholder | `<Skeleton>` |
| Error banner | `<Alert variant="destructive">` |
| Bottom sheet / filters | `<Sheet>` |
| Tabs | `<Tabs>` |

**Adding missing primitives**: run `/shadcn` skill — do not use `npx` directly or MCP.

---

## 11. Color Tokens

**Never use raw hex, rgb, or hsl values.** Use only theme tokens:

| Token | Use |
|---|---|
| `bg-background` | Page background |
| `bg-card` | Card surface |
| `bg-muted` | Subtle surface, icon containers in empty states |
| `text-foreground` | Primary text, headings |
| `text-muted-foreground` | Secondary text, meta |
| `bg-primary` / `text-primary` | Brand color, accents, unread dots |
| `border` | Default border |
| `bg-destructive` / `text-destructive` | Errors, delete actions |

Gradient classes (`from-violet-500 to-purple-600` etc.) are the **only** exception to the token rule — they are used exclusively for icon tiles and hero cards, not for text or backgrounds.

---

## 12. Typography Scale

| Use | Class |
|---|---|
| Page title (header) | `text-lg font-bold text-foreground` |
| Section heading | `text-base font-bold text-foreground` |
| Card / item title | `text-sm font-medium text-foreground` |
| Body / description | `text-sm text-muted-foreground` |
| Meta / timestamp | `text-xs text-muted-foreground` |
| Tiny label (badge, ext) | `text-[10px]` or `text-[8px]` |

---

## 13. Spacing Conventions

| Context | Class |
|---|---|
| Page horizontal padding | `px-4` |
| Page top padding | `pt-5` (header) |
| Between sections | `mb-5` or `mb-6` |
| Section title → content | `mb-3` |
| List row vertical padding | `py-3` |
| Gap between icon + text | `gap-3` |
| Bottom nav clearance | `pb-24` |

---

## 14. What NOT to Do

- Do not use `home-header-gradient` on inner pages — that class is only for the home screen `HomeHeader` component.
- Do not render one `<Card>` per list item in a list — always group with `<Separator>`.
- Do not use `<ArrowLeft>` + raw `Button` for back navigation — always use `<BackButton>`.
- Do not hardcode colors — no `#hex`, `rgb()`, or `hsl()` values in className.
- Do not add `pt-12` or `pt-safe-top` to inner page headers — use `pt-5`.
- Do not skip the decorative `bg-white/10` circle on gradient tiles — it is part of the visual language.
