# Design Guidelines — Cadabams Consult Frontend

## Style Name: Compact Card UI — Neo

This app uses a **Compact Card UI** style — a mobile-first design language for health and wellness apps. The visual language is **neo**: warm cream surfaces, heavy rounding, layered soft shadows, glassmorphic overlays on the header, and a coral-orange brand that glows on interactive elements.

> **Grouped list cards + gradient accent tiles + soft depth layers replace individual item cards and images.**

Content without images gets visual identity through **colored gradient icon tiles**. Layouts are tight, scannable, and thumb-friendly. Depth is created through shadow stacking, not borders.

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

## 11. Color System

**Never use raw hex, rgb, or hsl values in JSX className.** Use theme tokens or the `--mt-*` custom properties. Gradient tile classes are the only exception.

### Surface stack (light, bottom → top)

| Token / var | Hex | Use |
|---|---|---|
| `bg-background` / `--mt-cream-bg` | `#faf7f4` | Page canvas — every screen |
| `--mt-cream-soft` | `#fbf5ef` | Secondary surfaces, AI tint areas |
| `bg-muted` / `--mt-fog` | `#f4f2ee` | Disabled/locked tiles, sunken wells |
| `bg-card` / `--mt-cream-card` | `#ffffff` | Cards, modals, elevated sheets |

