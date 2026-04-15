## 1. Foundation — SWR Key Registry & Shared Infrastructure

- [x] 1.1 Audit `lib/swr-keys.ts` and add key factory functions for all resources: assessments, assessment-by-id, assigned-assessments, assessment-submissions, journeys, journey-detail, journey-enrollment, appointments, slots, slot-price, campuses, packages, package-by-id, documents, notifications, prescriptions, leaderboard, mindful-minutes, mindful-minute-detail, wellness-resources, wellness-resource-detail, videos, video-detail, self-journaling, self-journaling-entry, auth-me
- [x] 1.2 Create `hooks/shared/auth/use-auth.ts` using `authControllerMe` from `@/sdk/backend-v2` + SWR; replace `hooks/use-auth.ts` import of `getPatientsMe` from `@/sdk/auth-and-crm/sdk.gen`
- [x] 1.3 Create `hooks/shared/campuses/use-campuses.ts` using `mastersControllerGetCampuses` from `@/sdk/backend-v2`; replace `hooks/use-campuses.ts`
- [x] 1.4 Create `hooks/shared/slots/use-slots.ts` using `crmControllerGetSlots` from `@/sdk/backend-v2`; replace `hooks/use-slots.ts`
- [x] 1.5 Create `hooks/shared/slots/use-slot-price.ts` using `crmControllerGetSlotPrice` from `@/sdk/backend-v2`; replace `hooks/use-slot-price.ts`
- [x] 1.6 Update all pages/components importing from the old flat hook paths to import from the new shared hook paths; delete old flat hook files once unused

## 2. Assessments Migration

- [x] 2.1 Create `hooks/assessments/use-assessments-page.ts` — fetch assessment list via `cmsAssessmentsControllerFindAll`; remove Strapi client, `qs`, and `strapiGetAssessments` helper; keep `categorizeAssessments` and `getDynamicCategories` logic
- [x] 2.2 Create `hooks/assessments/use-assessment-detail.ts` — fetch single assessment via `cmsAssessmentsControllerFindOne`; replace `getApiV1AssessmentsById` from `@/sdk/strapi`
- [x] 2.3 Migrate `useAssignedAssessments` — replace Firestore fetch with `patientsControllerGetAssessments` from `@/sdk/backend-v2`
- [x] 2.4 Migrate `useAssessmentSubmissions` — replace Firebase RTDB fetch with `patientAssessmentsControllerListMine`; update `submitAssessment` to use only `patientAssessmentsControllerCreateCompletion` (remove Firebase RTDB write and `backendClient.post`)
- [x] 2.5 Update `app/(auth)/assessments/page.tsx` to import from `hooks/assessments/use-assessments-page.ts`; ensure it reads `params.id` from URL, not context
- [x] 2.6 Update `app/(auth)/assessments/[id]/page.tsx`, `[id]/details/page.tsx`, `[id]/analysis/page.tsx` to use new hooks; use `params.id` as resource identifier
- [x] 2.7 Remove all `AssessmentItem`, `AssignedAssessmentItem`, `AssessmentSubmission`, `AssessmentCategories` custom type definitions; import equivalent types from `@/sdk/backend-v2`
- [x] 2.8 Delete `types/assessment.ts` once no references remain

## 3. Journeys Migration

- [x] 3.1 Create `hooks/journeys/use-journeys-page.ts` — fetch journey list via `cmsJourneysControllerList`; replace `getApiV1Journeys` from `@/sdk/strapi`
- [x] 3.2 Create `hooks/journeys/use-journey-detail.ts` — fetch single journey via `cmsJourneysControllerGetById`
- [x] 3.3 Migrate `useJourneyProgress` — replace Firebase RTDB read with `journeysControllerGetEnrollment` from `@/sdk/backend-v2`
- [x] 3.4 Migrate `subscribeToJourney` — replace Firebase RTDB write with `journeysControllerGetByJourneyId` or equivalent enrollment endpoint
- [x] 3.5 Migrate `advanceCurrentDay` — replace Firebase RTDB write with `journeysControllerCompleteDay`
- [x] 3.6 Migrate `updateNodeProgress` — replace Firebase RTDB write with `journeysControllerCompleteTask`
- [x] 3.7 Update `app/(auth)/journeys/page.tsx`, `[id]/page.tsx`, `[id]/details/page.tsx`, `mood-check/page.tsx` to use new hooks
- [ ] 3.8 Remove `JourneyProgress`, `JourneyItem` custom types; import from `@/sdk/backend-v2`; delete `types/journey.ts`

