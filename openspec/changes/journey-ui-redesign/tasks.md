## 1. Shared Question Components

- [x] 1.1 Create `components/shared/questions/` directory and move `assessment-question-card.tsx` into it
- [x] 1.2 Move `components/assessment/answer-selectors/mcq.tsx` → `components/shared/questions/answer-selectors/mcq.tsx`
- [x] 1.3 Move `components/assessment/answer-selectors/multi-dropdown.tsx` → `components/shared/questions/answer-selectors/multi-dropdown.tsx`
- [x] 1.4 Move `components/assessment/answer-selectors/smiley.tsx` → `components/shared/questions/answer-selectors/smiley.tsx`
- [x] 1.5 Move `components/assessment/answer-selectors/yes-no.tsx` → `components/shared/questions/answer-selectors/yes-no.tsx`
- [x] 1.6 Move `components/assessment/question-renderer.tsx` → `components/shared/questions/question-renderer.tsx` (create if missing)
- [x] 1.7 Replace all hardcoded color classes (`orange-`, `slate-`, `blue-`) in moved components with theme tokens (`text-primary`, `bg-primary/10`, `border-primary`, `text-muted-foreground`, etc.)
- [x] 1.8 Update all import paths in `components/assessment/` pages and hooks that referenced the old locations
- [x] 1.9 Update all import paths in `app/(auth)/assessments/` pages that referenced the old locations

## 2. SWR Keys & Hook Foundation

- [x] 2.1 Add `journeysKey()`, `journeyDetailKey(id)`, and `journeyProgressKey(mobile, journeyId)` to `lib/swr-keys.ts`
- [x] 2.2 Create `hooks/use-journey.ts` with `useJourneys(options?)` using `getApiV1Journeys` + SWR
- [x] 2.3 Add `useJourneyDetail(id)` to `hooks/use-journey.ts` using `getApiV1JourneysById` + SWR
- [x] 2.4 Add `useJourneyProgress(journeyId)` to `hooks/use-journey.ts` reading Firebase RTDB at `userJourneysMobile/{mobile}/journeys/{journeyId}`
- [x] 2.5 Add `subscribeToJourney(journeyId, meta)` action to `hooks/use-journey.ts` — writes initial record to Firebase RTDB and mutates SWR cache
- [x] 2.6 Add `updateNodeProgress(journeyId, nodeId)` action to `hooks/use-journey.ts` — appends nodeId to `completedNodeIds`, increments gems by 10, recalculates progress %, mutates cache
- [x] 2.7 Centralise `fixImageUrl` helper in `lib/utils.ts` (or `lib/journey-utils.ts`) and remove duplicates from existing journey components

## 3. Journey Index Page (`/journeys`)

- [x] 3.1 Create `app/(auth)/journeys/page.tsx` — wire up `useJourneys()` hook and render page shell with app-bar ("Explore Journeys" + search icon)
- [x] 3.2 Create `components/journey/recommendation-banner.tsx` — reads latest Firebase assessment result for user, shows category-specific message with chevron; hidden when no result
- [x] 3.3 Create `components/journey/category-chips.tsx` — horizontally scrollable chips (All, Anxiety, Sleep, Depression + extras); active chip uses filled `bg-foreground text-background` style
- [x] 3.4 Create `components/journey/featured-journey-card.tsx` — full-width hero card with image background, "Trending" badge (top-left overlay), duration/level badges, title, short description, "Start Now →" button
- [x] 3.5 Update `components/journey/journey-discovery-card.tsx` — ensure quick-pick grid cards show media-type tag (Audio/Interactive/Journal) and use only theme colors
- [x] 3.6 Wire filters button and category chip state in `app/(auth)/journeys/page.tsx` to filter `useJourneys()` results
- [x] 3.7 Add skeleton loading states for hero card and grid in the index page

## 4. Journey Details Page (`/journeys/[id]/details`)

