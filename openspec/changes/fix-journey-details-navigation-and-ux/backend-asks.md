# Backend Asks — fix-journey-details-navigation-and-ux

## Status

| Item | Status | Notes |
|---|---|---|
| `?preview=true` on GET /journeys/:journeyId | ✅ **Done** | Added `GetJourneyByIdQueryDto`; service skips auto-enroll when `preview=true` |
| `destinationPath` on every task type | Needs confirmation | See §4 |
| `nextDayUnlocksAt` / `currentDay` contract | Needs confirmation | See §5 |
| Day summary endpoint | ✅ **Already exists** | `GET /me/journeys/enrollments/:id/day-summary?day=N` returns `DaySummaryResponseDto` |
| Auto-mark on task type completion | Needs confirmation | See §3 |
| `premiumUnlockPackageId` on enrollment | Not yet done | See §2 |

---

## 1. `?preview=true` on `GET /api/v1/me/journeys/{journeyId}` — DONE

Added in backend-v2. When `preview=true`:
- Returns 404 (caught as `null` in frontend) if the user has no enrollment.
- Does NOT create a new enrollment for free journeys.
- Still returns the full `PatientJourneyResponseDto` when the user is already enrolled.

Frontend always passes `preview: true` now. Enrollment only happens through the explicit `POST /me/journeys/enrollments` (`subscribeToJourney`).

**SDK**: `JourneysControllerGetByJourneyIdData.query` is now `{ preview?: boolean }`. Regenerate SDK after backend is deployed.

---

## 2. `premiumUnlockPackageId` on `PatientJourneyResponseDto`

**Ask**: Add `premiumUnlockPackageId?: string` to `PatientJourneyResponseDto` (and the underlying `JourneyEnrollment`/`CmsJourney` — whichever owns it).

**Why**: The session gate in `journey-path-view.tsx` needs to redirect free-preview users tapping "Book a Session" nodes to the specific package page `/packages/{id}` rather than the generic `/packages` list.

**Current fallback**: When `progress.premiumUnlockPackageId` is absent, the code falls back to `router.push('/packages')`. This is acceptable for now.

---

## 3. Auto-mark on task type completion

**Ask**: Confirm which task types the backend marks `completed` automatically (i.e., when the user completes the task in its own page, the enrollment is updated without the frontend calling `completeTask`):

- `ASSESSMENT` — does submitting an assessment mark the journey task completed?
- `AUDIO` — does a ≥90% listen-through mark it completed?
- `JOURNAL` / `SUB_JOURNAL` — does saving an entry mark it completed?
- `MOOD` — does submitting the mood check-in mark it completed?
- `CONSULT_BOOKING` / `APPOINTMENT` — does confirming a booking mark it completed?

**Frontend behaviour**: On return from a task page, `globalMutate(journeyEnrollmentKey(id))` is called to re-fetch. If the task was auto-marked server-side, it will appear completed without any additional call. If not, the user must tap "Mark as Done" explicitly.

---

## 4. `destinationPath` on `EnrollmentTaskDto`

**Ask**: Confirm that `destinationPath` is populated for every `JourneyTaskKind`. Current `task-destination.ts` mapping:

| Kind | Path |
|---|---|
| ASSESSMENT | `/assessments/{assessmentId}` |
| WORKSHEET | `/worksheets/{worksheetId}` |
| AUDIO | `/wellness/mindful-minutes/{audioId}` |
| VIDEO | `/videos/{videoId}` |
| JOURNAL | `/self-journaling/new` |
| SUB_JOURNAL | `/self-journaling/{subJournalingId}` |
| MOOD | `/journeys/mood-check` |
| APPOINTMENT | `/appointments` |
| CONSULT_BOOKING | `/consult/find-therapist` |
| OTHER | `/journey` (fallback) |

If `destinationPath` is `null`/`undefined`, the frontend shows a toast "This task isn't available yet" and does not navigate.

---

## 5. `nextDayUnlocksAt` and `currentDay` contract

**Ask**: Confirm:
- `nextDayUnlocksAt` is a UTC ISO-8601 string, populated whenever the current day is complete and the next day has not yet unlocked.
- `currentDay` is 1-indexed and updates on the next `tick()` call after `nextDayUnlocksAt` elapses.
- Both fields are `null` once the journey is fully completed.