## 4. Self-Journaling Migration

- [x] 4.1 Create `hooks/self-journaling/use-self-journaling.ts` — list entries via `journalingControllerListMine`; replace any Firebase reads
- [x] 4.2 Create `hooks/self-journaling/use-self-journaling-entry.ts` — fetch single entry via `journalingControllerGetEntry`
- [x] 4.3 Add mutation functions: `createEntry` → `journalingControllerCreateEntry`, `updateEntry` → `journalingControllerUpdateEntry`, `deleteEntry` → `journalingControllerDeleteEntry`
- [x] 4.4 Update `app/(auth)/self-journaling/page.tsx`, `[date]/page.tsx`, `new/page.tsx` to use new hooks
- [x] 4.5 Remove any remaining Firebase imports from self-journaling hooks/pages

## 5. Appointments & Consult Flow Migration

- [x] 5.1 Create `hooks/appointments/use-appointments-page.ts` — fetch upcoming + past via `crmControllerGetAppointmentDashboard` or `crmControllerFetchAppointmentDetails`; replace `getAppointments` + `getAppointmentsPrevious` from `@/sdk/auth-and-crm`
- [x] 5.2 Create `hooks/appointments/use-appointment-detail.ts` — fetch detail by ID via `crmControllerFetchAppointmentDetails`
- [x] 5.3 Create `hooks/consult/use-booking.ts` — orchestrates slots, slot-price, campuses, and booking mutation (`appointmentsControllerBookIndividual`)
- [x] 5.4 Create `hooks/consult/use-checkout.ts` — orchestrates payment + confirmation (`appointmentsControllerConfirm`, `crmControllerRazorpayPayment`)
- [x] 5.5 Update `app/(auth)/consult/appointments/page.tsx` and `[appointment_id]/page.tsx` to use new hooks
- [x] 5.6 Update `app/(auth)/consult/booking/[doctor_id]/page.tsx` and `consult/checkout/page.tsx` to use new hooks; ensure `doctor_id` is read from `params`, not context
- [x] 5.7 Remove `AppointmentDetail` custom type; import from `@/sdk/backend-v2`; delete `types/appointment.ts`
- [x] 5.8 Update `components/booking/*`, `components/checkout/*`, `components/appointments/*` to remove `@/sdk/auth-and-crm` imports

## 6. Packages Migration

- [x] 6.1 Create `hooks/packages/use-packages.ts` — list packages via `crmControllerGetAllPackages`; replace `getPackages` from `@/sdk/auth-and-crm`
- [x] 6.2 Create `hooks/packages/use-package-detail.ts` — fetch single package via `crmControllerGetPackageProductDetails`
- [x] 6.3 Add mutation functions: `bookPackage` → `crmControllerBookPackage`, `initiatePackagePayment` → `crmControllerRazorpayPackagePayment`
- [x] 6.4 Update `app/(auth)/packages/selected-package/page.tsx` direct SDK calls; other pages use re-export shim via `hooks/use-packages.ts`
- [x] 6.5 Remove `PostPackagesBookData`, `PostPaymentsPackageData` imports; `types/package.ts` re-exports from new hook instead of auth-and-crm

## 7. Wellness Content Migration

- [x] 7.1 Create `hooks/wellness/use-mindful-minutes.ts` using `cmsMindfulMinutesControllerFindAll`; replace `getApiV1MindfulMinutes` from `@/sdk/strapi`
- [x] 7.2 Create `hooks/wellness/use-mindful-minute-detail.ts` using `cmsMindfulMinutesControllerFindBySlug`
- [x] 7.3 Create `hooks/wellness/use-videos.ts` and `use-video-detail.ts` using equivalent CMS video controllers from `@/sdk/backend-v2`
- [x] 7.4 Create `hooks/wellness/use-wellness-resources.ts` and `use-wellness-resource-detail.ts` using backend-v2 CMS endpoints
- [x] 7.5 Update `app/(auth)/wellness/mindful-minutes/*`, `wellness/video/*`, `wellness/resources/*` pages to use new hooks
- [x] 7.6 Delete `types/wellness.ts` once no references remain

## 8. Documents, Notifications, Prescriptions, Leaderboard

