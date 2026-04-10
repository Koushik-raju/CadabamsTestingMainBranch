## Context

The therapist booking flow spans four pages (`find-therapist`, `booking/[doctor_id]`, `checkout`, `appointments`) backed by a shared React context (`FindTherapistContext`). Components are split across three separate `components/` directories (`doctor/`, `appointment/`, `common/`) with no clear ownership per feature area.

**Current state issues:**
1. `WizardView` skip buttons (`Skip for now` on issues, `Skip — no preference` on language) call `handleNext()` without first clearing the respective state slice. When the ListView renders after wizard completion, it reads stale `issues`/`languages` from context and silently filters the doctor list — users see fewer results without knowing why.
2. `DoctorCard` lives in `components/doctor/` even though it is exclusively used in the find-therapist flow. `AppointmentCard` lives in `components/appointment/`. `BackButton` lives in `components/common/` but is a shared navigational primitive.
3. All four pages fetch data with raw `useEffect` + `useState`. There is no caching; navigating away and back always triggers a full re-fetch and a loading spinner.

**Constraints:**
- Mobile-first PWA / Capacitor shell; perceived performance on slow connections matters.
- `swr` is the standard data-fetching library for Next.js projects and fits naturally here (no GraphQL, REST-only).
- Import paths must stay within the `@/` alias root.

---

## Goals / Non-Goals

**Goals:**
- Fix the filter leak bug so skip always leaves filters clean.
- Establish a consistent `components/[feature]/` + `components/shared/[category]/` convention for this feature area.
- Replace all `useEffect`-driven fetches in the four pages with SWR hooks (caching + stale-while-revalidate).
- Ensure `BackButton` with correct `fallback` is present on every page in the flow.
- Document the conventions in `AGENTS.md` / `CLAUDE.md`.

**Non-Goals:**
- Rewriting the API layer or SDK.
- Adding new user-visible features beyond the back button.
- Migrating unrelated pages to SWR.
- Server Components / RSC refactor (pages remain `'use client'`).

---

## Decisions

### D1 — Fix skip by calling clear* before handleNext

**Decision**: In `WizardView`, replace bare `onClick={handleNext}` on skip buttons with inline handlers: `() => { clearIssues(); handleNext(); }` (issues) and `() => { clearLanguages(); handleNext(); }` (language).

**Why**: The context already exposes `clearIssues` and `clearLanguages`. This is a one-line fix per button with zero side effects. No need to modify `handleNext` internals or add new context methods.

**Alternative considered**: Clear inside `handleNext` when step is issues/language. Rejected — `handleNext` is also called by the "Continue" button, which should preserve selections.

---

### D2 — Component directory layout

**Decision**: Adopt the following canonical paths:

```
components/
  find-therapist/
    context.tsx            (existing)
    wizard-view.tsx        (existing)
    list-view.tsx          (existing)
    filter-sheets.tsx      (existing)
    doctor-card.tsx        ← moved from components/doctor/doctor-card.tsx
  booking/
    date-strip.tsx         ← extracted from booking/[doctor_id]/page.tsx
    slot-section.tsx       ← extracted / moved from time-slot-picker.tsx
    campus-sheet.tsx       ← extracted from booking/[doctor_id]/page.tsx
  checkout/
    booking-summary-card.tsx  ← extracted from checkout/page.tsx
    payment-summary-card.tsx  ← extracted from checkout/page.tsx
  appointments/
    appointment-card.tsx   ← moved from components/appointment/appointment-card.tsx
  shared/
    navigation/
      back-button.tsx      ← moved from components/common/back-button.tsx
```

Old locations (`components/doctor/`, `components/appointment/`, `components/common/back-button.tsx`) are deleted after import paths are updated.

**Why**: Co-locating components with their feature page makes ownership obvious. Shared navigational primitives get their own `shared/navigation/` bucket rather than the catch-all `common/`.

**Alternative considered**: Flat `components/` without subdirectory reorganisation — rejected because it was the source of the confusion in the first place.

---

### D3 — SWR data fetching strategy

