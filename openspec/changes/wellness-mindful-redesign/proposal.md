## Why

The Wellness Resources and Mindful Minutes sections have significant UX gaps — hardcoded values, non-functional buttons, raw `fetch` calls instead of SDK, no unified data hooks, and a basic audio player with no fullscreen experience. Users need a polished, fully functional experience where every action gives feedback, audio plays in a dedicated immersive player, and all filters/categories are API-driven.

## What Changes

- **Replace raw `fetch` calls** in `wellness-resources/page.tsx` and `wellness-resources/[slug]/page.tsx` with Strapi SDK calls (or custom fetchers aligned with the SDK pattern)
- **Create unified SWR hooks**: `useWellnessResources`, `useWellnessResourceDetail`, `useMindfulMinutes`, `useMindfulMinuteDetail` — all in `hooks/`
- **Fullscreen music player** for audio: when audio is playing in Mindful Minutes detail page, display a full-screen overlay styled like a music player app (artwork, title, progress bar, controls, close button)
- **Functional category filters**: derive all categories from API response — no hardcoded values
- **Remove all hardcoded content**: eliminate `BROWSE_BY_NEED` static array, hardcoded durations ("1:30 min", "3 min"), and hardcoded "Audio · Guided" labels — use values from API
- **Fix non-functional sort button** ("Shortest first") in Mindful Minutes detail page — implement actual sort by duration
- **Fix "Browse by need" grid** — wire items to actual category filters from the API instead of doing nothing
- **Action feedback**: toast/snackbar on errors, loading states, retry buttons, and visual state changes on all interactive elements
- **Pagination support** for Wellness Resources list (API returns paginated data)
- **Upgrade AudioPlayer** component to support fullscreen mode with background visual URL from API

## Capabilities

### New Capabilities
- `wellness-resources-hub`: Unified data layer (SWR hooks) + redesigned list and detail pages for Wellness Resources with SDK calls, working filters, pagination, and rich article detail view
- `mindful-minutes-hub`: Unified data layer (SWR hooks) + redesigned list and detail pages for Mindful Minutes with functional category filters, API-driven categories, and fullscreen audio player
- `fullscreen-audio-player`: Immersive fullscreen audio player overlay (music-app style) with background visual, artwork, animated progress, skip controls, and smooth open/close transitions

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `app/(auth)/wellness-resources/page.tsx` — full rewrite to use SWR hook
- `app/(auth)/wellness-resources/[slug]/page.tsx` — full rewrite to use SWR hook
- `app/(auth)/mindful-minutes/page.tsx` — full rewrite to use SWR hook
- `app/(auth)/mindful-minutes/[slug]/page.tsx` — full rewrite to use SWR hook + fullscreen player
- `components/wellness/audio-player.tsx` — add fullscreen mode prop and overlay
- `components/wellness/category-filter.tsx` — minor: ensure it handles empty/loading state
- `hooks/use-wellness-resources.ts` — new file
- `hooks/use-mindful-minutes.ts` — new file
- No API/backend changes required; all data comes from existing Strapi endpoints already in SDK
