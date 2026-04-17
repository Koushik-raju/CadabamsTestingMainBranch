## ADDED Requirements

### Requirement: Feature-scoped hook directory structure
All hooks SHALL be organized into feature subdirectories under `hooks/`. The flat `hooks/use-*.ts` structure SHALL be replaced.

#### Scenario: Page hooks in feature subdirectory
- **WHEN** a developer looks for the hook serving the assessments page
- **THEN** they find it at `hooks/assessments/use-assessments-page.ts`, not `hooks/use-assessments.ts`

#### Scenario: Shared hooks in shared subdirectory
- **WHEN** a hook is used by two or more pages
- **THEN** it lives under `hooks/shared/[domain]/use-resource.ts` (e.g. `hooks/shared/slots/use-slots.ts`)

### Requirement: One orchestrator hook per page
Each page component SHALL import exactly one hook that exposes all data and mutation functions needed by that page. The orchestrator hook MAY compose multiple resource hooks internally.

#### Scenario: Assessments page uses single hook
- **WHEN** `app/(auth)/assessments/page.tsx` is inspected
- **THEN** it imports one hook (e.g. `useAssessmentsPage`) and destructures all needed data from it

#### Scenario: Appointments page uses single hook
- **WHEN** `app/(auth)/consult/appointments/page.tsx` is inspected
- **THEN** it imports one hook (e.g. `useAppointmentsPage`) that provides both upcoming and past appointments, plus any mutation functions

#### Scenario: Orchestrator composes resource hooks
- **WHEN** an orchestrator hook exceeds ~150 lines or aggregates unrelated resources
- **THEN** it extracts each resource into its own file (e.g. `hooks/dashboard/use-appointments.ts`) and imports + re-exports them from the orchestrator

### Requirement: Hook API shape consistency
Every hook SHALL return `{ data, isLoading, error }` for reads and expose named async mutation functions for writes. No hook SHALL return raw SWR state (`mutate`, `isValidating`) unless explicitly needed by the page.

#### Scenario: Read hook shape
- **WHEN** a hook provides a list of items
- **THEN** it returns `{ items: T[], isLoading: boolean, error: Error | undefined }` (using a domain-appropriate name for `items`)

#### Scenario: Write function on hook
- **WHEN** a page needs to submit data
- **THEN** the hook exposes a named async function (e.g. `submitAssessment`, `bookAppointment`) that calls the SDK and invokes `mutate()` on the relevant SWR key to revalidate

### Requirement: Hook size limit
No single hook file SHALL exceed 150 lines. Files approaching this limit SHALL be split using the orchestrator pattern.

#### Scenario: Oversized hook split
- **WHEN** a hook file reaches 150 lines
- **THEN** it is refactored into an orchestrator file plus one or more resource hooks, each under 150 lines

### Requirement: Shared hooks extracted for reused resources
Any resource hook used by two or more page hooks SHALL be extracted to `hooks/shared/[domain]/use-resource.ts`.

#### Scenario: Slots hook reused
- **WHEN** both the booking page and the checkout page need slot data
- **THEN** a single `hooks/shared/slots/use-slots.ts` hook is created and imported by both page orchestrators

#### Scenario: Auth hook stays shared
- **WHEN** any page or component needs the current user
- **THEN** it imports from `hooks/shared/auth/use-auth.ts` (or equivalent shared location), not a page-specific hook
