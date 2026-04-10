## 1. Fix WizardView Filter Leak Bug

- [x] 1.1 In `components/find-therapist/wizard-view.tsx`, update the "Skip for now" button on the issues step to call `clearIssues()` before `handleNext()`
- [x] 1.2 In `components/find-therapist/wizard-view.tsx`, update the "Skip — no preference" button on the language step to call `clearLanguages()` before `handleNext()`
- [x] 1.3 Manually verify: complete wizard through issues step → skip → select language → skip → confirm ListView shows no active issue or language filter chips

## 2. Reorganise Shared Navigation Component

- [x] 2.1 Create `components/shared/navigation/back-button.tsx` with the same implementation as `components/common/back-button.tsx`
- [x] 2.2 Update all imports of `@/components/common/back-button` across the codebase to `@/components/shared/navigation/back-button`
- [x] 2.3 Delete `components/common/back-button.tsx`
- [x] 2.4 Run `tsc --noEmit` to confirm no broken imports

## 3. Move DoctorCard to Find-Therapist Feature Directory

- [x] 3.1 Copy `components/doctor/doctor-card.tsx` to `components/find-therapist/doctor-card.tsx`
- [x] 3.2 Update all imports of `@/components/doctor/doctor-card` to `@/components/find-therapist/doctor-card`
- [x] 3.3 Audit `components/doctor/filter-sheet.tsx` for any callers outside the find-therapist flow; move or delete as appropriate
- [x] 3.4 Delete `components/doctor/doctor-card.tsx` (and `components/doctor/` if empty)
- [x] 3.5 Run `tsc --noEmit` to confirm no broken imports

## 4. Move AppointmentCard to Appointments Feature Directory

- [x] 4.1 Copy `components/appointment/appointment-card.tsx` to `components/appointments/appointment-card.tsx`
- [x] 4.2 Update all imports of `@/components/appointment/appointment-card` to `@/components/appointments/appointment-card`
- [x] 4.3 Delete `components/appointment/appointment-card.tsx` (and `components/appointment/` if empty)
- [x] 4.4 Run `tsc --noEmit` to confirm no broken imports

## 5. Extract Booking Sub-Components

- [x] 5.1 Create `components/booking/date-strip.tsx` by extracting `DateTile` and the date strip rendering logic from `app/(auth)/booking/[doctor_id]/page.tsx`
- [x] 5.2 Create `components/booking/campus-sheet.tsx` by extracting the campus/sub-campus `Sheet` JSX and its handlers from the booking page
- [x] 5.3 Move/rename `app/(auth)/booking/[doctor_id]/time-slot-picker.tsx` to `components/booking/slot-section.tsx`; update imports in the booking page
- [x] 5.4 Update `app/(auth)/booking/[doctor_id]/page.tsx` to import from the new component paths
- [x] 5.5 Run `tsc --noEmit` to confirm no broken imports

## 6. Extract Checkout Sub-Components

- [x] 6.1 Create `components/checkout/booking-summary-card.tsx` by extracting the doctor + appointment details `Card` from `app/(auth)/checkout/page.tsx`
- [x] 6.2 Create `components/checkout/payment-summary-card.tsx` by extracting the price breakdown `Card` from `app/(auth)/checkout/page.tsx`
- [x] 6.3 Update `app/(auth)/checkout/page.tsx` to import from the new component paths
- [x] 6.4 Run `tsc --noEmit` to confirm no broken imports

## 7. Fix BackButton on Appointment Detail Page

- [x] 7.1 In `app/(auth)/appointments/[appointment_id]/page.tsx`, replace the raw `<button onClick={() => router.back()}>` header button with `<BackButton fallback="/appointments" />`
- [x] 7.2 Import `BackButton` from `@/components/shared/navigation/back-button`
- [x] 7.3 Verify the checkout page `BackButton` fallback points back to the correct booking route (dynamic `doctorId` from `useBooking` context)

## 8. Install SWR and Create Key Constants

- [x] 8.1 Run `npm i swr` if `swr` is not already in `package.json`
- [x] 8.2 Create `lib/swr-keys.ts` defining key factory functions: `doctorKey(id)`, `appointmentsKey()`, `slotsKey(doctorId, consultTypeId)`, `slotPriceKey(slotId)`, `campusesKey()`, `doctorAvailabilityKey(id)`

## 9. Create SWR Hooks

- [x] 9.1 Create `hooks/use-doctor.ts` wrapping `getDoctorsById` with `useSWR`, returning `{ doctor, isLoading, error }`
- [x] 9.2 Create `hooks/use-appointments.ts` wrapping parallel `getAppointments` + `getAppointmentsPrevious`, returning `{ upcoming, past, isLoading, error }`
- [x] 9.3 Create `hooks/use-slots.ts` wrapping `getAppointmentsSlots`, keyed by `doctorId` + `consultationTypeId`, returning `{ slots, isLoading, error }`
- [x] 9.4 Create `hooks/use-slot-price.ts` wrapping `getAppointmentsSlotsBySlotIdPrice`, returning `{ price, isLoading, error }`
- [x] 9.5 Create `hooks/use-campuses.ts` wrapping `getMastersCampuses`, returning `{ campuses, isLoading, error }`
- [x] 9.6 Create `hooks/use-doctor-availability.ts` wrapping `getDoctorsByIdAvailability`, returning `{ availability, isLoading, error }`

## 10. Add Global SWR Config

- [x] 10.1 In `app/(auth)/layout.tsx`, wrap children with `<SWRConfig value={{ revalidateOnFocus: false }}>` to disable focus-triggered refetches in the Capacitor shell

## 11. Migrate Pages to SWR Hooks

- [x] 11.1 Migrate `app/(auth)/appointments/page.tsx`: replace `useEffect`/`useState` fetch logic with `useAppointments()` hook; keep the same rendered UI
- [x] 11.2 Migrate `app/(auth)/appointments/[appointment_id]/page.tsx`: replace the `Promise.all` in `useEffect` with `useAppointments()` (search result by id) + `getAppointmentsMediums` (can stay as one-shot effect since it is not cached)
- [x] 11.3 Migrate `app/(auth)/booking/[doctor_id]/page.tsx`: replace doctor fetch with `useDoctor(doctor_id)`, campuses with `useCampuses()`, availability with `useDoctorAvailability(doctor_id)`, slots with `useSlots(doctor_id, consultTypeId)`
- [x] 11.4 Migrate `app/(auth)/booking/[doctor_id]/page.tsx`: replace slot price `useEffect` with `useSlotPrice(selectedSlot)`
- [x] 11.5 Migrate `app/(auth)/checkout/page.tsx`: replace doctor and price fetches with `useDoctor(doctorId)` and `useSlotPrice(slotId)`
- [x] 11.6 Verify error states are rendered for each hook's error condition on all migrated pages
- [x] 11.7 Run `tsc --noEmit` across all migrated pages

## 12. Update Documentation

- [x] 12.1 Add a "Component Conventions" section to `AGENTS.md` documenting the `components/[feature]/` and `components/shared/[category]/` pattern with canonical path examples for `BackButton`, `DoctorCard`, `AppointmentCard`
- [x] 12.2 Add a "Data Fetching" section to `AGENTS.md` documenting the SWR hook pattern, the `hooks/` directory, and `lib/swr-keys.ts`
- [x] 12.3 Ensure `CLAUDE.md` references or `@`-includes `AGENTS.md` so the conventions appear in both files
