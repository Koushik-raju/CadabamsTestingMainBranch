## 1. Fix Task Navigation (Root Cause Bug)

- [ ] 1.1 In `journey-path-view.tsx` `onOpen` callback: remove the `updateNodeProgress` call — keep only the `navigateToTask` call
- [ ] 1.2 In `navigateToTask`: when `destinationPath` is null/undefined, close the sheet and show a toast ("This task isn't available yet") instead of silently returning
- [ ] 1.3 Verify `onMarkDone` callback is the sole path calling `updateNodeProgress` (for both the explicit "Mark as Done" button and the "Mark as Read" read-task button)
- [ ] 1.4 Smoke-test: tap an active assessment node → should navigate to assessment page without marking it done

## 2. Preview Sheet for Unsubscribed Users

- [ ] 2.1 Create `components/journey/journey-preview-sheet.tsx` — bottom sheet showing task type badge, title, brief description, and subscribe/plans CTA (no navigation, no progress mutation)
- [ ] 2.2 In `handleNodeTap` inside `journey-path-view.tsx`: when `!isSubscribed`, open `JourneyPreviewSheet` instead of `JourneyTaskActionSheet`
- [ ] 2.3 Wire preview sheet's free-journey CTA to call `subscribeToJourney` and close the sheet
- [ ] 2.4 Wire preview sheet's premium CTA to `router.push('/packages')` and close the sheet
- [ ] 2.5 Add the file header comment block to `journey-preview-sheet.tsx`

## 3. Subscribe CTA for Free Journeys — pass `?preview=true` on GET

- [ ] 3.1 **Backend prerequisite**: ask backend agent to add `?preview=true` query param to `GET /api/v1/me/journeys/{journeyId}` (when `true`, do NOT auto-enroll; return `null`/404 if not yet enrolled) and regenerate the SDK. Verify `JourneysControllerGetByJourneyIdData.query` becomes `{ preview?: boolean }`
- [ ] 3.2 Once SDK is regenerated, update `useJourneyProgress` in `hooks/journeys/use-journey-detail.ts` to pass `query: { preview: true }` in the `journeysControllerGetByJourneyId` call — this ensures the GET never auto-enrolls
- [ ] 3.3 Update the file header comment in `use-journey-detail.ts` to remove the "GET auto-enrolls non-premium journeys server-side" note and replace with "GET is preview-only; enrollment requires explicit `subscribeToJourney` (POST)"
- [ ] 3.4 Ensure the sticky footer CTA is visible when `progress === null && !journey.isPremium` with label "Start Free Journey →"
- [ ] 3.5 Button loading state: disable and show spinner while `subscribing` is `true`
- [ ] 3.6 On `subscribeToJourney` error: show toast "Something went wrong. Try again." and return button to idle
- [ ] 3.7 Smoke-test: load a free journey as a never-enrolled user → `progress` should be `null`, footer CTA shows, tapping it enrolls and footer disappears

## 4. Cooldown Banner — Correct Day Label and Timer

- [ ] 4.1 Replace `currentDayIdx + 1` in the banner footer text with `progress.currentDay` for "Day X done" label
- [ ] 4.2 Replace `currentDayIdx + 2` with `progress.currentDay + 1` for "Day Y unlocks next" label
- [ ] 4.3 Confirm `todayDone` / `todayTotal` use `t.dayNumber === progress.currentDay` (already correct — verify no off-by-one with `currentDay as unknown` cast on line 158 and clean up that cast)
- [ ] 4.4 Verify countdown timer ticks and `tickJourney` fires when it hits zero

## 5. Auto-Scroll to Current Day

- [ ] 5.1 Add `data-node-id` attributes to each node `div` rendered by `PathChain` (or the parent wrapper in `journey-path-view.tsx`) keyed by `task.id`
- [ ] 5.2 On mount (after path renders), use `useEffect` + `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` to scroll to the first active/available node of `currentDay`
- [ ] 5.3 After scroll, apply a brief CSS scale pulse animation (e.g. `animate-bounce` for 600 ms) on the target node to draw attention
- [ ] 5.4 Add a "Continue →" button to the today banner that triggers the same scroll imperatively via `useRef`
- [ ] 5.5 Preserve scroll position on back-navigation: store `window.scrollY` in `sessionStorage` before `router.push`, restore it on mount when `redirectTo` is in the URL

## 6. Day Summary Sheet

- [ ] 6.1 Check SDK for a day-summary endpoint (e.g. `journeysControllerGetDaySummary`); if absent, flag to user and implement static fallback only
- [ ] 6.2 Create `components/journey/journey-day-summary-sheet.tsx` — bottom sheet with loading skeleton, server-generated or static summary text, and "Next Day →" CTA
- [ ] 6.3 In `journey-path-view.tsx`: track `prevTodayDone` via `useRef`; when `todayDone === todayTotal && todayTotal > 0` and this transition happens in-session (not on page load when already complete), open the summary sheet
- [ ] 6.4 "Next Day →" CTA in summary sheet: close sheet, then trigger the auto-scroll to the first node of the next day
- [ ] 6.5 Add the file header comment block to `journey-day-summary-sheet.tsx`

