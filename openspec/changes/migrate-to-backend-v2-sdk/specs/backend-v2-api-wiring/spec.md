## ADDED Requirements

### Requirement: All data reads use backend-v2 SDK
Every data fetch in the application (outside of the doctor-cache pipeline and Mastra) SHALL use a function exported from `@/sdk/backend-v2`.

#### Scenario: Appointments fetched via backend-v2
- **WHEN** the appointments page loads
- **THEN** data is fetched via `crmControllerFetchAppointmentDetails` or `appointmentsControllerGetSlotBookings` from `@/sdk/backend-v2`, not `getAppointments` from `@/sdk/auth-and-crm`

#### Scenario: Assessments list fetched via backend-v2
- **WHEN** the assessments page loads
- **THEN** data is fetched via `cmsAssessmentsControllerFindAll` from `@/sdk/backend-v2`, not via the Strapi client or Firebase

#### Scenario: Journey list fetched via backend-v2
- **WHEN** the journeys page loads
- **THEN** data is fetched via `cmsJourneysControllerList` from `@/sdk/backend-v2`, not `getApiV1Journeys` from `@/sdk/strapi`

#### Scenario: Wellness content fetched via backend-v2
- **WHEN** the mindful-minutes, videos, or wellness resources page loads
- **THEN** data is fetched via `cmsMindfulMinutesController*` or equivalent CMS controllers from `@/sdk/backend-v2`

#### Scenario: Patient profile fetched via backend-v2
- **WHEN** the auth hook resolves the current user
- **THEN** the patient profile is fetched via `authControllerMe` from `@/sdk/backend-v2`, not `getPatientsMe` from `@/sdk/auth-and-crm/sdk.gen`

### Requirement: All data mutations use backend-v2 SDK
Every write operation (POST, PUT, PATCH, DELETE) SHALL call a function from `@/sdk/backend-v2`. No direct `axios` instance calls for mutations.

#### Scenario: Assessment submission written via backend-v2
- **WHEN** a user completes an assessment
- **THEN** the submission is saved via `patientAssessmentsControllerCreateCompletion` from `@/sdk/backend-v2`

#### Scenario: Journey progress written via backend-v2
- **WHEN** a user completes a journey task or day
- **THEN** progress is updated via `journeysControllerCompleteTask` or `journeysControllerCompleteDay` from `@/sdk/backend-v2`

#### Scenario: Booking created via backend-v2
- **WHEN** a user books an individual appointment
- **THEN** the booking is created via `appointmentsControllerBookIndividual` from `@/sdk/backend-v2`

### Requirement: Legacy SDKs and clients removed
The codebase SHALL NOT import from `@/sdk/auth-and-crm`, `@/sdk/strapi`, or instantiate axios clients via `@/lib/api-client` in page or hook files after migration completes.

#### Scenario: No auth-and-crm imports remain
- **WHEN** `tsc --noEmit` runs after migration
- **THEN** no file in `app/`, `hooks/`, or `components/` imports from `@/sdk/auth-and-crm`

#### Scenario: No strapi SDK imports remain
- **WHEN** `tsc --noEmit` runs after migration
- **THEN** no file in `app/`, `hooks/`, or `components/` imports from `@/sdk/strapi`

#### Scenario: No Firebase imports remain in client-side hooks
- **WHEN** any hook file is inspected
- **THEN** it does NOT import from `firebase/firestore`, `firebase/database`, or `@/lib/firebase`

### Requirement: SDK types replace custom type definitions
Components, hooks, and pages SHALL use types from `@/sdk/backend-v2` instead of custom type definitions that duplicate SDK shapes. The `types/` directory entries that mirror SDK types SHALL be deleted.

#### Scenario: Appointment type from SDK
- **WHEN** a component renders appointment data
- **THEN** its props type references a type from `@/sdk/backend-v2`, not a local `AppointmentDetail` definition

#### Scenario: Deleted custom type files cause no TS errors
- **WHEN** `types/appointment.ts`, `types/journey.ts`, `types/package.ts`, `types/payment.ts`, `types/user.ts`, `types/notification.ts`, `types/wellness.ts`, `types/worksheet.ts`, `types/assessment.ts` are deleted
- **THEN** `tsc --noEmit` reports zero errors related to those deletions

### Requirement: Services directory removed
The `services/` directory (notification.service.ts, prescription.service.ts, leaderboard.service.ts, analytics.service.ts, assessment.service.ts) SHALL be deleted. Logic moves into page-level or shared hooks.

#### Scenario: Notification data accessed via hook
- **WHEN** the notifications page needs notification data
- **THEN** it calls a hook that uses `crmControllerGetNotificationSettings` or equivalent, not `notificationService.getNotifications`

#### Scenario: Prescription data accessed via hook
- **WHEN** the prescriptions page loads
- **THEN** it calls a hook that uses `evaluationsControllerGetPrescriptions` or `crmControllerGetConsultationHistory`, not `prescriptionService.fetchPrescriptions`

### Requirement: URL path params used for resource identification
Pages that display a specific resource SHALL use the Next.js dynamic route segment (`params.id`) as the identifier passed to hooks, not React context or router query state.

#### Scenario: Assessment detail uses path param
- **WHEN** the user navigates to `/assessments/[id]`
- **THEN** the page reads `params.id` and passes it to `useAssessmentById(params.id)`, not from a context value

#### Scenario: Journey detail uses path param
- **WHEN** the user navigates to `/journeys/[id]`
- **THEN** the page reads `params.id` and passes it to `useJourneyDetail(params.id)`, not from a context value
