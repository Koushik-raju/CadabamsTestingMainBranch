## Context

The app has a working journey feature at `app/(auth)/journey/` but the UI doesn't match the designed reference images (Duolingo-style gamified path, structured details page, explore-first index). Data fetching is scattered across pages using raw `useEffect`+`useState` rather than SWR hooks — inconsistent with the rest of the codebase. Assessment question components are co-located with assessments but need to be shared with journey tasks.

Current route: `/journey/[id]` (single page mixing details + path)
Target routes: `/journeys` (index), `/journeys/[id]/details`, `/journeys/[id]/path`

## Goals / Non-Goals

**Goals:**
- Redesign all journey pages to match reference images exactly (mobile-first)
- Single `useJourney` SWR hook as the source of all journey data and actions
- Migrate to `/journeys/[id]/details` + `/journeys/[id]/path` route structure
- Move shared question components to `components/shared/questions/`
- Use Strapi SDK for content; Firebase RTDB for user progress
- Premium gate using existing package/Razorpay flow
- Reuse `components/shared/` and theme colors only (no hardcoded hex)
- Tailwind-animate for all animations

**Non-Goals:**
- New payment logic or new Razorpay integration points
- Backend API changes
- Changing assessment pages
- Desktop layout optimization (mobile-first only)
- Offline support

## Decisions

### 1. Route structure: `/journeys/` as new canonical, `/journey/` redirected

**Decision**: New pages live at `app/(auth)/journeys/`. Old `app/(auth)/journey/[id]/page.tsx` becomes a redirect to `/journeys/[id]/details`.

**Rationale**: Clean separation of details (marketing/info) from path (gamified progress). Redirects preserve any bookmarked/linked URLs without breaking users.

**Alternative considered**: Keep everything under `/journey/[id]` with tabs — rejected because the two views have very different scroll behaviors and sticky footers.

### 2. Single `useJourney(id?)` hook

**Decision**: `hooks/use-journey.ts` exports a single hook that handles:
- `useJourneys()` — SWR for list (Strapi)
- `useJourneyDetail(id)` — SWR for single journey (Strapi)  
- `useJourneyProgress(id)` — SWR for user progress (Firebase RTDB)
- `subscribeToJourney(id)` — mutating action (Firebase RTDB write)
- `updateProgress(id, nodeId)` — mark node complete (Firebase RTDB write)

**Rationale**: Consistent with how `use-assessments.ts` centralizes all assessment logic. Pages become thin — they call the hook, render the result.

**Alternative considered**: Separate hooks per concern (`useJourneyList`, `useJourneyProgress`, etc.) — rejected to keep import surface small for pages.

### 3. Path page: vertical node list, not canvas/SVG

**Decision**: Path nodes rendered as a vertical flex column with alternating left/right zigzag offset using CSS `translate-x`. No SVG or canvas.

**Rationale**: Reference images show a simple vertical chain. CSS transforms are easier to animate with tailwind-animate and don't require layout recalculation.

**Alternative considered**: SVG path with foreignObject nodes — too complex for the visual result needed.

### 4. Shared questions: move to `components/shared/questions/`

**Decision**: `assessment-question-card.tsx` and `answer-selectors/` move to `components/shared/questions/`. Assessment pages update their import paths.

**Rationale**: Journey tasks use identical question/answer UI. Co-locating in `shared/` makes the reuse explicit.

**Alternative considered**: Copy components into `components/journey/` — rejected (duplication).

### 5. Premium gate: overlay + redirect to packages

**Decision**: Locked path nodes show a `Lock` icon overlay. Tapping shows a bottom sheet "Unlock with a plan" with a CTA → `router.push('/packages')`. No inline payment flow.

**Rationale**: Keeps payment logic entirely in the existing packages/checkout flow. Journey feature has zero payment risk.

## Risks / Trade-offs

- **Firebase RTDB reads on path page**: Every node needs completion status from Firebase. Mitigation: Single snapshot read for the entire journey progress object, not per-node.
- **Strapi image URLs**: Current code has `fixImageUrl` helper in multiple places. Mitigation: Centralize in `use-journey.ts` or a shared util.
- **Import path breakage on question component move**: Assessment pages import `assessment-question-card` from `components/assessment/`. Mitigation: Update all import paths as part of the move task; grep for all usages first.
- **Route redirect timing**: Old `/journey/[id]` links in Firebase data still navigate correctly. Mitigation: `app/(auth)/journey/[id]/page.tsx` becomes a `permanentRedirect` to `/journeys/[id]/details`.

## Migration Plan

1. Create `app/(auth)/journeys/` route structure (new files, no deletions yet)
2. Create `hooks/use-journey.ts`
3. Move question components to `components/shared/questions/`, update all imports
4. Implement new journey components in `components/journey/`
5. Wire up new pages to hook + components
6. Add redirect in old `app/(auth)/journey/[id]/page.tsx`
7. Smoke test: index → details → subscribe → path → complete node

**Rollback**: Old pages remain until redirect is added (step 6). Revert step 6 to restore old behavior at any time.

## Open Questions

- Does the "Recommended for You" banner on the index pull from the latest assessment result stored in Firebase, or is this a static/manual recommendation from Strapi? (Assumption: derive from latest Firebase assessment result for the user's category.)
- Are journey "Gems" (shown in path-1 reference image: "450 Gems") tracked in Firebase RTDB or a separate backend? (Assumption: Firebase RTDB alongside streak/progress.)
