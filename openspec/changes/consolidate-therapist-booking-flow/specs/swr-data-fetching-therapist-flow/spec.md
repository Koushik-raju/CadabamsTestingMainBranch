## ADDED Requirements

### Requirement: Booking-flow pages fetch data via SWR hooks
All data fetching in the four booking-flow pages (`find-therapist`, `booking/[doctor_id]`, `checkout`, `appointments` list and detail) SHALL use SWR-backed custom hooks instead of raw `useEffect` + `useState` patterns, enabling automatic caching and stale-while-revalidate behaviour.

#### Scenario: Revisiting appointments page shows cached data instantly
- **WHEN** a user visits `/appointments`, data loads
- **WHEN** the user navigates away and returns to `/appointments`
- **THEN** the previously fetched appointments SHALL render immediately (no full loading spinner)
- **THEN** SWR SHALL revalidate in the background and update if data changed

#### Scenario: Revisiting booking page for same doctor shows cached doctor info
- **WHEN** a user visits `/booking/123` and doctor info loads
- **WHEN** the user navigates to checkout and presses back to `/booking/123`
- **THEN** doctor details SHALL render from cache without a loading state
- **THEN** slot data SHALL be re-fetched (slots are time-sensitive)

#### Scenario: Loading state shown only on first fetch
- **WHEN** a user visits a booking-flow page for the first time (no cache)
- **THEN** the page SHALL show a loading skeleton or spinner
- **WHEN** the same page is visited again within the SWR cache window
- **THEN** no full-page loading spinner SHALL appear

### Requirement: SWR hooks are defined in a dedicated hooks directory
Custom SWR hooks for the booking flow SHALL reside in `hooks/` at the project root with consistent naming and key patterns.

#### Scenario: useDoctor hook exists and is used by booking and checkout pages
- **WHEN** a developer inspects the booking page
- **THEN** doctor data SHALL be fetched via `useDoctor(doctorId)` from `@/hooks/use-doctor`
- **THEN** the hook SHALL return `{ doctor, isLoading, error }`

#### Scenario: useAppointments hook exists and is used by appointments pages
- **WHEN** a developer inspects the appointments list page
- **THEN** appointment data SHALL be fetched via `useAppointments()` from `@/hooks/use-appointments`
- **THEN** the hook SHALL return `{ upcoming, past, isLoading, error }`

#### Scenario: useSlots hook is keyed by doctor and consultation type
- **WHEN** a developer inspects the booking page slot section
- **THEN** slot data SHALL be fetched via `useSlots(doctorId, consultationTypeId)` from `@/hooks/use-slots`
- **THEN** changing `consultationTypeId` (online ↔ in-person toggle) SHALL trigger a new fetch with the new key

#### Scenario: SWR keys are centralised
- **WHEN** a developer searches for SWR cache keys
- **THEN** all key strings SHALL be defined in `@/lib/swr-keys.ts`
- **THEN** no inline string key literals SHALL appear inside hook or page files

### Requirement: SWR is configured to not revalidate on focus in Capacitor shell
Because the app runs inside a Capacitor shell where window focus events fire frequently on mobile, SWR's global `revalidateOnFocus` option SHALL be set to `false`.

#### Scenario: Global SWR config applied via SWRConfig
- **WHEN** the app renders
- **THEN** a `<SWRConfig value={{ revalidateOnFocus: false }}>` wrapper SHALL be present in the root layout or auth layout
- **THEN** individual hooks SHALL NOT need to override this per-call

### Requirement: Error states are surfaced from SWR hooks
When a SWR hook returns an error, the consuming page SHALL render a user-visible error state rather than silently failing.

#### Scenario: Doctor load error on booking page
- **WHEN** `useDoctor` returns an error
- **THEN** the booking page SHALL display an error message with a back navigation option
- **THEN** no empty or partially-rendered UI SHALL be shown

#### Scenario: Appointments load error
- **WHEN** `useAppointments` returns an error
- **THEN** the appointments page SHALL display an inline error message
- **THEN** the page SHALL not crash or show blank content
