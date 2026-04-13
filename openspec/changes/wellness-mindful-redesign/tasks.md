## 1. Route Restructuring

- [ ] 1.1 Create a `(wellness)` route group folder at `app/(auth)/(wellness)/` to co-locate all content pages
- [ ] 1.2 Move `app/(auth)/wellness-resources/` into `app/(auth)/(wellness)/wellness-resources/` (preserve `page.tsx`, `[slug]/page.tsx`, `loading.tsx`)
- [ ] 1.3 Move `app/(auth)/mindful-minutes/` into `app/(auth)/(wellness)/mindful-minutes/` (preserve `page.tsx`, `[slug]/page.tsx`, `loading.tsx`)
- [ ] 1.4 Move `app/(auth)/video/` into `app/(auth)/(wellness)/video/` (preserve `page.tsx`)
- [ ] 1.5 Verify all internal links (`/wellness-resources`, `/mindful-minutes`, `/video`) still resolve correctly after the move (Next.js route group folders don't affect URL paths)
- [ ] 1.6 Update any `BackButton fallback` props or hardcoded paths that reference the old locations

## 2. Strapi SDK — Check & Wrap Missing Endpoints

- [ ] 2.1 Inspect `sdk/strapi/sdk.gen.ts` for existing blog/page endpoint functions (search for `blogs`, `pages`)
- [ ] 2.2 If no SDK function exists for `/blogs/` or `/pages/`, create a thin fetcher wrapper in `lib/strapi-fetcher.ts` that uses the SDK's configured base client (so auth headers and base URL are inherited)
- [ ] 2.3 If no SDK function exists for `/videos/`, create a similar wrapper for the videos endpoint
- [ ] 2.4 Update `types/wellness.ts` to add `VideoItem` interface (currently local to `video/page.tsx`) and a `duration?: string` field to `MindfulMinuteAudio`

## 3. SWR Hooks

- [ ] 3.1 Create `hooks/use-wellness-resources.ts` with `useWellnessResources()` — returns `{ resources, categories, isLoading, error, mutate }`; derives categories from response; key: `/wellness-resources`
- [ ] 3.2 Create `hooks/use-wellness-resource-detail.ts` with `useWellnessResourceDetail(slug)` — returns `{ resource, isLoading, error }`; key: `/wellness-resources/${slug}`
- [ ] 3.3 Create `hooks/use-mindful-minutes.ts` with `useMindfulMinutes()` — wraps `getApiV1MindfulMinutes` with SWR; returns `{ items, categories, isLoading, error, mutate }`; key: `/mindful-minutes`
- [ ] 3.4 Create `hooks/use-mindful-minute-detail.ts` with `useMindfulMinuteDetail(slug)` — wraps `getApiV1MindfulMinutesSlugBySlug`; key: `/mindful-minutes/${slug}`
- [ ] 3.5 Create `hooks/use-videos.ts` with `useVideos()` — fetches collection videos via SDK/wrapper; returns `{ videos, categories, isLoading, error, mutate }`; key: `/videos`
- [ ] 3.6 Add all new SWR keys to `lib/swr-keys.ts` following the existing key factory pattern

## 4. Fullscreen Audio Player Component

- [ ] 4.1 Create `components/wellness/fullscreen-audio-player.tsx` — fixed-position overlay, slide-up animation, music-player layout
- [ ] 4.2 Implement blurred background visual using `backgroundVisualUrl` from `MindfulMinuteAudio` (fallback to primary gradient if no image)
- [ ] 4.3 Add large album art / emoji placeholder in the center of the fullscreen player
- [ ] 4.4 Add progress slider, `m:ss` current time and duration display (real values from audio metadata)
- [ ] 4.5 Add play/pause, rewind −10s, forward +10s controls
- [ ] 4.6 Add previous/next track navigation buttons (disabled at list boundaries)
- [ ] 4.7 Add close/chevron-down button that dismisses the overlay without stopping audio
- [ ] 4.8 Lock body scroll when overlay is open (`overflow: hidden` on `document.body`); restore on close
- [ ] 4.9 Use React Portal (`ReactDOM.createPortal`) to mount overlay at `document.body` to avoid stacking issues in Capacitor WebView
- [ ] 4.10 Add "Now playing" animated equalizer bars indicator to the list card while audio is active

## 5. Wellness Resources — List Page Rewrite

- [ ] 5.1 Replace inline `useEffect + fetch` with `useWellnessResources()` hook
- [ ] 5.2 Remove hardcoded `STRAPI_URL` constant — all fetching via SDK wrapper/hook
- [ ] 5.3 Wire `categories` from hook into `CategoryFilter` — no hardcoded category values
- [ ] 5.4 Show skeleton grid (6 items) while `isLoading` is true
- [ ] 5.5 Show error message + "Retry" button (calls `mutate()`) when `error` is non-null
- [ ] 5.6 Implement "Load more" button if the API response includes a `pagination` object with more pages; hide when all loaded

## 6. Wellness Resources — Detail Page Rewrite

- [ ] 6.1 Replace inline `useEffect + fetch` with `useWellnessResourceDetail(slug)` hook
- [ ] 6.2 Remove hardcoded Strapi URL (`https://mindtalkbuddy.com/api/blogs/...`)
- [ ] 6.3 Render rich body content: if `resource.text` blocks exist, render them (handle `blocks.richtext`, `blocks.image`, etc.); fallback to `resource.description`
- [ ] 6.4 Ensure `AudioPlayer` and `VideoPlayer` only render when their respective URL fields are present and non-empty
- [ ] 6.5 Show error state with "Back to Resources" link if resource not found

## 7. Mindful Minutes — List Page Rewrite

- [ ] 7.1 Replace inline `useEffect + fetch` with `useMindfulMinutes()` hook
- [ ] 7.2 Remove `BROWSE_BY_NEED` hardcoded array; build "Explore categories" grid from API `categories`
- [ ] 7.3 Wire category grid items to set `selectedCategory` to the tapped category name (not just switch to list view with "All")
- [ ] 7.4 Remove hardcoded duration labels ("1:30 min", "3 min") from featured and list cards; show API `duration` field or "–" placeholder
- [ ] 7.5 Remove hardcoded "Audio · Guided" label; show `video.category` value from API
- [ ] 7.6 Fix "View all audio" button — use router navigation or state update, whichever is appropriate
- [ ] 7.7 Show error message + "Retry" button when `error` is non-null
- [ ] 7.8 Use `router.push` (not `window.location.assign`) for navigation consistency with the rest of the app

## 8. Mindful Minutes — Detail Page Rewrite

- [ ] 8.1 Replace inline `useEffect + fetch` with `useMindfulMinuteDetail(slug)` hook
- [ ] 8.2 Remove inline search `<input>` from header; replace with a proper `Input` component (consistent with wellness-resources)
- [ ] 8.3 Implement sort toggle: "Shortest first" / "Longest first" — sort `audios` array by `duration` field ascending/descending
- [ ] 8.4 Wire audio item tap to open `FullscreenAudioPlayer` overlay instead of inline `AudioPlayer`
- [ ] 8.5 Pass `audios` list and current index to `FullscreenAudioPlayer` for prev/next navigation
- [ ] 8.6 Show "Now playing" animated indicator on the active audio card
- [ ] 8.7 Remove duplicate "Audio" / "Audio" badge labels on cards; show category and duration from API

## 9. Video Page Rewrite

- [ ] 9.1 Replace inline `useEffect + fetch` with `useVideos()` hook
- [ ] 9.2 Remove hardcoded fetch URL (`https://mindtalkbuddy.com/api/videos?...`) — use SDK wrapper
- [ ] 9.3 Wire categories from hook into `CategoryFilter` — prepend "All", no hardcoded values
- [ ] 9.4 Add "Retry" button to error state (currently missing)
- [ ] 9.5 Use `router.push(`/video?url=...`)` instead of `window.location.assign` for navigation
- [ ] 9.6 Move `VideoItem` interface from page file to `types/wellness.ts`
- [ ] 9.7 Add page title and article count sub-heading to the header (consistent with wellness-resources header style)

## 10. Polish & QA

- [ ] 10.1 Test audio playback end-to-end on iOS WebView (Capacitor): play, pause, seek, skip, fullscreen open/close
- [ ] 10.2 Verify category filters work for all three pages with real API data (no hardcoded categories remain)
- [ ] 10.3 Confirm no `window.location.assign` or raw `fetch('https://mindtalkbuddy...')` calls remain in any of the four pages
- [ ] 10.4 Verify `BackButton` fallback paths are correct after route restructuring
- [ ] 10.5 Check that SWR keys in `lib/swr-keys.ts` cover all new hooks
- [ ] 10.6 Run TypeScript build (`tsc --noEmit`) to confirm no type errors
