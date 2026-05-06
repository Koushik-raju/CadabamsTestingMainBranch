@AGENTS.md

---

# ⛔ NON-BREAKABLE RULE — NEVER USE INLINE JSX COMMENTS BEFORE THE ROOT ELEMENT

**This rule is mandatory. Violating it corrupts the file.**

A JSX comment placed before the opening tag inside `return()` is invalid and causes Biome to garble the entire file — breaking template literals, attribute selectors, and surrounding expressions.

### Wrong — comment before the root element
```tsx
return (
  {/* this is invalid JSX */}
  <div className="...">
```

### Correct — comment above the return, or inside a fragment
```tsx
// plain JS comment above the return
return (
  <div className="...">
```
```tsx
return (
  <>
    {/* comment inside a fragment is valid */}
    <div className="...">
  </>
);
```

### When this matters
- Any time you add an explanatory comment to a function that returns a single root element.
- Always use a `//` comment above `return()`, never `{/* */}` as the first thing inside it.

### Why
Biome's formatter treats `{/* ... */}` before the root JSX element as a syntax error and rewrites surrounding code destructively. This happened in `journey-path-view.tsx` and corrupted template literals and querySelector selectors across the whole file.

---

# ⛔ NON-BREAKABLE RULE — FILE HEADER COMMENTS

**This rule is mandatory. It cannot be skipped, abbreviated, or deferred.**

## Rule: Every file must have a header comment block at the very top.

### When it applies
- **Opening a file**: If the header comment is missing, ADD IT before doing anything else.
- **Creating a file**: Add the header as the first thing written.
- **Editing a file**: If you change logic or add/remove variables, UPDATE the header to reflect the change.
- Load karpathy-guidelines at the start.

### What the header must include

```tsx
/**
 * FILE: <relative path from project root>
 *
 * PURPOSE:
 *   <One or two sentences explaining what this file does and why it exists.>
 *
 * LOGIC OVERVIEW:
 *   <Step-by-step description of how the file works — data flow, conditions,
 *    side effects, SDK calls, state transitions, etc.>
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   <varName>       — <what it holds and where it comes from>
 *   <propName>      — <what the consumer passes in and why>
 *   <exportedFn>    — <what it returns / does>
 *
 * DEPENDENCIES:
 *   <SDK hook or function used, e.g. useJourneyDetail(id)>
 *   <External lib, e.g. SWR, date-fns>
 *
 * LAST UPDATED: <date in YYYY-MM-DD> — <brief reason for update>
 */
```

### Rules for the header

1. **Always at line 1** — before imports, `"use client"`, or anything else.
2. **Accurate, not aspirational** — describe what the code actually does.
3. **Update on every change** — update relevant sections and `LAST UPDATED` on every edit.
4. **No placeholders** — never `<TODO>` or `<describe later>` in a shipped header.
5. **Applies to all file types** — `.tsx`, `.ts`, `.js`, `.css`, config. Use the appropriate comment syntax for each.

### Enforcement

If you open or create a file without a header: STOP — add the header first, read the file, write an accurate header, then proceed.

---

## Plain-Text Explanations for Complicated Logic

**Wherever logic is non-trivial, write a plain-text explanation in a comment above it.** This overrides the default "no comments" bias — in this codebase, complicated sections MUST be explained.

### When it applies
- Non-obvious algorithms, state machines, timing/ordering constraints
- Multi-step data transformations (especially SDK → hook → page shape changes)
- Conditional branches where the intent is not self-evident from the code
- Workarounds for SDK gaps, browser/Capacitor quirks, or backend spec limitations
- Anything that would make a future reader pause and re-read

### How to write it
- Use plain English — describe what the block does AND why.
- Place the comment directly above the block it explains.
- Use `/* */` for multi-line blocks, `//` for one-liners.
- Do not restate obvious code (no `// increment counter` above `i++`).

### Keep it updated
- When editing a block that has an explanation comment, **update the comment in the same edit**. Stale explanations are worse than none.
- Update the file-header `LOGIC OVERVIEW` section in parallel.
- If logic changes enough that the explanation no longer makes sense, rewrite it — don't patch it.

---

## Context Discipline — Read Sparingly

**Context window is the scarcest resource.** Default to reading less.

**⛔ DO NOT START exploring without a user-provided starting point.** On any new task, first ask the user: "Where should I start? — file path, route, component, hook, or error." Then expand **one pointer at a time**: read at the pointer → identify the single next concrete reference → follow that one → stop and re-evaluate. Never fan out into "related" files. If unsure where to go next, ask.

