## Context

The journey details page (`app/(auth)/journeys/[id]/details/page.tsx`) renders a scrollable path of task nodes via `JourneyPathView`. Tapping a node opens `JourneyTaskActionSheet`. The action sheet exposes two callbacks to the parent: `onOpen` (primary CTA — intended to navigate to the task) and `onMarkDone` (secondary CTA — intended to mark the task complete without navigation).

**Root cause — task navigation bug**: The `onOpen` callback in `journey-path-view.tsx` unconditionally calls `updateNodeProgress` for every active task before calling `navigateToTask`. `navigateToTask` returns early when `entry?.destinationPath` is null or undefined (which the server may not always set). This means the task gets marked done silently with no page transition, which is the primary bug.

**Root cause — subscribe flow**: `useJourneyProgress` returns `null` on 404, meaning an unsubscribed user will see `progress = null` and `isSubscribed = false`. The footer subscribe button does exist but its visibility depends on `!isSubscribed`. The hook comment says "GET auto-enrolls free journeys server-side" — if this is actually happening the server returns 200 with a real enrollment and `isSubscribed` is always `true`, hiding the footer. The fix must ensure the subscribe button is shown and calls `subscribeToJourney` which revalidates the SWR key.

**Root cause — cooldown banner**: `nextDayUnlocksAt` is read from `progress.nextDayUnlocksAt`. If the field is absent or the date is in the past on page load, `showCooldownBanner` is `false`. The day label currently uses `currentDayIdx + 1` which is `currentDay` (1-based) — this should be consistent with the server's `currentDay` field, which is already stored in `progress.currentDay`.

**Root cause — preview mode for unsubscribed users**: Node taps currently call `handleNodeTap` which opens the full `JourneyTaskActionSheet` with an `onOpen` callback that tries to navigate. For unsubscribed users, navigation to task pages is not appropriate — a read-only preview sheet with a subscribe CTA is needed.

## Goals / Non-Goals

**Goals:**
- Fix `onOpen` so it only navigates (does not call `updateNodeProgress`)
- Fix `onMarkDone` so it is the sole path that calls `updateNodeProgress`
- Show subscribe button for unsubscribed users on free journeys; show "View Plans" for premium
- Show a preview-only bottom sheet when an unsubscribed user taps any node (no navigation, no mark-done)
- Show the cooldown banner correctly using the server's `nextDayUnlocksAt` and `currentDay` fields
- No custom type definitions — use SDK types directly from `@/sdk/backend-v2`

**Non-Goals:**
- Changing the backend auto-enroll behavior
- Refactoring the SWR hooks beyond what is needed
- Adding new SDK endpoints
- Changing the premium package purchase flow

## Decisions

### 1. Separate navigation from progress mutation

**Decision**: `onOpen` in `journey-task-action-sheet` calls ONLY navigation. `onMarkDone` is the only path that calls `updateNodeProgress`.

**Rationale**: The current code calls `updateNodeProgress` inside `onOpen` "as a convenience" — marking the task done when the user opens it. This is incorrect UX (opening a task ≠ completing it) and masks the navigation bug when `destinationPath` is null. Separating these two actions is the correct data model.

**Alternative considered**: Keep calling `updateNodeProgress` in `onOpen` but only after navigation succeeds. Rejected — navigation is a side effect of a route push and there is no reliable completion callback; the server marks progress via the task's own completion screen.

### 2. Preview sheet for unsubscribed users

**Decision**: When `!isSubscribed` and the user taps any node, show a new inline bottom sheet (`JourneyPreviewSheet`) that shows the task title, type badge, and a "Start Free Journey" / "View Plans" CTA only. Do NOT open `JourneyTaskActionSheet` with navigation enabled.

**Rationale**: Unsubscribed users should not be able to trigger navigation to task pages (assessment, audio, journal pages) because those pages assume an active enrollment. A preview sheet gives them useful context while funnelling them toward subscription.

**Alternative considered**: Re-use `JourneyTaskActionSheet` with a `readonly` prop. Rejected — the action sheet's callback interface (`onOpen`, `onMarkDone`) is tightly coupled to the subscribed flow; adding a `readonly` prop adds complexity and hidden conditionals.

### 3. Cooldown banner uses server fields directly

**Decision**: Use `progress.currentDay` (not `currentDayIdx + 1`) for the day label in the banner. Use `progress.nextDayUnlocksAt` as-is. Show the banner when `nextDayUnlocksAt` is a future timestamp.

**Rationale**: `currentDay` is the server's authoritative 1-based day counter. `currentDayIdx` is derived from it and is off by design (it's an array index = `currentDay - 1`). Using `currentDay` directly avoids the ±1 confusion.

### 4. Subscribe CTA placement

**Decision**: Keep the existing sticky footer CTA for non-subscribed users. For free journeys label it "Start Free Journey →" and call `subscribeToJourney`. After the call resolves, `mutate(journeyEnrollmentKey(id))` re-fetches the enrollment so `isSubscribed` becomes `true` and the footer disappears naturally.

**Rationale**: `subscribeToJourney` already calls `replaceCache` internally, which calls `globalMutate` with the new enrollment. No extra revalidation logic needed.

## Risks / Trade-offs

- [Risk] Backend auto-enrolls free journeys on GET → `progress` is non-null, `isSubscribed` is always `true`, footer never shows → **Mitigation**: Confirm with backend team whether `journeysControllerGetByJourneyId` auto-enrolls. If yes, a separate "preview" endpoint or a query param is needed — flag to user.
- [Risk] `destinationPath` missing for some task types on older enrollments → navigation silently no-ops → **Mitigation**: `navigateToTask` already guards on this; after fixing `onOpen` the user will see the action sheet stay open (no silent mark-done).
- [Trade-off] `JourneyPreviewSheet` is a new component co-located in `components/journey/`. Adds a file but keeps `JourneyPathView` readable.