**Decision**: Create a thin `hooks/` layer of SWR hooks that wrap the existing SDK calls:

| Hook | Key | SDK call(s) |
|------|-----|-------------|
| `useDoctor(id)` | `/doctors/${id}` | `getDoctorsById` |
| `useAppointments()` | `/appointments` | `getAppointments` + `getAppointmentsPrevious` |
| `useAppointmentDetail(id)` | `/appointments/${id}` | searches result of `useAppointments` |
| `useSlots(doctorId, consultTypeId)` | `/slots/${doctorId}/${consultTypeId}` | `getAppointmentsSlots` |
| `useSlotPrice(slotId)` | `/slot-price/${slotId}` | `getAppointmentsSlotsBySlotIdPrice` |
| `useCampuses()` | `/campuses` | `getMastersCampuses` |
| `useDoctorAvailability(id)` | `/doctor-availability/${id}` | `getDoctorsByIdAvailability` |

Each hook returns `{ data, isLoading, error }`. Pages destructure from hooks instead of managing local state + effects. SWR `revalidateOnFocus: false` globally to avoid spurious refetches in the Capacitor shell.

**Why SWR over React Query**: SWR is lighter, already idiomatic in Vercel/Next.js apps, and sufficient for simple GET caching here. No mutations need cache invalidation (booking is a fire-and-navigate flow).

**Alternative considered**: Server Components with `fetch` caching — rejected because pages need auth tokens at runtime and are inside `(auth)` group with client-only auth context.

---

### D4 — Back button consistency

**Decision**: Every page in the flow uses `<BackButton fallback="…" />` from `components/shared/navigation/back-button.tsx`:

| Page | fallback |
|------|---------|
| `find-therapist` | `/home` |
| `booking/[doctor_id]` | `/find-therapist` |
| `checkout` | `/booking/${doctorId}` (dynamic) |
| `appointments` | `/home` |
| `appointments/[id]` | `/appointments` |

The detail page currently renders a raw `<button onClick={() => router.back()}>` — replace with `<BackButton fallback="/appointments" />`.

---

## Risks / Trade-offs

- **Import churn**: Moving ~4 component files requires updating every importer. Risk of missed import → `[Risk] build error at deploy time` → Mitigation: run `tsc --noEmit` as part of implementation verification.
- **SWR deduplication**: `useAppointments` is used by both the list page and the detail page (which searches the list). If SWR keys match, the detail page gets a free cache hit. If keys diverge, it re-fetches. → Mitigation: centralise key strings in a `lib/swr-keys.ts` constants file.
- **Skip-clear UX**: Clearing issues/languages on skip is the correct fix, but if a user accidentally taps "skip" they lose their selections with no undo. → Acceptable trade-off; the alternative (stale filter bleed) is objectively worse.
- **`components/doctor/filter-sheet.tsx`** exists alongside `components/find-therapist/filter-sheets.tsx` — they appear to be two separate files. The former (`filter-sheet.tsx` singular) should be audited before deletion to ensure it has no other callers.

---

## Migration Plan

1. Fix wizard skip bug (surgical, isolated, no structural changes).
2. Move `BackButton` to shared path; update all imports; verify build.
3. Move `DoctorCard` and `AppointmentCard`; update imports; verify build.
4. Extract booking sub-components; update booking page import; verify build.
5. Extract checkout sub-components; update checkout page import; verify build.
6. Install SWR if absent (`npm i swr`). Create `hooks/` layer. Migrate pages one at a time, verifying each before moving to the next.
7. Update `AGENTS.md` and `CLAUDE.md` with conventions.

Rollback: every step is a file-move or code edit in a local branch. Git revert is sufficient.

---

## Open Questions

- Does `components/doctor/filter-sheet.tsx` (singular) have any callers outside the find-therapist flow? If yes, it should move alongside `filter-sheets.tsx` rather than be deleted.
- Should `useAppointments` split upcoming/previous into two SWR keys or combine them under one key with a fetcher that calls both in parallel? (Recommendation: one key, parallel fetcher — matches current `Promise.all` pattern.)