Always layer in this order — never skip a level (e.g. don't put a card-colored element directly on cream without a shadow).

### Text scale

| Token / var | Hex | Use |
|---|---|---|
| `text-foreground` / `--mt-ink-900` | `#0e1726` | Headings, primary labels |
| `--mt-ink-800` | `#1c2433` | Dark CTA text, hero card text |
| `--mt-ink-600` | `#4a5260` | Secondary body text |
| `text-muted-foreground` / `--mt-ink-500` | `#6b7280` | Meta, timestamps |
| `--mt-ink-400` | `#9aa0ab` | Placeholder text |
| `--mt-ink-300` | `#c7ccd3` | Dividers on white |

### Brand orange scale

| Token | Hex | Use |
|---|---|---|
| `--mt-orange-50` | `#fff4ec` | Hover wash on white |
| `--mt-orange-100` / `bg-accent` | `#ffe4d2` | Soft accent badges |
| `--mt-orange-200` | `#ffc9a6` | — |
| `--mt-orange-300` | `#ffa875` | — |
| `--mt-orange-400` | `#ff8a47` | — |
| `--mt-orange-500` / `bg-primary` | `#f97316` | **Primary CTA** |
| `--mt-orange-600` | `#e8620a` | Pressed / active state |
| `--mt-orange-700` / `text-accent-foreground` | `#d8670e` | Logo, deep brand |
| `--mt-orange-800` | `#a8480a` | — |
| `--mt-orange-900` | `#6e2f08` | On-dark text |

### Coral / pink accent

| Token | Hex | Use |
|---|---|---|
| `--mt-pink-300` | `#fbb7bc` | Avatar fallback gradient start |
| `--mt-pink-400` | `#f58f9a` | Gradient greeting start |
| `--mt-coral-300` | `#ff9c8a` | Soft gradient midpoint |
| `--mt-coral-400` | `#f77268` | Gradient greeting mid, CTA gradient start |

### Borders and hairlines

| Token / var | Hex | Use |
|---|---|---|
| `border` / `--mt-line` | `#ece6de` | Default card border, input border |
| `--mt-line-soft` | `#f1ece5` | Softer row separator on cream |
| `--mt-ink-300` | `#c7ccd3` | Divider on a white card surface |

Always use `border border-[--mt-line]` (or `border-border`) on cards. Never `border-gray-*`.

### Semantic status colors

| Token | Hex | Use |
|---|---|---|
| `--mt-success` / `--mt-success-bg` | `#1f8b4c` / `#e6f4ea` | Success badges |
| `--mt-warning` / `--mt-warning-bg` | `#c9531a` / `#ffe9d9` | Warnings |
| `--mt-danger` / `--mt-danger-bg` | `#dc4b45` / `#fce4e2` | Destructive |
| `--mt-info` / `--mt-info-bg` | `#2c7be5` / `#e8f1ff` | Info banners |

### Gradients

Never inline gradient values — always use the CSS variable:

| Variable | Value | Use |
|---|---|---|
| `var(--mt-gradient-greeting)` | `135deg, #f58f9a → #f77268 → #f97316` | Home header banner only |
| `var(--mt-gradient-hero)` | `120deg, #f77268 → #ff9466 → #f97316` | Featured / hero cards |
| `var(--mt-gradient-cta)` | `90deg, #f77268 → #f97316` | CTA buttons |
| `var(--mt-gradient-orange-soft)` | `180deg, #ffe4d2 → #faf7f4` | Soft section backgrounds |
| `var(--mt-gradient-coral-pink)` | `90deg, #f77268 → #fbb7bc` | Decorative accents |

Gradient tile classes (`from-violet-500 to-purple-600` etc.) are the **only** Tailwind color classes that may bypass the token rule — used exclusively for icon tiles and hero cards.

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

## 13. Shadow System

**Shadows create depth — never hard drop shadows, never outlines for elevation.** All shadows use a cool-navy base tint (`rgba(15,23,42,…)`) except brand glows which use orange.

### Elevation scale

| Token | CSS value | When to use |
|---|---|---|
| `--sh-1` | `0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03)` | Row items, inline badges, chips |
| `--sh-2` | `0 2px 6px rgba(15,23,42,.05), 0 6px 16px rgba(15,23,42,.04)` | Cards, input fields, grouped lists |
| `--sh-3` | `0 8px 24px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.04)` | Modals, bottom sheets, floating bars |
| `--sh-glow-orange` | `0 12px 28px rgba(249,115,22,.28)` | Primary CTA buttons, active mood circle |
| `--sh-glow-soft` | `0 8px 24px rgba(247,114,104,.18)` | Hero cards, header AI bar |
| `--sh-press` | `inset 0 1px 2px rgba(15,23,42,.08)` | Pressed/active state inset |

### Usage in Tailwind

Use `shadow-[var(--sh-N)]` syntax since these are not Tailwind default shadows:

```tsx
// Card — level 2
<Card className="shadow-[var(--sh-2)] border border-border">

// Floating AI bar — level 3 with soft glow
<div className="shadow-[var(--sh-glow-soft)] border border-[--mt-line]">

// Orange CTA button — brand glow
<button className="shadow-[var(--sh-glow-orange)] bg-primary text-white">

// Inset press feedback
<button className="active:shadow-[var(--sh-press)]">
```

### Rules

- **Cards on cream** → always `--sh-2`. Never borderless + shadowless — the separation must be visible.
- **Cards on white** (e.g. inside a modal) → `--sh-1` or just `border-border` — don't stack heavy shadows in an already-elevated context.
- **Floating elements** (AI bar, FAB, bottom sheet handle) → `--sh-3`.
- **Brand CTA** → `--sh-glow-orange`. Regular secondary buttons → `--sh-1` only.
- **Never** use Tailwind `shadow-md`, `shadow-lg`, etc. — they use the wrong tint and don't match the design system.

---

## 13a. Border Radius (Edge) System

The design language uses **heavy, consistent rounding**. Every element should map to the scale below — never freestyle `rounded-[17px]` values.

### Radius scale

| Token | px | Tailwind equivalent | Use |
|---|---|---|---|
| `--r-xs` | 6px | `rounded` | Tiny chips, micro badges |
| `--r-sm` | 10px | `rounded-lg` | Input fields, small buttons |
| `--r-md` | 14px | `rounded-xl` | Standard buttons, tags, inputs |
| `--r-lg` | 18px | `rounded-2xl` | Icon tiles (gradient tiles), row avatars |
| `--r-xl` | 24px | `rounded-3xl` | Cards, list containers |
| `--r-2xl` | 32px | `rounded-[32px]` | Hero cards, home header bottom edge |
| `--r-3xl` | 40px | `rounded-[40px]` | Full-screen modals, large sheets |
| `--r-pill` | 999px | `rounded-full` | Pill badges, mood selector, avatar circles, FABs |

### Canonical shapes per component type

| Component | Radius |
|---|---|
| Gradient icon tile | `rounded-2xl` (`--r-lg`) |
| List / grouped card | `rounded-3xl` (`--r-xl`) |
| Input field | `rounded-xl` (`--r-md`) |
| Standard button | `rounded-xl` (`--r-md`) |
| CTA / primary button | `rounded-full` (`--r-pill`) |
| Status badge / chip | `rounded-full` (`--r-pill`) |
| Hero / featured card | `rounded-[32px]` (`--r-2xl`) |
| Home header bottom | `rounded-b-[32px]` (`--r-2xl`) |
| Bottom sheet top | `rounded-t-[32px]` (`--r-2xl`) |
| Avatar circle | `rounded-full` |
| Notification dot | `rounded-full` |
| Modal / sheet | `rounded-[40px]` top only |

### Rules

- **Consistency over convenience** — if a new component doesn't map cleanly, pick the nearest step down.
- **Never mix rounding within a single component** — if the outer container is `rounded-3xl`, inner tiles must be smaller (`rounded-2xl`), not equal or larger.
- **Bottom edge rounding** — use `rounded-b-[32px]` for the home header. Use `rounded-t-[32px]` for bottom sheets and drawers. Never `rounded-t-lg` on a bottom sheet.

---

## 13b. Glassmorphism (Header Overlays)

The home header is the only surface that uses frosted-glass overlays. These values are specific — do not approximate.

### Glass layer recipe

```tsx
// Frosted pill (mood selector, overlay controls on gradient)
className="bg-white/15 backdrop-blur-md border border-white/10"

// Slightly stronger glass (notification/bell button)
className="bg-white/15 hover:bg-white/25"

// Avatar border on gradient
className="border-2 border-white/40"

// Subtle tint on gradient (decorative circles)
className="bg-white/10"   // top decorative
className="bg-white/5"    // bottom decorative
```

### Rules

- `backdrop-blur-md` only — `backdrop-blur-sm` is too weak, `backdrop-blur-lg` too heavy for mobile.
- White opacity layers: `bg-white/5` → `bg-white/10` → `bg-white/15` → `bg-white/25`. Never exceed `/25` or the frost reads as opaque.
- Glass elements only appear over gradient surfaces. Never on cream or card surfaces — use a border + shadow instead.
- Do **not** add `backdrop-blur` to cards that sit on the main page — only on elements that float over the gradient header.

---

## 14a. Motion & Interaction

| Duration var | Value | Use |
|---|---|---|
| `--dur-fast` | 140ms | Press feedback (scale, bg flash) |
| `--dur-base` | 220ms | State transitions (color, opacity) |
| `--dur-slow` | 380ms | Hero reveals, sheet slides |

| Easing var | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Entrances, tap releases |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Crossfades, toggles |

**Standard press feedback pattern** (all tappable elements):

```tsx
// Cards
className="active:scale-[0.97] transition-transform duration-[140ms]"

// Hero cards
className="active:scale-[0.98] transition-all"

// Rows
className="transition-colors hover:bg-muted/50 active:bg-muted"

// Icon buttons (bell, avatar)
className="transition-transform duration-[140ms] active:scale-95"
```

Never use `cursor-pointer` alone — always pair with a `transition-*` + `active:` class.

---

## 15. Spacing Conventions

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

## 16. What NOT to Do

**Colors**
- Do not hardcode hex, rgb, or hsl in `className` — use tokens or CSS vars.
- Do not use Tailwind gray/slate/zinc color scales for text or surfaces — use `--mt-ink-*` tokens.
- Do not use `border-gray-*` — always `border-border` or `border-[--mt-line]`.

**Shadows**
- Do not use Tailwind's built-in `shadow-sm`, `shadow-md`, `shadow-lg` — they use the wrong tint. Use `shadow-[var(--sh-N)]`.
- Do not add `--sh-glow-orange` to non-CTA elements — brand glow is reserved for primary actions and active states.
- Do not apply `backdrop-blur` to cards on cream — only to overlays on the gradient header.

**Edges / radius**
- Do not use freestyle border radius values (`rounded-[17px]`) — always pick from the `--r-*` scale.
- Do not use `rounded-md` (Tailwind default 6px) for cards — minimum card radius is `rounded-3xl`.
- Do not mix equal rounding between an outer container and its children — children must always be one step smaller.

**Layout**
- Do not use `home-header-gradient` on inner pages — home `HomeHeader` only.
- Do not render one `<Card>` per list item — group with `<Separator>`.
- Do not use `<ArrowLeft>` + raw `Button` for back navigation — use `<BackButton>`.
- Do not add `pt-12` or `pt-safe-top` to inner page headers — use `pt-5`.
- Do not skip the decorative `bg-white/10` circle on gradient icon tiles.