- [x] 4.1 Create `app/(auth)/journeys/[id]/details/page.tsx` — fetch via `useJourneyDetail(id)`, render page shell with back button
- [x] 4.2 Render hero image with level/duration/time-per-day badge pills below it (theme color tokens only)
- [x] 4.3 Render journey title and description
- [x] 4.4 Create `components/journey/curator-row.tsx` — avatar, "Curated by [Name]", role/title; hidden if no curator data
- [x] 4.5 Create `components/journey/outcomes-grid.tsx` — 2×2 grid of up to 4 outcome items with icon + label from journey achievements data
- [x] 4.6 Create `components/journey/syllabus-accordion.tsx` — list of steps as accordion rows; each row: orange circle number, title, day range, task count, lock icon; uses tailwind-animate for expand/collapse
- [x] 4.7 Create `components/journey/subscribe-footer.tsx` — sticky footer with "Total Duration" label and CTA button; label/action changes based on free/premium and subscription status (Subscribe / Unlock Premium / Continue)
- [x] 4.8 Wire subscribe CTA: free → `subscribeToJourney()` + navigate to `/journeys/[id]/path`; premium → navigate to `/packages`; already subscribed → navigate to `/journeys/[id]/path`
- [x] 4.9 Add full-page skeleton loading state

## 5. Journey Path Page (`/journeys/[id]/path`)

- [x] 5.1 Create `app/(auth)/journeys/[id]/path/page.tsx` — fetch via `useJourneyDetail(id)` + `useJourneyProgress(id)`; redirect to `/journeys/[id]/details` if not subscribed
- [x] 5.2 Create `components/journey/path-stats-row.tsx` — flame+streak, gem+count, circular progress % using theme colors
- [x] 5.3 Create `components/journey/unit-header-bar.tsx` — orange bar with unit number, unit title, "Guidebook" chip button
- [x] 5.4 Create `components/journey/path-node.tsx` — circular node component with variants: `completed` (orange + check), `active` (orange + pulse ring via tailwind-animate `animate-ping`), `locked` (gray + lock icon), `default` (gray + task icon). Icons mapped by task type.
- [x] 5.5 Create `components/journey/path-chain.tsx` — renders zigzag vertical chain of `PathNode` components for a single unit, alternating left/right offsets with `translate-x` utilities
- [x] 5.6 Wire node tap: active node → navigate to task screen (assessment/audio/journal); locked + premium → show bottom sheet with `/packages` CTA; locked + free → no-op
- [x] 5.7 Create `components/journey/continue-footer.tsx` — sticky orange "CONTINUE" button navigating to active node task; shows "Journey Complete 🎉" when all nodes done
- [x] 5.8 Add loading skeleton for path page

## 6. Route Migration & Redirects

- [x] 6.1 Create `app/(auth)/journeys/layout.tsx` if any shared layout is needed (e.g. SWR provider already in `(auth)/layout.tsx` — verify no duplicate needed)
- [x] 6.2 Replace `app/(auth)/journey/[id]/page.tsx` content with `permanentRedirect('/journeys/[id]/details')` using the dynamic param
- [x] 6.3 Verify `app/(auth)/journey/page.tsx` still works or add redirect to `/journeys`
- [x] 6.4 Update any internal `router.push('/journey/...')` calls in existing components (`journey-card.tsx`, `journey-discovery-card.tsx`) to use the new `/journeys/` paths

## 7. Preservation & Cleanup

- [x] 7.1 Verify `app/(auth)/journey/mood-check/page.tsx` and `components/journey/mood-check-form.tsx` are untouched and still functional
- [x] 7.2 Verify all assessment pages (`app/(auth)/assessments/`) still work after question component move (import paths updated in step 1)
- [x] 7.3 Remove `fixImageUrl` duplicates from `components/journey/journey-discovery-card.tsx` and `app/(auth)/journey/[id]/page.tsx` after centralising in step 2.7
- [ ] 7.4 Smoke test full flow: `/journeys` → tap featured → `/journeys/[id]/details` → subscribe → `/journeys/[id]/path` → tap active node → complete task → verify progress update in Firebase