**Search priority (token-efficient first):**
1. `code-review-graph` MCP — `semantic_search_nodes_tool`, `query_graph_tool`, `get_impact_radius_tool`, `get_minimal_context_tool`, `get_review_context_tool`. Use first for "where is X / who calls Y / impact of change Z." Graph auto-updates on file changes.
2. `ast-grep` (`/ast-grep` skill) — structural pattern match without reading bodies.
3. `grep -rn` / `rg` — plain text, line numbers only.
4. `Read` with `offset`/`limit` (≤80 lines) — only after the above located the line.

**Hard rules:**
- **Never** read a file >100 lines in full. Never read for a "feel" — have a specific question.
- **Never** re-read a file already shown this session. Scroll back.
- **Skip by default**: `package.json`, `tsconfig.json`, `next.config.*`, lockfiles, `sdk/backend-v2/**` (generated). Only read when the task is about them.
- **Speculative reads are forbidden** — don't open sibling files because they "might be related". Wait for a concrete pointer.
- **Subagents are expensive** — each runs its own requests and burns the overall budget. Only spawn `Explore` when investigation spans ≥5 unknown files and the graph MCP can't answer it.
- **Use Haiku subagents for big mechanical tasks.** When you do spawn a subagent, pass `model: "haiku"` for file location, grepping, listing, summarizing known files, repetitive refactors, or test running. Reserve Sonnet/Opus subagents for genuine reasoning. Default = Haiku.

---

## Component & Hook Layout

**Components**: feature-grouped under `components/<feature>/`. Shared components under `components/shared/`. shadcn primitives under `components/ui/`. See `../docs/structure/frontend-tree.md` for the full tree.

**Hooks**: feature-grouped under `hooks/<feature>/` (preferred) or top-level `hooks/use-*.ts` (legacy entry points). Full catalog in `../docs/on-demand/frontend-hooks.md` — read that when choosing or adding a hook.

---

## ⛔ NON-BREAKABLE RULE — ICON TILES MUST USE GlyphTile

**Never write an inline gradient or tinted icon tile.** The canonical component is:

```tsx
import { GlyphTile } from "@/components/shared/glyph-tile";

<GlyphTile icon={SomeLucideIcon} tint="purple" size="md" />
```

- **File**: `components/shared/glyph-tile.tsx`
- **Tints**: `blue | purple | green | pink | peach | orange` (resolves `--mt-tint-*` CSS vars)
- **Sizes**: `sm` (w-10) · `md` (w-11, default) · `lg` (w-12)
- **When you find an inline tile** (a `div` with `bg-gradient-to-br from-* to-*` or a hardcoded tinted bg used as an icon container) during **any** edit, replace it with `<GlyphTile>` in the same PR — do not defer.
- **Loading skeletons** must use the matching GlyphTile dimensions: `sm → w-10 h-10 rounded-[10px]`, `md → w-11 h-11 rounded-[12px]`, `lg → w-12 h-12 rounded-[14px]`.

---

## Data Fetching (SWR)

- All data fetching goes through SWR hooks in `hooks/`. Pages consume hooks; never call the SDK directly from a page.
- Cache keys come from `lib/swr-keys.ts` — do not inline.
- Global SWR config in `app/(auth)/layout.tsx` sets `revalidateOnFocus: false` (Capacitor shell).
- Hooks return `{ data, isLoading, error }` (or feature-specific aliases). Pages handle all three states: loading skeleton, error + retry, render.

---

## API & SDK Rules

0. **⛔ NEVER hand-edit the generated SDK.** Anything under `sdk/backend-v2/` is generator output. After any backend change, the SDK must be **regenerated** — never manually patched. No edits to fix a type, no edits to add a missing field, no casting to work around generator output. If the SDK doesn't match what you need: fix the backend spec, regenerate, and retry. See `../docs/routines/regenerate-sdk.md`.
1. **Only `crmController...` functions** — only call SDK functions whose names start with `crmController`.
2. **No hardcoded types** — import types from `@/sdk/backend-v2`, never define custom shapes.
3. **Pages are independent** — list and detail pages fetch their own data. No shared state between pages.
4. **No direct API calls** — no `client.*`, `fetch`, or `axios` for backend calls. Missing SDK function → follow `../docs/routines/spec-driven-backend-change.md`.
5. **No type coercions** — never `as X` or `as unknown[]`. Flag vague SDK types and wait for regeneration.
6. **No hardcoded UI data** — render only what the API returns. No fallback strings for missing data.
7. **Hooks wrap SDK; pages use hooks** — `crmController` calls belong in SWR hooks.
8. **Flag SDK gaps** — missing fields → inform user, wait for spec update + regeneration. No casting.
9. **Scope fetching to the resource** — never call a list endpoint to get one item. Pass the specific ID.

---

## Notes

- UI work: follow `@docs/DESIGN_GUIDELINES.md`.
- Routines for common tasks: `../docs/routines/` (frontend-bug-fix, new-sdk-page, regenerate-sdk, spec-driven-backend-change, commit-across-repos).
