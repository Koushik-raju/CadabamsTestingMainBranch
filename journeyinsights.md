# Journey Task System — Engineering Insights

## The Core Data Gap

The V2 SDK returns tasks with **ID arrays** (`assessmentIds`, `audioIds`, `worksheetIds`, etc.), not populated objects. The mapper in `hooks/journeys/use-journeys-page.ts` was hardcoding all the populated arrays as `[]`. Every piece of downstream logic (`getTaskType`, `navigateToTask`, `getIsMandatory`, `getTaskTitle`) was checking `.length > 0` on these always-empty arrays — so every task was falling through to the default type regardless of its actual content.

The fix is to work with ID arrays throughout. Populated arrays (`assessments`, `audios`, etc.) are legacy shapes that the V2 backend never fills. Keep them in the type for backward compatibility but treat the ID arrays as the source of truth.

---

## Task Type Priority (canonical order)

A task should be exactly one type. The priority that makes the most semantic sense:

1. **read** — `extraTaskTitle` AND `extraTaskDescription` both present (text-first content, no media)
2. **assessment** — `assessmentIds` populated
3. **journal/worksheet** — `worksheetIds` populated (redirect to `/worksheet/{id}`)
4. **journal/sub-journaling** — `subJournalingIds` populated (redirect to `/self-journaling/new`)
5. **audio** — `audioIds` populated
6. **moodCheckIn** — boolean flag
7. **book** — `showAppointments` or `showFirstBooking` flag (redirect to find-therapist, NOT appointments)
8. **journal** — `fillSelfJournal` flag, or fallback default

Important: `extraTaskDescription` alone (without `extraTaskTitle`) is NOT a read task. Both fields must be present. A description without a title has no user-facing identity and should not be shown as standalone reading material.

There are no video tasks in this system — the `video` type was a red herring default.

---

## Navigation Rules

Every task type that navigates away must include `?redirectTo=<encoded current page>` so the user can return after completing the sub-task. The current page is always `/journeys/${journeyId}/details`.

| Task type | Destination |
|-----------|-------------|
| read | No navigation — mark as done in-sheet |
| assessment | `/assessments/${assessmentIds[0]}?journey=${journeyId}&redirectTo=...` |
| worksheet | `/worksheet/${worksheetIds[0]}?redirectTo=...` |
| sub-journaling | `/self-journaling/new?redirectTo=...` |
| audio | `/wellness/mindful-minutes/${audioIds[0]}?redirectTo=...` |
| moodCheckIn | `/journeys/mood-check?journey=${journeyId}&redirectTo=...` |
| book | `/consult/find-therapist?redirectTo=...` (NOT `/consult/appointments`) |
| fillSelfJournal / default | `/self-journaling/new?redirectTo=...` |

---

## Action Sheet Behavior by Type

| Type | Primary CTA | Mark as Done button |
|------|-------------|---------------------|
| read | "Mark as Read" (in-sheet, no nav) | No (primary IS the done action) |
| assessment | "Start Assessment" → navigate | No (completion tracked externally) |
| journal | "Write Entry" → navigate | No |
| book | "Book a Session" → navigate | No |
| gift (mood) | "Check In Now" → navigate | No |
| audio | "Listen Now" → navigate | Yes (secondary, active only) |

The `canMarkDone` flag on audio/read exists because the user can complete these without the app being able to confirm it externally. Audio can be marked done without finishing listening. Read tasks are always marked done in-sheet since there is nothing to navigate to.

---

## The Silent Bug Pattern

The most dangerous bugs in this system are **silent** — the button closes the sheet, the XP animation fires, the task marks as done, but no navigation happens. The user thinks the button worked (or did nothing useful). This happens when:

1. `navigateToTask()` falls through all conditions and returns `undefined`
2. The `onOpen` handler in the action sheet always marks the node done AND navigates — if navigation is a no-op, the done state is still written

Always ensure `navigateToTask()` has a fallback. Any new task type added to `getTaskType()` needs a matching branch in `navigateToTask()`.

---

## `extraTaskTitle` and `extraTaskDescription` Quirks

The SDK types both as `{ [key: string]: unknown } | null` — they are opaque objects from the backend's perspective. In practice:

- `extraTaskTitle` is extracted via `extractStringFromObj()` in the mapper
- `extraTaskDescription` is a Strapi blocks array — pass through as-is with `as never` cast and render with `BlocksRenderer`

The `extraTaskDescription` field was not being mapped at all in the original V2 mapper. It was silently dropped. Always verify new fields from the SDK DTO are explicitly mapped — the TypeScript type for `JourneyTask` does not enforce completeness against the DTO shape.

---

## What to Watch When Modifying This System

- **`getTaskType()` and `navigateToTask()` must stay in sync** — add to both when introducing a new task type
- **ID arrays are the source of truth**, not populated arrays — check `xxxIds?.length`, not `xxx?.length`
- **`mapV2Journey()` is the single mapping entry point** — both the list page and detail page use it via `useJourneys` and `useJourneyDetail`. Changes here affect everywhere
- **`getVariant()` controls interactivity** — a task in `locked` state never reaches the action sheet. `active` is the first incomplete task in the current day only. Subsequent tasks in the same day are `default` (tappable but don't auto-mark done on navigate)
- **Mandatory vs optional** — a task is mandatory if it has `assessmentIds`, `audioIds`, or `fillSelfJournal`. All others are optional. This drives the "★ Required" badge in the action sheet
