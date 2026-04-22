@AGENTS.md

---

# ⛔ NON-BREAKABLE RULE — FILE HEADER COMMENTS

**This rule is mandatory. It cannot be skipped, abbreviated, or deferred.**

## Rule: Every file must have a header comment block at the very top.

### When it applies
- **Opening a file**: If the header comment is missing, ADD IT before doing anything else.
- **Creating a file**: Add the header as the first thing written.
- **Editing a file**: If you change logic or add/remove variables, UPDATE the header to reflect the change.

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

## MCP Tools: code-review-graph (USE FIRST)

This project has a knowledge graph. **Always use the graph MCP tools BEFORE Grep/Glob/Read.** Faster, cheaper, gives structural context (callers, dependents, test coverage) that file scanning cannot.

| Tool | Use when |
|---|---|
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `get_impact_radius` | Understanding blast radius of a change |
| `detect_changes` | Reviewing code changes — risk-scored analysis |
| `get_review_context` | Source snippets for review — token-efficient |
| `get_affected_flows` | Execution paths impacted |
| `get_architecture_overview` | High-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

Graph auto-updates on file changes. Fall back to Grep/Glob/Read only when the graph doesn't cover what you need.

---

## Component & Hook Layout

**Components**: feature-grouped under `components/<feature>/`. Shared components under `components/shared/`. shadcn primitives under `components/ui/`. See `../docs/structure/frontend-tree.md` for the full tree.

**Hooks**: feature-grouped under `hooks/<feature>/` (preferred) or top-level `hooks/use-*.ts` (legacy entry points). Full catalog in `../docs/on-demand/frontend-hooks.md` — read that when choosing or adding a hook.

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