## 7. Verify Task Completion on Return

- [ ] 7.1 On `JourneyPathView` mount with `redirectTo` indicator (user just returned from a task page), call `mutate(journeyEnrollmentKey(journeyId))` to re-fetch enrollment — the server is the source of truth for task state
- [ ] 7.2 If the backend does not auto-mark certain task types as complete (e.g. assessment submission, audio listen-through), add a client-side verification call: `tickJourney(progress.id, journeyId)` on mount after return — server will idempotently reconcile
- [ ] 7.3 Compare previous known `completed` set (cached in `sessionStorage` before navigation) with post-return enrollment; if a task transitioned to `completed`, trigger the XP float + haptic success
- [ ] 7.4 If no transition detected but the user returned from a task that should auto-complete, log a warning (backend may not have marked it done) — flag cases to the user

## 8. Session Gate for Free-Preview Users

- [ ] 8.1 In `journey-path-view.tsx` `handleNodeTap`: when `isPaidFreePreview === true` AND the tapped node's `taskType === 'book'`, redirect to the package page instead of opening the action sheet
- [ ] 8.2 Read the related package id from `progress.premiumUnlockPackageId` (SDK field, pending backend; see § 9). If present, `router.push('/packages/' + id)`; if absent, `router.push('/packages')` with a toast "Upgrade to book sessions"
- [ ] 8.3 Also gate book tasks inside `JourneyUnitTasksSheet` row tap (`onTaskTap`) — same redirect logic
- [ ] 8.4 Smoke-test: free-preview user taps a "Book a Session" node → lands on the correct `/packages/{id}` page

## 9. Unenrolled Users — Zero Backend Calls, Display-Only

- [ ] 9.1 In `useJourneyProgress`, when `?preview=true` is passed and the response is `null` (not enrolled), do NOT auto-refetch on focus/retry — single fetch only
- [ ] 9.2 In `journey-path-view.tsx`: when `!isSubscribed`, do NOT call `tickJourney` on mount (currently fires unconditionally in the mount effect) — guard with `if (!progress) return;` (already present — verify)
- [ ] 9.3 In `journey-path-view.tsx`: when `!isSubscribed`, do NOT call `updateNodeProgress` from any code path — the preview sheet and action sheet must never reach the mark-done code when `progress === null`
- [ ] 9.4 In preview sheet: CTA calls `subscribeToJourney` ONLY — no other API calls (no tick, no completion)
- [ ] 9.5 Disable all tappable nodes visually with reduced opacity and `cursor-default` while `!isSubscribed`; tap still opens preview sheet (which is the ONE allowed UI, no backend work)
- [ ] 9.6 Verify no SWR hook fires a POST/PATCH when `progress === null`: grep for `journeysController` calls in mount effects; any that require `progress.id` must early-return
- [ ] 9.7 Smoke-test with network tab open: load an unenrolled free journey → only ONE GET to `/api/v1/me/journeys/{id}?preview=true` fires; tapping any node fires ZERO additional requests until the user taps "Start Free Journey"

## 10. Backend Items to Pass to Backend Agent

- [ ] 10.1 Document the following items in `openspec/changes/fix-journey-details-navigation-and-ux/backend-asks.md`:
    - **Day summary endpoint**: need `GET /journeys/:id/day-summary?day=N` returning `{ summaryText: string, highlights: string[] }` — used by the day-complete sheet
    - **Auto-mark-on-completion per task type**: confirm backend marks task `completed` when: assessment submitted, audio ≥90% listened, journal entry saved, booking confirmed, mood check-in submitted. If not, frontend falls back to `tickJourney` reconciliation
    - **`?preview=true` query param on `GET /api/v1/me/journeys/{journeyId}`**: add support so that when `preview=true`, the endpoint does NOT auto-enroll and returns `null`/404 for unenrolled users. Free journeys must require explicit `subscribeToJourney` (POST). Frontend will always pass `preview=true`. Please regenerate the SDK after adding so `JourneysControllerGetByJourneyIdData.query` is `{ preview?: boolean }`
    - **`premiumUnlockPackageId` on `PatientJourneyResponseDto` (or `JourneyItem`)**: add the ID of the package that unlocks premium access for this journey, so the session-gate redirect can land on the correct `/packages/{id}` page instead of the generic `/packages` list
    - **`destinationPath` on `EnrollmentTaskDto`**: confirm server always populates `destinationPath` for every task type. Missing paths cause the navigation bug
    - **`nextDayUnlocksAt`**: confirm this field is populated whenever a day is completed and the next day has not yet unlocked; ensure timezone is UTC ISO-8601
    - **`currentDay`**: confirm it is 1-indexed and updates on `tickJourney` when cooldown elapses

## 11. Code Cleanup

- [ ] 11.1 Remove `as unknown` cast on line 158 of `journey-path-view.tsx` (`t.dayNumber === (currentDay as unknown)`) — use `t.dayNumber === progress.currentDay` directly
- [ ] 11.2 Update the `LAST UPDATED` line and relevant sections in the header comments of all modified files
- [ ] 11.3 Verify no custom type definitions were added — all types come from `@/sdk/backend-v2`