- [ ] 8.1 Create `hooks/documents/use-documents.ts` using `userDocumentsControllerList`, `userDocumentsControllerPresignUpload`, `userDocumentsControllerUploadComplete`, `userDocumentsControllerDelete`; update `app/(auth)/documents/page.tsx`
- [ ] 8.2 Create `hooks/notifications/use-notifications.ts` using `crmControllerGetNotificationSettings` and `crmControllerEnableNotifications`; replace `notificationService`; update `app/(auth)/notifications/page.tsx`
- [ ] 8.3 Create `hooks/prescriptions/use-prescriptions.ts` using `evaluationsControllerGetPrescriptions`; replace `prescriptionService`; update `app/(auth)/prescriptions/page.tsx`
- [ ] 8.4 Create `hooks/leaderboard/use-leaderboard.ts` using the relevant backend-v2 endpoint (investigate `leaderboard.service.ts` for current endpoint); update `app/(auth)/leaderboard/page.tsx`
- [ ] 8.5 Delete `services/notification.service.ts`, `services/prescription.service.ts`, `services/leaderboard.service.ts` once hooks are in place
- [ ] 8.6 Delete `types/notification.ts`; delete `config/api-endpoints.ts` entries that are now unused

## 9. Home Page & Onboarding

- [ ] 9.1 Create `hooks/home/use-home-page.ts` — orchestrates appointments, packages, journeys for the home screen using new shared hooks
- [ ] 9.2 Update `app/(auth)/home/page.tsx` to import from `hooks/home/use-home-page.ts`; remove direct `@/sdk/auth-and-crm` imports
- [ ] 9.3 Migrate `app/(auth)/onboarding/page.tsx` — replace `crmClient.post(endpoints.SEND_SIGN_UP_QUESTIONS, ...)` with the equivalent `crmControllerCreateLead` or onboarding endpoint from `@/sdk/backend-v2`
- [ ] 9.4 Update `components/home/upcoming-session.tsx` and `components/home/home-header.tsx` to remove any legacy SDK imports

## 10. Component Shared Audit

- [ ] 10.1 Update `components/worksheet/worksheet-card.tsx` — remove `@/services/` import; use `worksheetSubmissionsControllerGetOne` or equivalent directly or via a hook
- [ ] 10.2 Update `components/analytics-initializer.tsx` — replace `@/services/analytics.service.ts` usage with backend-v2 analytics endpoint or remove if covered by hook side-effects
- [ ] 10.3 Audit all components under `components/booking/`, `components/checkout/`, `components/appointments/` for remaining `@/sdk/auth-and-crm` imports and replace with hook-provided props or backend-v2 calls
- [ ] 10.4 Delete `services/analytics.service.ts` and `services/assessment.service.ts` once unused

## 11. Cleanup & Deletion

- [ ] 11.1 Delete `sdk/auth-and-crm/` directory after confirming zero imports remain
- [ ] 11.2 Delete `sdk/strapi/` directory after confirming zero imports remain
- [ ] 11.3 Delete `api/hey-api.auth-and-crm.ts` and `api/strapi.ts`
- [ ] 11.4 Delete `lib/api-client.ts` (crmClient, hosClient, backendClient) after confirming zero imports remain
- [ ] 11.5 Delete `lib/strapi-fetcher.ts` and `lib/fetcher.ts`
- [ ] 11.6 Delete flat `hooks/use-appointments.ts`, `use-slots.ts`, `use-slot-price.ts`, `use-campuses.ts`, `use-auth.ts`, `use-packages.ts`, `use-doctor.ts`, `use-doctor-availability.ts`, `use-journey.ts`, `use-mindful-minutes.ts`, `use-mindful-minute-detail.ts`, `use-videos.ts`, `use-video-detail.ts`, `use-wellness-resources.ts`, `use-wellness-resource-detail.ts`, `use-notifications.ts`, `use-assessments.ts` once their replacements are live
- [ ] 11.7 Remove dead SWR key factories from `lib/swr-keys.ts` (keys referencing Strapi pagination patterns or deleted resources)
- [ ] 11.8 Run `tsc --noEmit` and confirm zero type errors
- [ ] 11.9 Remove `firebase`, `firebase/firestore`, `firebase/database` from `package.json` dependencies if no other files import them (check `lib/firebase/` still needed for auth or other non-hook usage before deleting)
- [ ] 11.10 Remove `qs` from `package.json` if no longer imported anywhere
