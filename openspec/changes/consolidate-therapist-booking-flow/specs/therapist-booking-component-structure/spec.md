## ADDED Requirements

### Requirement: Feature components live under their feature directory
All components used exclusively by a single feature page SHALL reside under `components/[feature-name]/`. No feature-specific component SHALL live in `components/doctor/`, `components/appointment/`, or other non-owning directories.

#### Scenario: DoctorCard is under find-therapist
- **WHEN** a developer imports `DoctorCard`
- **THEN** the canonical path SHALL be `@/components/find-therapist/doctor-card`
- **THEN** no file at `@/components/doctor/doctor-card` SHALL exist

#### Scenario: AppointmentCard is under appointments
- **WHEN** a developer imports `AppointmentCard`
- **THEN** the canonical path SHALL be `@/components/appointments/appointment-card`
- **THEN** no file at `@/components/appointment/appointment-card` SHALL exist

#### Scenario: Booking sub-components are under booking
- **WHEN** a developer needs date strip, slot section, or campus sheet
- **THEN** the canonical paths SHALL be `@/components/booking/date-strip`, `@/components/booking/slot-section`, and `@/components/booking/campus-sheet` respectively

#### Scenario: Checkout sub-components are under checkout
- **WHEN** a developer needs booking summary or payment summary cards
- **THEN** the canonical paths SHALL be `@/components/checkout/booking-summary-card` and `@/components/checkout/payment-summary-card` respectively

### Requirement: Shared navigational primitives live under shared/navigation
Components used across multiple feature areas for navigation purposes SHALL reside under `components/shared/navigation/`.

#### Scenario: BackButton canonical path
- **WHEN** a developer imports `BackButton`
- **THEN** the canonical path SHALL be `@/components/shared/navigation/back-button`
- **THEN** no file at `@/components/common/back-button` SHALL exist

### Requirement: BackButton is present on every booking-flow page
Every page in the therapist booking flow SHALL render a `BackButton` with a correct `fallback` route so users can always navigate back, including when arriving via deep link.

#### Scenario: Find-therapist page has back button to home
- **WHEN** the user is on the find-therapist ListView
- **THEN** a `BackButton` with `fallback="/home"` SHALL be visible in the header

#### Scenario: Booking page has back button to find-therapist
- **WHEN** the user is on the booking slot-selection page
- **THEN** a `BackButton` with `fallback="/find-therapist"` SHALL be visible in the header

#### Scenario: Checkout page has back button
- **WHEN** the user is on the checkout page
- **THEN** a `BackButton` SHALL be visible in the header
- **THEN** pressing it SHALL navigate back to the booking page for the current doctor

#### Scenario: Appointments list page has back button
- **WHEN** the user is on the appointments list page
- **THEN** a `BackButton` with `fallback="/home"` SHALL be visible in the header

#### Scenario: Appointment detail page uses BackButton not raw router.back
- **WHEN** the user is on the appointment detail page
- **THEN** a `BackButton` component with `fallback="/appointments"` SHALL be used in the header
- **THEN** no raw `router.back()` call SHALL serve as the primary back navigation

### Requirement: Component conventions are documented
The `AGENTS.md` and `CLAUDE.md` files SHALL document the component directory conventions established by this change so that future contributors follow them without needing to rediscover the pattern.

#### Scenario: AGENTS.md documents component conventions
- **WHEN** a developer reads `AGENTS.md`
- **THEN** it SHALL describe the `components/[feature]/`, `components/shared/[category]/` conventions
- **THEN** it SHALL list the canonical paths for `BackButton`, `DoctorCard`, and `AppointmentCard` as examples

#### Scenario: CLAUDE.md references AGENTS.md
- **WHEN** a developer reads `CLAUDE.md`
- **THEN** it SHALL reference or include the component conventions from `AGENTS.md`
