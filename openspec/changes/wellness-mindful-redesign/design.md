## Context

Both `wellness-resources` and `mindful-minutes` sections are partially broken: raw `fetch` calls bypass the generated Strapi SDK, state is managed inline per-page (no SWR caching), several buttons are no-ops, durations and category labels are hardcoded, and the audio player lacks the immersive fullscreen experience users expect from a wellness app. The existing `AudioPlayer` component is a good foundation but needs a fullscreen overlay mode.

The Strapi SDK is auto-generated at `sdk/strapi/`. The mindful-minutes endpoints (`getApiV1MindfulMinutes`, `getApiV1MindfulMinutesSlugBySlug`) already exist. The wellness/blogs endpoints need SDK calls or direct fetch wrappers aligned with the SWR pattern used across the rest of the app.

## Goals / Non-Goals

**Goals:**
- Replace all raw `fetch` calls with SDK calls or consistent fetcher wrappers
- Create SWR hooks in `hooks/` for both features: `useWellnessResources`, `useWellnessResourceDetail`, `useMindfulMinutes`, `useMindfulMinuteDetail`
- API-driven categories (no hardcoded arrays) for both pages
- Fullscreen music-player overlay when audio is active in Mindful Minutes detail
- All interactive buttons functional: sort, category filter grid, view-all, pagination
- User-visible feedback on every async action (loading states, error toasts, retry)
- Real duration values from API (or formatted from audio metadata) instead of hardcoded strings

**Non-Goals:**
- Backend/API changes — all endpoints already exist
- Redesigning the booking or appointments flows
- Adding user-generated content (comments, ratings)
- Offline caching beyond what SWR provides by default

## Decisions

### 1. SWR hooks over inline useEffect + fetch
**Decision**: Wrap all data fetching in dedicated SWR hooks (`hooks/use-wellness-resources.ts`, `hooks/use-mindful-minutes.ts`).  
**Rationale**: Consistent with the rest of the app (see `hooks/use-doctor.ts`, etc.). SWR provides automatic deduplication, cache sharing between list and detail views, and revalidation. Eliminates duplicated loading/error state boilerplate across 4 pages.  
**Alternative considered**: React Query — rejected, SWR already used app-wide.

### 2. SDK calls for wellness-resources
**Decision**: Use the Strapi SDK (`sdk/strapi/`) for all wellness/blog fetches, matching the pattern used by mindful-minutes already.  
**Rationale**: The raw `fetch` to `mindtalkbuddy.com/api` hardcodes the base URL and bypasses any auth headers or interceptors the SDK client provides. SDK calls are more maintainable.  
**Alternative considered**: Keep raw fetch with env variable for base URL — rejected, violates existing project conventions.

### 3. Fullscreen audio player as an overlay component
**Decision**: Add a `FullscreenAudioPlayer` component that renders as a fixed-position overlay with `z-50`, triggered when the user taps a playing audio item in the mindful-minutes detail page.  
**Rationale**: Music-app UX (Spotify/Apple Music pattern) — a bottom sheet that expands to fullscreen feels native and keeps the user focused on the audio. The existing `AudioPlayer` component stays for the wellness-resources detail page (embedded inline). Avoids duplicating audio logic by extracting shared state into the hook or passing the audio element ref down.  
**Alternative considered**: Expand the existing `AudioPlayer` in-place — rejected, the list layout breaks when one item expands to near-fullscreen.

### 4. Categories derived from API response, not hardcoded
**Decision**: Both pages build their category lists from the API data at fetch time (accumulate unique category strings into a Set, then sort). "All" is always prepended.  
**Rationale**: Categories are content — they must match what's in the CMS. Hardcoding creates drift and requires code changes for every editorial update.  
**Alternative considered**: Separate categories endpoint — not available in current API; derive from items.

### 5. Duration display from audio metadata
**Decision**: In the `FullscreenAudioPlayer` and list cards, show real duration from `<audio>` `loadedmetadata` event (formatted as `m:ss`). If the API provides a `duration` field, use it as a fallback before audio loads.  
**Rationale**: Hardcoded "1:30 min" / "3 min" labels are misleading and erode trust.

## Risks / Trade-offs

- **SDK gaps for wellness/blogs**: The Strapi SDK may not have generated functions for the blogs endpoint. If so, implement a thin fetcher wrapper that uses the SDK's base client (consistent URL, auth headers) but calls the blog-specific paths. This is a likely first blocker to investigate.  
  → **Mitigation**: Check `sdk/strapi/sdk.gen.ts` for blog functions at start of implementation; fall back to SDK client fetch if missing.

- **Fullscreen overlay on Capacitor/iOS**: Fixed-position overlays with `z-50` can have stacking issues in WebView. Test on device early.  
  → **Mitigation**: Use `document.body` portal via React Portal; set `overflow: hidden` on body when overlay is open.

- **Audio autoplay restrictions**: Browsers block autoplay without user gesture.  
  → **Mitigation**: Only autoplay after explicit tap (user gesture chain is unbroken since user tapped the item).

- **No server-side pagination for wellness resources**: The current API call fetches all resources at once via the `pages` endpoint. Pagination may require a different endpoint.  
  → **Mitigation**: Implement client-side pagination as a first pass if server pagination endpoint is unavailable.

## Migration Plan

1. Create SWR hooks (no UI impact yet)
2. Swap page data fetching to use hooks (behaviorally equivalent, just cleaner)
3. Update list pages: API-driven categories, functional filters, real durations
4. Implement `FullscreenAudioPlayer` component
5. Wire fullscreen player into mindful-minutes detail page
6. Remove all hardcoded arrays and static labels
7. Test audio playback on device (iOS WebView via Capacitor)

Rollback: all changes are frontend-only and self-contained per page — revert individual files if needed.

## Open Questions

- Does `sdk/strapi/sdk.gen.ts` export functions for the `/blogs/` and `/pages/` endpoints, or do we need a thin wrapper?
- Does the `MindfulMinute` type's `audios[].duration` field exist in the API response, or must we derive duration from audio metadata only?
- Should the fullscreen player support background visual (`backgroundVisualUrl` from `MindfulMinuteAudio`) as a blurred background image, or a solid gradient?
