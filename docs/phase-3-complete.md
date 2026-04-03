# Phase 3 — Appointments & Booking

## Summary
Phase 3 migrates the appointment, therapist-finder, booking, and checkout flows from JavaScript/NextUI to TypeScript/shadcn/ui.

## Routes Built

| Route | Type | Description |
|---|---|---|
| `/appointments` | `(auth)` Static | Tabbed list of upcoming and past appointments with cancel dialog |
| `/find-therapist` | `(public)` Static | Multi-step wizard to filter and find matched therapists |
| `/booking` | `(public)` Dynamic (Suspense) | Doctor info + calendar date picker + time slot grid |
| `/checkout` | `(public)` Dynamic (Suspense) | Booking summary + Razorpay web + Capacitor native payment |

## Components Created

| Component | Location | Description |
|---|---|---|
| `AppointmentCard` | `components/appointment/appointment-card.tsx` | Single appointment card with status badge and cancel dialog |
| `DoctorCard` | `components/doctor/doctor-card.tsx` | Doctor card with speciality, rating, tags, languages, mode |
| `FilterSheet` | `components/doctor/filter-sheet.tsx` | shadcn Sheet-based bottom filter for specialty, language, mode |
| `TimeSlotPicker` | `components/booking/time-slot-picker.tsx` | Accessible grid of available time slots |

## Loading States
- `app/(auth)/appointments/loading.tsx` — skeleton for appointments list
- `app/(public)/find-therapist/loading.tsx` — skeleton for therapist finder

## Key Patterns Used

### Appointments
- `useAppointments()` SWR hook with `useAuth()` for `lead_id`
- Tab split (upcoming/past) by comparing `appointment_date` to today
- Cancel via `appointmentService.cancelAppointment()` + SWR `mutate()`

### Find Therapist
- 6-step guided wizard (profession → issues → mode → location → language → results)
- Inline constants (profession options, issues, cities, centers, languages) mirroring `existing-app/constants/findTherapist.js`
- `doctorService.getDoctors()` with filters; parallel fetch for "not sure" profession
- Navigates to `/booking?id=...&name=...&speciality=...&mode=...&campus_id=...`

### Booking
- URL params for doctor identity (id, name, speciality, mode, campus_id, sub_campus_id)
- shadcn `Calendar` for date selection
- `appointmentService.getTimeSlots()` on date change
- `appointmentService.getSlotPrice()` for price display
- On confirm → `appointmentService.bookAppointment()` → navigate to `/checkout`

### Checkout
- URL params for all booking context (id, name, speciality, selectedTimeSlot, price, date, campusId)
- `paymentService.createRazorpayOrder()` to get order
- Web: `window.Razorpay` instantiation
- Native (Capacitor): dynamic import via `new Function('s','return import(s)')` to avoid bundler resolution errors
- Success state → auto-redirect to `/appointments`

## Rules Compliance
- All colors via CSS variables (`text-primary`, `bg-card`, `text-muted-foreground`, etc.)
- All icons from `lucide-react`
- All interactive elements use shadcn `Button`, `Card`, `Tabs`, `AlertDialog`, `Sheet`, `Calendar`, `Avatar`
- No NextUI, no hardcoded hex values
- TypeScript strict — no `any`, all `unknown` casts explicit
- `pnpm tsc --noEmit` passes (no new errors)
- `pnpm build` passes — all 4 routes emit successfully
