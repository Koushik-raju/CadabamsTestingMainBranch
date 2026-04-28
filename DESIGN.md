# Cadabams MindTalk — Design System Specification

> **Mobile-first mental health super-app.** Clinical-grade therapy + structured 30/45/90-day journeys + AI companion ("Doctor Rhea") + self-care toolkit. Owns the gap *between* therapy sessions.
>
> **Aesthetic thesis:** professional enough to trust with sensitive data, warm enough to never feel clinically cold. Golden-hour, not corporate-medical.

---

## Table of Contents

1. [Brand Foundations](#1-brand-foundations)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing, Radius, Shadow, Motion](#4-spacing-radius-shadow-motion)
5. [Iconography & Imagery](#5-iconography--imagery)
6. [Component Library](#6-component-library)
7. [Mobile UI Kit — Screens](#7-mobile-ui-kit--screens)
8. [Content & Voice](#8-content--voice)
9. [Sensitive-Design Rules](#9-sensitive-design-rules)

---

## 1. Brand Foundations

### Identity
- **Product:** Cadabams MindTalk — mobile-first mental-health super-app from Cadabams Group + Mindtalk.
- **Audience:** Indian users; patients (sometimes in distress) + clinicians (psychologists, psychiatrists, behavioural therapists).
- **Voice:** warm, plain-language, second person — "a calm friend who happens to be clinically informed".

### Logos (`assets/logos/`)
| File | Use |
|---|---|
| `mindtalk-orange.svg` | Wordmark + mark, brand orange. Use on cream / white backgrounds. |
| `mindtalk-white.svg` | Wordmark + mark, white. Use on dark / orange / photographic surfaces. |
| `mindtalk-icon-white.svg` | Icon-only mark, white. App icon, watermark, small mark. |

### Brand Marks
- **Doctor Rhea** — friendly cute robot mascot. Anchors AI surfaces (Talk to Dr. AI, AI chat, AI summaries).
- **Sparkle** — custom 4-pointed star with cross-glow. Used on the AI tab, AI-generated pill, and Doctor Rhea avatar. NOT a generic icon — a brand element.

---

## 2. Color System

**Three-layer color philosophy:**
1. **Cream canvas** — breathing room, the page background.
2. **Warm orange CTA** — the only loud color. Reserved for primary actions, active states, current-day pills.
3. **Coral → orange gradient** — hero blocks (login Continue, Free Flow journal, home greeting). Always horizontal: coral on the left, orange on the right.

### Brand Orange (primary CTA family)
| Token | Hex |
|---|---|
| `--mt-orange-50`  | `#FFF4EC` |
| `--mt-orange-100` | `#FFE4D2` |
| `--mt-orange-200` | `#FFC9A6` |
| `--mt-orange-300` | `#FFA875` |
| `--mt-orange-400` | `#FF8A47` |
| `--mt-orange-500` | `#F97316` ← **primary CTA** |
| `--mt-orange-600` | `#E8620A` |
| `--mt-orange-700` | `#D8670E` ← logo / deep brand |
| `--mt-orange-800` | `#A8480A` |
| `--mt-orange-900` | `#6E2F08` |

### Coral & Pink Accents (gradient hero, mood)
| Token | Hex |
|---|---|
| `--mt-coral-300` | `#FF9C8A` |
| `--mt-coral-400` | `#F77268` |
| `--mt-pink-200`  | `#FFD9DC` |
| `--mt-pink-300`  | `#FBB7BC` |
| `--mt-pink-400`  | `#F58F9A` |

### Cream / Cool Neutrals
| Token | Hex | Use |
|---|---|---|
| `--mt-cream-bg`   | `#FAF7F4` | Canvas — almost every screen |
| `--mt-cream-soft` | `#FBF5EF` | AI summary tint, secondary surfaces |
| `--mt-cream-card` | `#FFFFFF` | Cards float on cream |
| `--mt-line`       | `#ECE6DE` | Hairline on cream |
| `--mt-line-soft`  | `#F1ECE5` | Softer hairline |
| `--mt-fog`        | `#F4F2EE` | Disabled / locked tile |

### Ink (text & dark surfaces)
| Token | Hex | Use |
|---|---|---|
| `--mt-ink-900` | `#0E1726` | Near-black, primary text |
| `--mt-ink-800` | `#1C2433` | Dark CTA / dark hero card |
| `--mt-ink-700` | `#2D3441` | — |
| `--mt-ink-600` | `#4A5260` | Secondary text |
| `--mt-ink-500` | `#6B7280` | Tertiary / meta |
| `--mt-ink-400` | `#9AA0AB` | Placeholder |
| `--mt-ink-300` | `#C7CCD3` | Dividers on white |
| `--mt-ink-200` | `#E2E5EA` | — |

### Categorical Tints (soft pastels behind line-icon glyphs)
Glyph carries the saturated color; tint is the wash.

| Tint | BG | FG (glyph) | Use |
|---|---|---|---|
| `blue`   | `#E8F1FF` | `#2C7BE5` | Gratitude sun, audio progress |
| `purple` | `#F1EBFF` | `#6C5CE7` | Sleep / evening |
| `green`  | `#E6F4EA` | `#1F8B4C` | Breathe / done |
| `pink`   | `#FFE6EA` | `#D03B5C` | Relationships / self-love |
| `peach`  | `#FFE9D9` | `#C9531A` | Assess / warmth |
| `orange` | `#FFE4D2` | `#E8620A` | Therapy / general brand |

Exposed as `MT_TINTS` in JSX (`primitives.jsx`).

### Mood Dots (home greeting card)
| Token | Hex |
|---|---|
| `--mt-mood-yellow` | `#F7C44A` |
| `--mt-mood-peach`  | `#F7A172` |
| `--mt-mood-pink`   | `#F58F9A` |
| `--mt-mood-green`  | `#6FB58A` |
| `--mt-mood-teal`   | `#1F4D55` |
| `--mt-mood-red`    | `#DC4B45` |

### Semantic
| Token | Hex | BG |
|---|---|---|
| `--mt-success` | `#1F8B4C` | `#E6F4EA` |
| `--mt-warning` | `#C9531A` | `#FFE9D9` |
| `--mt-danger`  | `#DC4B45` | `#FCE4E2` |
| `--mt-info`    | `#2C7BE5` | `#E8F1FF` |

> **Crisis copy never uses red.** The Quick Relief / Emergency Reset surface uses warm orange — calm, not alarmist.

### Gradients
| Token | Value |
|---|---|
| `--mt-gradient-cta`         | `linear-gradient(90deg, #F77268 0%, #F97316 100%)` |
| `--mt-gradient-hero`        | `linear-gradient(120deg, #F77268 0%, #FF9466 45%, #F97316 100%)` |
| `--mt-gradient-greeting`    | `linear-gradient(135deg, #F58F9A 0%, #F77268 50%, #F97316 100%)` |
| `--mt-gradient-orange-soft` | `linear-gradient(180deg, #FFE4D2 0%, #FAF7F4 70%)` |
| `--mt-gradient-coral-pink`  | `linear-gradient(90deg, #F77268 0%, #FBB7BC 100%)` |
| `--mt-gradient-glow`        | `radial-gradient(60% 60% at 50% 50%, rgba(249,115,22,.35) 0%, rgba(249,115,22,0) 70%)` |

### Semantic Aliases
| Alias | Maps to |
|---|---|
| `--bg`              | `--mt-cream-bg` |
| `--bg-elev`         | `--mt-cream-card` |
| `--bg-sunken`       | `--mt-fog` |
| `--fg1`             | `--mt-ink-900` (headlines, primary) |
| `--fg2`             | `--mt-ink-600` (body) |
| `--fg3`             | `--mt-ink-500` (meta) |
| `--fg-muted`        | `--mt-ink-400` |
| `--fg-on-orange`    | `#FFFFFF` |
| `--fg-on-ink`       | `#FFFFFF` |
| `--accent`          | `--mt-orange-500` |
| `--accent-deep`     | `--mt-orange-700` |

---

## 3. Typography

### Family — Inter (3 optical sizes, bundled locally)
| CSS Variable | Family | Use |
|---|---|---|
| `--font-text`    | `Inter Text` (18pt cut)    | Small UI labels, dense rows |
| `--font-sans`    | `Inter` (24pt cut, default) | Body and most UI |
| `--font-display` | `Inter Display` (28pt cut) | Display headlines (≥ 28px) |
| `--font-mono`    | `ui-monospace, 'SF Mono', Menlo, Consolas` | — |

All three families ship weights 100–900 in normal + italic, served from `fonts/` via `@font-face` (no network fetch).

### Type Scale (mobile-first)
| Token | Size | Use |
|---|---|---|
| `--fs-display-1` | 40px | Hero metric / journey title |
| `--fs-display-2` | 32px | Screen titles (Journal, Assessments) |
| `--fs-h1`        | 28px | Primary screen heading |
| `--fs-h2`        | 22px | Card title / hero text |
| `--fs-h3`        | 18px | Section heading |
| `--fs-body`      | 16px | Body |
| `--fs-body-sm`   | 14px | Secondary body |
| `--fs-meta`      | 13px | Meta |
| `--fs-caption`   | 12px | Caption |
| `--fs-overline`  | 11px | UPPERCASE overlines |

### Line Heights
| Token | Value |
|---|---|
| `--lh-tight`   | 1.12 |
| `--lh-snug`    | 1.25 |
| `--lh-base`    | 1.45 |
| `--lh-relaxed` | 1.6  |

### Tracking
| Token | Value |
|---|---|
| `--tracking-tight`    | -0.02em |
| `--tracking-snug`     | -0.01em |
| `--tracking-base`     | 0em |
| `--tracking-wide`     | 0.02em |
| `--tracking-overline` | 0.08em |

### Weights
| Token | Value |
|---|---|
| `--fw-regular` | 400 |
| `--fw-medium`  | 500 |
| `--fw-semi`    | 600 |
| `--fw-bold`    | 700 |
| `--fw-black`   | 800 |

**High weight contrast principle:** body is 400, section headings jump to 700/800. Avoid 500/600 in copy unless it is a button label.

### Semantic Type Classes
| Class | Family / Weight / Size / Tracking |
|---|---|
| `.mt-display-1` | Display / 800 / 40px / -0.02em / 1.12 |
| `.mt-display-2` | Display / 700 / 32px / -0.02em / 1.12 |
| `.mt-h1`        | Sans / 700 / 28px / -0.01em / 1.25 |
| `.mt-h2`        | Sans / 700 / 22px / -0.01em / 1.25 |
| `.mt-h3`        | Sans / 600 / 18px / 1.25 |
| `.mt-body`      | Sans / 400 / 16px / 1.45 / fg2 |
| `.mt-body-sm`   | Sans / 400 / 14px / fg2 |
| `.mt-meta`      | Sans / 400 / 13px / fg3 |
| `.mt-caption`   | Sans / 400 / 12px / fg3 |
| `.mt-overline`  | Sans / 700 / 11px / +0.08em / UPPERCASE / orange-600 |
| `.mt-numeric`   | `font-feature-settings: "tnum" 1, "lnum" 1` |

### Numbers
Tabular and lining figures are enabled (`tnum`, `lnum`) for stats, day counts, percentages. Numbers get **display-size emphasis** — big number, small label below.

---

## 4. Spacing, Radius, Shadow, Motion

### Spacing
| Token | Value |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 20px |
| `--s-6` | 24px |
| `--s-7` | 32px |
| `--s-8` | 40px |
| `--s-9` | 56px |
| `--gutter` | **20px** (mobile screen gutter) |

**Vertical rhythm:** 24px between sections, 12–16px between rows.

### Radii (heavy rounding)
| Token | Value | Use |
|---|---|---|
| `--r-xs`   | 6px  | Tiny chips |
| `--r-sm`   | 10px | Small inputs |
| `--r-md`   | 14px | Inputs, small icon-tile |
| `--r-lg`   | 18px | Standard card |
| `--r-xl`   | 24px | Hero card / large surface |
| `--r-2xl`  | 32px | Greeting hero |
| `--r-3xl`  | 40px | Full-bleed hero |
| `--r-pill` | 999px | Chips, pills, CTAs |

### Shadows (soft, never hard)
| Token | Value | Use |
|---|---|---|
| `--sh-1` | `0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03)` | Ambient, cards on cream |
| `--sh-2` | `0 2px 6px rgba(15,23,42,.05), 0 6px 16px rgba(15,23,42,.04)` | Standard card |
| `--sh-3` | `0 8px 24px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.04)` | Hero / lifted |
| `--sh-glow-orange` | `0 12px 28px rgba(249,115,22,.28)` | Primary CTA fab, active journey-step |
| `--sh-glow-soft`   | `0 8px 24px rgba(247,114,104,.18)` | Coral hero glow |
| `--sh-press`       | `inset 0 1px 2px rgba(15,23,42,.08)` | Press state |

> Never colored shadows except orange glows on primary CTAs.

### Motion
| Token | Value |
|---|---|
| `--ease-out`    | `cubic-bezier(.22,.61,.36,1)` |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` |
| `--dur-fast`    | 140ms (press feedback) |
| `--dur-base`    | 220ms (transitions) |
| `--dur-slow`    | 380ms (hero reveals) |

**No bounce.** Spring-y motion contradicts the calm tone. Crossfades over slides for content swaps. Modal sheets rise from below. Breathing-orb / audio-play pulse loops slowly (4–7s).

---

## 5. Iconography & Imagery

### Icon System
- **Single-weight line icons,** rounded caps and joins, ~1.5–2px stroke at 24×24.
- Visual register closest to **Lucide / Feather** — geometric, friendly, no decorative flourish.
- **Filled variants** only for *active states* (bottom tab bar) and category glyphs inside soft tinted tiles (sun, moon, heart, lightning).
- Lucide is used as a substitution; swap when the production icon set is available (Phosphor / Tabler / Iconoir all match the register).

### Iconography Rules
- Glyphs inside category tiles always sit inside a 14-px-radius tinted square; glyph color is the deeper shade of the tint.
- Brand sparkle is a custom SVG, not a generic icon.
- Mood faces are emoji `😣 😔 😀 😊 😄` — **only in the mood reflection input.** Selected mood sits on an orange filled tile.
- **No emoji elsewhere.** Not in body copy, not as decorative icons.

### Imagery Registers
| Register | Where | Look |
|---|---|---|
| **Photography** (golden-hour, nature) | Guided audio / visualization tiles | Forest, ocean, morning clarity, sleep stories. Always photographic, never illustrated. |
| **Painterly landscapes** | Journey hero covers | Soft brushstrokes, abstract — orange dunes, mountain ridges, sunset hills. |
| **Soft fabric / silk-flow** | Onboarding heroes | Translucent silk wisps in coral/orange. Ethereal, low-pressure. |

**Universal warm cast.** Cool / blue images appear only in audio thumbnails (ocean, water) and only when the topic demands. No B&W, no heavy grain, no high-contrast cinema.

### Recurring Motifs
- **Sprout / plant** — growth metaphor (Journal landing: seedling growing from orange dunes — replaces aggressive streak graphics).
- **Doctor Rhea mascot** — anywhere AI surfaces.

### Imagery Reference Files
- `assets/imagery/silk-flow-hero.png` — onboarding silk-flow texture
- `assets/imagery/painterly-mountains.png` — journey hero painterly landscape
- `assets/imagery/painterly-sprout.png` — sprout / growth illustration
- `assets/imagery/journeys-landing-ref.png` — journey landing reference

---

## 6. Component Library

All components defined in `ui_kits/mobile/primitives.jsx`. JSX, attached to `window`.

### MTOverline
Small uppercase tracked-out label. Default color brand-orange.
```jsx
<MTOverline color="#E8620A">TODAY'S PROMPT</MTOverline>
```
Spec: 11px / 700 / +0.08em / uppercase.

### MTAvatar
Circular avatar with optional white ring + drop shadow.
```jsx
<MTAvatar src={url} size={42} ring />
<MTAvatar initials="SR" size={36} />
```
Fallback: coral→orange diagonal gradient (`#FBB7BC → #F97316`).

### MTSparkle
Brand sparkle SVG (4-pointed star + cross-glow). Used on AI surfaces.
```jsx
<MTSparkle size={16} color="#F97316" />
```

### MTAIPill
The mandatory "AI-generated" disclosure pill. Cream BG, peach border, sparkle + label.
```jsx
<MTAIPill label="AI-generated summary" size="md" />
```
Colors: BG `#FBF5EF` / FG `#C9531A` / border `1px solid #FFE9D9` / radius 999px.

### MTChip
Pill chip. Variants: default white-on-cream, `active`/`dark` (filled near-black), `color={tint}` for category fills.
```jsx
<MTChip>Anxiety</MTChip>
<MTChip active>All</MTChip>
<MTChip color={MT_TINTS.purple}>Sleep</MTChip>
```
Spec: 8px 14px / 13px / 600 / radius 999.

### MTTag
Smaller passive tag (no interaction). Defaults `#F4F2EE / #4A5260`.
```jsx
<MTTag color={MT_TINTS.green}>Done</MTTag>
```
Spec: 4px 10px / 11px / 500 / radius 999.

### MTButton
Primary button component. Variants and sizes:

| variant | Background | Text | Shadow |
|---|---|---|---|
| `primary` | `#F97316` | white | orange glow |
| `gradient` | `linear-gradient(90deg, #F77268, #F97316)` | white | coral glow |
| `secondary` | white | `#0E1726` | `sh-2` |
| `dark` | `#1C2433` | white | none |
| `ghost` | transparent | `#F97316` | none |
| `danger` | white | `#DC4B45` | border `1px solid #FCE4E2` |

| size | Padding / fs |
|---|---|
| `sm` | 10px 16px / 13px |
| `md` | 14px 22px / 15px |
| `lg` | 16px 28px / 16px |

**Press behavior:** `transform: scale(0.97)` on mousedown, snap back on up/leave. No color flash.

### MTCard
Floating white card on cream.
```jsx
<MTCard padding={16} radius={18}>...</MTCard>
```
Default: BG white / radius 18 / `sh-2`.

### MTGlyphTile
Square tinted tile with a centered colored glyph. The category atom.
```jsx
<MTGlyphTile tint="purple" size={44} radius={12}>{svgGlyph}</MTGlyphTile>
```

### MTTopBar
Three-slot header: left (avatar / back), title (center or left), right (action).
```jsx
<MTTopBar left={<MTAvatar.../>} title="Journal" right={<MTRoundIcon>...</MTRoundIcon>} />
```
Min-height 48; padding `8px 20px 12px`.

### MTRoundIcon
Circular icon button. White on cream, soft shadow.
```jsx
<MTRoundIcon size={36}>{svg}</MTRoundIcon>
```

### MTTabBar
Floating bottom tab bar — 5 tabs with raised orange AI fab in the center.

Default tabs: `Home · Explore · AI · Appts · Profile`.

Spec:
- Container: floating white pill `position: absolute; bottom: 14px; left: 12px; right: 12px; border-radius: 28px; padding: 12px 14px; sh-3`.
- Active tab: orange icon stroke + filled `#FFE4D2` icon body + orange label.
- Inactive: `#6B7280` stroke + label.
- AI fab: 56×56 orange disc, sparkle glyph white, lifted by `margin-top: -22px`, orange glow shadow.

### MTScreen
Mobile screen wrapper — full bleed, cream BG, scrollable, `paddingTop: 54` for the iOS notch area, `position: relative` so the tab bar can absolute-position into it.

---

## 7. Mobile UI Kit — Screens

UI kit lives in `ui_kits/mobile/`. Run via `Mobile UI Kit.html`. Each frame renders inside the iOS bezel from `ios-frame.jsx`.

### Screen Inventory

| File | Screen | Purpose |
|---|---|---|
| `HomeScreen.jsx`             | Home (canonical)              | Greeting, mood dots, AI ask bar, quick actions, journey card, recommendations |
| `HomeVariations.jsx` → `HomeV11Screen` | Home · V11             | Pink-hero variant with white quick-action card row |
| `HomeVariations.jsx` → `HomeDailyGrowthScreen` | Home · Daily Growth | Hero + week strip + chronological activity timeline |
| `JournalScreen.jsx`          | Journal                       | Free Flow + guided reflection, sprout motif |
| `JournalScreens.jsx`         | Journal expansion             | Prompt set, entry detail, share-to-clinician flow |
| `JourneyScreen.jsx`          | Journey                       | Vertical zig-zag step path |
| `JourneyExpansionScreens.jsx`| Journey expansion             | Step detail, level intro |
| `TherapistsScreen.jsx`       | Therapists                    | Match CTA, filter chips, therapist cards |
| `BookingScreens.jsx`         | Booking flow                  | Slot pick, confirmation, session details |
| `AssessmentReportScreen.jsx` | Assessment Report             | AI summary + non-diagnosis disclaimer + CTA |
| `AssessmentsExpansionScreens.jsx` | Assessment intro / questions | PHQ-9, GAD-7, etc. |
| `OnboardingScreens.jsx`      | Phone Login / Country / Option Select | Onboarding entry, silk hero |
| `ExploreScreens.jsx`         | Explore / Audio / Reflection / Breathing | Daily pick, soundscape, 4-7-8 breath orb |

### Information Architecture (cheat sheet)
- **Five-tab bottom nav:** `Home · Explore · AI · Appts · Profile`. AI is a raised orange fab.
- **Top bar pattern:** profile avatar (left) · screen title · contextual action (right — search / share / settings).
- **Tools toggle:** clinician-prescribed vs. self-selected items always show two tabs `Explore` and `Assigned`.

### Repeating UI Patterns
- Hero card — full-bleed gradient or photo, white text bottom-aligned.
- Mood color dots row — 5–6 emotional colors, selected on filled orange tile.
- AI-generated pill with sparkle.
- Photo content tiles ~1.4:1 with title overlay at the bottom.
- Therapist trust card — circular photo, name, credentials, specialty chips, ★ rating, fee, Book Now.
- Daily Growth timeline — horizontal Mon–Sun strip + chronological activity feed.
- Therapist matching CTA — "Not sure who to choose?" → "Match me".
- Quick Relief surface — always reachable from home + Explore.

### Layout Rules
- Mobile gutter: **20px** L/R.
- Screen body cream `#FAF7F4`; cards float with shadow.
- Floating tab bar 14px from bottom, 12px L/R; 28px radius.
- Numbers anchor visual hierarchy (large, ink-900, label small below in ink-500).

---

## 8. Content & Voice

### Tone & Casing
- **Sentence case** for all UI — headlines, CTAs (`Start your journey`, `Book Now`). Never Title Case Like This.
- **Overlines** are short, ALL-CAPS, tracked-out: `TODAY'S PROMPT`, `MINDFUL SPACE`, `DAILY PROMPT`. Use sparingly.

### Pronouns
- **Second person** by default — "How are you feeling today?", "Your safe space for thoughts and feelings".
- **First-person possessive** *only* on user-owned objects — "Your Journey", "Your Thoughts", "Your Routine".
- Greetings name the user — `Good Morning, Sarah`.

### Concrete Over Poetic
✅ `Day 9 of 90 · Anxiety Relief`
❌ `Your wellness journey awaits`

✅ `What are three small things that made you smile today?`
❌ `Pause and reflect on your inner light`

### Vocabulary
Mental-health terminology is used **accurately**: `Generalized Anxiety Disorder`, `M.Phil`, `PhD`, `CBT`, `PHQ-9`, `GAD-7`. Always pair with plain-language explanation. Never softened into vagueness.

### Reference Strings (copy-paste from)
- `Your safe space for thoughts and feelings.`
- `Free Flow — Write whatever is on your mind. No prompts, just you.`
- `Not sure who to choose? Answer a few quick questions and we'll match you with the right specialist.`
- `Mood check-in completed`
- `Your activity assessment results — Overall balance: Moderate (72%)`
- `Curated by Dr. Ananya, Clinical Psychologist`

---

## 9. Sensitive-Design Rules

**Non-negotiable.**

1. **Quick Relief / Emergency Reset is always reachable.** Surface it in the home grid AND the Explore "Quick Relief" rail. Calm copy, never alarmist, never red.
2. **Soft-land all gamification.** Streaks, XP, gems, stars: a miss is "freeze" or "revive" — never "You broke your streak." Zero-state is "Complete your first ___ today to start."
3. **Privacy is first-class.** Assessment Intro card explicitly states `Private & Confidential — Your results are only visible to you.` Journal sharing is **opt-in per entry** via a separate "Share Journal — select entries to share with Dr. Reddy" action — never default.
4. **AI disclosure is mandatory.** Every AI-generated surface shows the `MTAIPill` + non-diagnosis copy:
   > *"This summary is generated by AI based on your answers. It is **not a diagnosis** and should be used as a reflection aid, not as medical advice."*
5. **Crisis-grade contrast.** Body text on cream is `#0E1726` (16.8:1 ratio) — not the trendy gray-on-cream that fails WCAG.
6. **No shame.** A skipped session offers reschedule first, cancel second. Crisis-relevant copy uses warm orange, not red.
7. **Emoji disciplined.** Mood inputs only (5 faces). Nowhere else — not in body copy, not as icons.

---

## Appendix — File Index

| Path | Purpose |
|---|---|
| `colors_and_type.css`         | All design tokens (color, type, spacing, radii, shadow, motion) |
| `README.md`                   | Brand voice + visual foundations + iconography |
| `SKILL.md`                    | Cross-compatible skill descriptor for Claude Code |
| `assets/logos/`               | Brand marks (orange, white, white-icon) |
| `assets/imagery/`             | Photography & painterly references |
| `fonts/`                      | Inter (3 optical sizes × 9 weights × 2 styles) |
| `ui_kits/mobile/primitives.jsx` | Shared component library |
| `ui_kits/mobile/ios-frame.jsx`  | iOS bezel wrapper |
| `ui_kits/mobile/Mobile UI Kit.html` | Live kit canvas |

### Caveats
- Built from screenshot reference, no Figma / production codebase. Pixel fidelity ≈ ±2px.
- Icons are **substituted with Lucide** — confirm or replace with production set.
- Motion durations / easings are sensible defaults inferred from static frames.