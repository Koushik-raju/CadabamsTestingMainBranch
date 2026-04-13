## Why

The current journey UI is functional but doesn't match the polished, gamified mobile-first design shown in the reference images. The journey index, details, and path pages need a redesign to match the Duolingo-style path visualization, structured details page with syllabus/outcomes, and a explore-first index page — while consolidating all journey data fetching into a single hook and migrating to a proper `[id]/details` + `[id]/path` route structure.

## What Changes

- **New route structure**: Move from `/journey/[id]` to `/journeys/[id]/details` and `/journeys/[id]/path` (and `/journeys` index). Preserve `/journey/` routes as redirects.
- **Redesigned index page** (`/journeys`): Category filter chips, "Recommended for You" banner (based on latest assessment), featured journey hero card with "Trending" badge, "Quick Picks" grid with filter button — matching reference image.
- **Redesigned details page** (`/journeys/[id]/details`): Hero image with level/duration badges, curator info, "What you'll achieve" outcome grid (4 icons), collapsible "Journey Syllabus" accordion with lock icons, sticky "Subscribe to Journey" CTA footer.
- **New path page** (`/journeys/[id]/path`): Duolingo-style vertical node path. Each unit has a header bar (orange), nodes for tasks (play, book, audio, journal, gift, trophy icons), completed = orange check, current = animated pulse, locked = gray lock. Sticky "Continue" CTA footer.
- **Single `useJourney` hook**: Centralizes all journey data fetching (list, detail, user progress from Firebase RTDB, subscribe/unsubscribe actions, path progress). Replaces scattered `useEffect`+`useState` patterns in pages.
- **Strapi SDK migration**: Replace direct `fetch` / manual `useEffect` calls with `getApiV1Journeys` / `getApiV1JourneysById` via the existing Strapi SDK, wrapped in SWR.
- **Shared question components**: Move `assessment-question-card.tsx` and `answer-selectors/` to `components/shared/questions/` since journey tasks reuse the same question UI.
- **Payment gate**: Premium journeys show a locked overlay on path nodes; tapping triggers a package/payment flow via existing Razorpay integration. **No new payment logic introduced** — reuse existing checkout flow.
- Preserve: mood-check page, existing journey components (card, discovery-card, day-list, premium-badge), assessment pages, all other features.

## Capabilities

### New Capabilities
- `journey-index`: Explore Journeys index page with recommendation banner, category chips, featured card, quick-picks grid
- `journey-details`: Journey details page with hero, outcomes, curator, syllabus accordion, subscribe CTA
- `journey-path`: Gamified vertical path page with unit headers, task nodes (completed/current/locked states), continue CTA
- `journey-hook`: Single `useJourney` hook as the source of truth for all journey data and actions
- `journey-questions`: Shared question/answer-selector components moved to `components/shared/questions/`

### Modified Capabilities
- (none — no existing spec-level requirement changes, only new pages and refactored data layer)

## Impact

- **Routes**: New `app/(auth)/journeys/` directory. Old `app/(auth)/journey/[id]/page.tsx` preserved or redirected.
- **Components**: `components/journey/` — new/updated components. `components/assessment/assessment-question-card.tsx` + `answer-selectors/` moved to `components/shared/questions/`.
- **Hooks**: New `hooks/use-journey.ts` (SWR + Firebase RTDB). Existing `hooks/use-assessments.ts` unchanged.
- **SDK**: Uses existing `sdk/strapi` — `getApiV1Journeys`, `getApiV1JourneysById`. No new SDK files.
- **Firebase**: Reads/writes `userJourneysMobile/{mobile}/journeys/{id}` (existing path).
- **Payment**: Reuses existing `app/(auth)/packages/` flow and `lib/capacitor/razorpay.ts`. No new payment endpoints.
