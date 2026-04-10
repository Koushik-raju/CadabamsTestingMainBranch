## Why

Therapist discovery, booking, checkout, and appointment management are functional but suffer from scattered component ownership, broken filter state when skipping wizard steps, and raw `useEffect`-based fetching that causes unnecessary re-fetches and janky loading states. Consolidating the structure, fixing the filter bug, and adopting SWR will make the flow faster, more maintainable, and more consistent.

## What Changes

- **Fix WizardView skip-step filter leak**: "Skip for now" on the issues step and "Skip — no preference" on the language step currently call `handleNext()` without clearing the respective filter state (`issues`, `languages`). After skip, ListView shows stale wizard selections. Fix by calling `clearIssues()` / `clearLanguages()` before advancing.

- **Consolidate component locations**: Move all page-specific components under `components/[page]/` paths and shared navigational primitives under `components/shared/navigation/`. Specifically:
  - `components/doctor/doctor-card.tsx` → `components/find-therapist/doctor-card.tsx`
  - `components/doctor/filter-sheet.tsx` → `components/find-therapist/filter-sheet.tsx` (merge with existing `filter-sheets.tsx`)
  - `components/appointment/appointment-card.tsx` → `components/appointments/appointment-card.tsx`
  - `components/common/back-button.tsx` → `components/shared/navigation/back-button.tsx`
  - New: `components/booking/date-strip.tsx`, `components/booking/slot-section.tsx`, `components/booking/campus-sheet.tsx`
  - New: `components/checkout/booking-summary-card.tsx`, `components/checkout/payment-summary-card.tsx`

- **SWR data fetching**: Replace `useEffect` + `useState` loading patterns in `appointments/page.tsx`, `booking/[doctor_id]/page.tsx`, `checkout/page.tsx`, and `appointments/[appointment_id]/page.tsx` with SWR hooks for caching, background revalidation, and instant cached loads on revisit.

- **Back button presence audit**: Ensure `BackButton` is present and uses the correct `fallback` route on all four pages (find-therapist → /home, booking → /find-therapist, checkout → back to booking, appointments/[id] → /appointments). The detail page currently uses a raw `router.back()` button — replace with `BackButton`.

- **Update AGENTS.md and CLAUDE.md**: Document the new component conventions and SWR fetching patterns so future contributors follow them.

## Capabilities

### New Capabilities
- `find-therapist-filter-fix`: Correct wizard skip-step filter state clearing so filters don't bleed into the list view unexpectedly
- `therapist-booking-component-structure`: Establish canonical component paths for the therapist/booking/checkout/appointments feature area and migrate existing components to those paths
- `swr-data-fetching-therapist-flow`: Replace raw `useEffect` fetches across the four booking-flow pages with SWR-backed hooks, adding caching and stale-while-revalidate behavior

### Modified Capabilities
*(none — no existing spec-level behavior contracts are changing)*

## Impact

- **Files modified**: `components/find-therapist/wizard-view.tsx` (skip handlers), `components/find-therapist/context.tsx` (minor), all four page files in `app/(auth)/` for SWR migration
- **Files moved/created**: `components/find-therapist/doctor-card.tsx`, `components/appointments/appointment-card.tsx`, `components/shared/navigation/back-button.tsx`, `components/booking/` (extracted sub-components), `components/checkout/` (extracted sub-components)
- **Files deleted**: `components/doctor/doctor-card.tsx`, `components/doctor/filter-sheet.tsx`, `components/appointment/appointment-card.tsx`, `components/common/back-button.tsx` (replaced by shared path)
- **Dependencies**: `swr` package (already common in Next.js projects; install if absent)
- **Import path updates**: Any file importing from old component paths needs updating
- **No API changes**, no breaking user-facing behavior changes
