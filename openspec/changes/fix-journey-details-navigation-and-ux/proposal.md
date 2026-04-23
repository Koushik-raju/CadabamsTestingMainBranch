## Why

The journey details page has several broken UX flows: tapping a task node silently marks it done instead of navigating to the task, the cooldown countdown timer is absent, unsubscribed users on free journeys have no subscribe CTA, and the node-tap preview logic for unsubscribed users allows unintended actions. These regressions reduce the utility of the entire journey feature.

## What Changes

- **Fix task navigation**: Tapping an active/available/completed node must navigate to the task's `destinationPath` (via `router.push`); it must NOT call `updateNodeProgress` on tap — only explicit "Mark as Done" should trigger that.
- **Fix cooldown countdown**: Show the `nextDayUnlocksAt` countdown timer banner correctly, including the correct current-day label and tasks-done fraction.
- **Subscribe CTA for free journeys**: When `progress` is `null` and the journey is not premium, show a "Start Free Journey" button that calls `subscribeToJourney`; do not show this for premium journeys (those redirect to `/packages`).
- **Preview-only mode for unsubscribed users**: When not subscribed, node taps must open a bottom sheet that shows the task description only — no navigation, no mark-done. The sheet's sole CTA is "Subscribe to Start" (free) or "View Plans" (premium).
- **Remove duplicate issue #4** (same as #2 in user report — single subscribe-CTA fix covers both).

## Capabilities

### New Capabilities

- `journey-task-navigation`: Correct separation of "navigate to task" vs "mark as done" on node tap, with proper `destinationPath` routing.
- `journey-subscribe-cta`: Subscribe button shown to unsubscribed users on free journeys; premium journeys show "View Plans" instead.
- `journey-preview-sheet`: Read-only bottom sheet for unsubscribed users that previews task info without allowing any progress-mutating action.
- `journey-cooldown-banner`: Accurate countdown banner driven by `nextDayUnlocksAt`, with correct day label and tasks-done fraction display.
- `journey-day-summary`: End-of-day summary bottom sheet, with backend-generated summary text and graceful static fallback.
- `journey-auto-scroll`: Path auto-scrolls to the current day's first non-completed node on mount, with animation; "Continue" button triggers the same.
- `journey-return-verification`: On return from a task page, server is re-queried to reconcile completion state; UI never optimistically marks tasks done.
- `journey-session-gate`: Book-session tasks inside premium journeys are gated; free-preview users tapping them are redirected to the specific package that contains this journey, not the generic `/packages` list.

### Modified Capabilities

## Impact

- `components/journey/journey-path-view.tsx` — navigation logic, subscribe CTA, cooldown banner, node-tap handler
- `components/journey/journey-task-action-sheet.tsx` — no mark-done path when called from unsubscribed preview
- `hooks/journeys/use-journey-detail.ts` — verify `subscribeToJourney` is exported and revalidates SWR cache
