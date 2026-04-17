## Context

The app currently uses three co-existing API layers:

| Layer | Used by | Status |
|---|---|---|
| `@/sdk/auth-and-crm` (hey-api generated) | hooks: appointments, slots, slot-price, campuses, packages, doctor, doctor-availability, auth | Legacy — superseded |
| `@/sdk/strapi` (hey-api generated) | hooks: assessments, journeys, mindful-minutes, wellness-resources, videos | Legacy — superseded |
| `lib/api-client.ts` (`crmClient`, `hosClient`, `backendClient`) | services/, onboarding page | Legacy — superseded |
| Firebase Firestore + RTDB | assessments (submissions + assignments), journeys (progress), self-journaling | Legacy — superseded |
| `@/sdk/backend-v2` (hey-api generated) | assessments page (partial) | **Target SDK** |

All hooks live in a flat `hooks/` directory. Custom type definitions in `types/` duplicate SDK types. Service objects in `services/` wrap `axios` clients with no benefit over SDK calls.

The new `@/sdk/backend-v2` SDK (2558-line generated file) covers all domains currently served by the legacy layers. The `api/backend-v2.ts` client config shows the single base URL is `https://auth.cadabams.com/api/v1`.

## Goals / Non-Goals

**Goals:**
- All data reads use SWR + `@/sdk/backend-v2` methods exclusively.
- All data mutations call `@/sdk/backend-v2` methods directly from hooks.
- Hooks reorganized into `hooks/[page]/` and `hooks/shared/` subdirectories.
- Central SWR key registry in `lib/swr-keys.ts` covers all hooks.
- Legacy SDKs, services, and duplicate type files deleted.
- No Firebase imports remain in client-side code (except any server-only scripts).
- URL path params used for resource identification (e.g. `assessments/:id`, `journeys/:id`) instead of passing IDs via query or React context where avoidable.

**Non-Goals:**
- No UI or UX changes.
- No changes to `hooks/use-doctors.ts` (cached doctor data — separate pipeline).
- No changes to `lib/mastra-client.ts` or any Mastra-related hooks/pages.
- No changes to `app/api/` Next.js route handlers (server-side only, separate concern).
- No changes to Zego video room logic.
- No changes to Capacitor/device hooks.

## Decisions

### D1 — Single SDK, single axios instance
**Decision**: All calls go through `@/sdk/backend-v2` configured with `api/backend-v2.ts`. No new axios instances introduced.  
**Rationale**: The SDK's `createClientConfig` already handles auth token injection and refresh interceptor. Bypassing it via raw axios loses token refresh.  
**Alternative rejected**: Keeping `lib/api-client.ts` for "convenience" — creates two authentication paths, defeats the migration.

### D2 — Hook-per-page with orchestrator pattern
**Decision**: Each page gets one primary hook (e.g. `hooks/assessments/use-assessments-page.ts`). Shared resource hooks extracted to `hooks/shared/[domain]/use-resource.ts` only when ≥2 pages need the same resource.  
**Rationale**: Keeps pages thin; avoids over-abstracting resources that are only used once.  
**Alternative rejected**: One hook per SDK resource regardless of reuse — creates 30+ hooks where many are used in exactly one place.

### D3 — Firebase removal via backend-v2 equivalents
**Decision**: Migrate Firebase reads/writes to backend-v2 controllers:
- Assessment submissions → `patientAssessmentsControllerCreateCompletion` / `patientAssessmentsControllerListMine`
- Assigned assessments → `patientsControllerGetAssessments`
- Journey progress → `journeysControllerGetEnrollment` / `journeysControllerCompleteTask` / `journeysControllerCompleteDay`
- Self-journaling → `journalingController*` / `cmsJournalingController*`

**Rationale**: Centralizes all state in one backend, removes Firebase bundle (~100KB gzipped), simplifies auth (no separate Firebase tokens).  
**Risk**: Firebase RTDB was the source of truth for journey progress — must verify backend-v2 journey endpoints are live and returning correct data before cutover.

### D4 — Delete, don't shim
**Decision**: Once all consumers of a legacy import are migrated, delete the source file immediately. No re-export shims or backwards-compat layers.  
**Rationale**: Shims create confusion about which layer is authoritative and delay cleanup indefinitely.

### D5 — SWR key registry
**Decision**: All SWR cache keys defined as named factory functions in `lib/swr-keys.ts`. Hooks import keys from there; no inline string arrays.  
**Rationale**: Enables cache invalidation from any hook/component without coupling to string literals.

### D6 — URL path params over context
**Decision**: Where a page navigates to a resource detail (e.g. `/assessments/[id]`, `/journeys/[id]`), the page component reads `params.id` from the URL and passes to the hook. No React context used as a transport mechanism for IDs.  
**Rationale**: Deep-links work, back/forward works, no stale context state. Current patterns that pass IDs through router `query` or React context should be replaced with dynamic route segments.

### D7 — Migration order (page-by-page, feature-complete per page)
**Decision**: Migrate one feature area at a time in this order:
1. Auth/Me (hook + app route — used by everything)
2. Assessments (Firebase + Strapi — most complex)
3. Journeys (Firebase + Strapi)
4. Self-Journaling (Firebase)
5. Appointments / Consult / Booking / Checkout / Packages
6. Wellness (Mindful Minutes, Resources, Videos)
7. Documents / Prescriptions / Notifications / Leaderboard
8. Home page (aggregator — depends on earlier hooks)
9. Onboarding

Each step: migrate hook → update page import → delete legacy file.

## Risks / Trade-offs

**[Firebase offline cache]** Firebase RTDB provides offline-first behavior for journey progress via its SDK cache. `backend-v2` calls are online-only.  
→ Mitigation: Acceptable for an outpatient consult app. SWR's `revalidateOnReconnect` covers reconnect revalidation. Note in code comments.

**[Assessment submissions data loss]** Existing Firebase RTDB submissions won't be visible via `patientAssessmentsControllerListMine` unless the backend has migrated that data.  
→ Mitigation: Check with backend team whether a data migration has run. Until confirmed, the `useAssessmentSubmissions` hook stays on Firebase read path (soft transition). Submission writes go to backend-v2 only.

**[Strapi CMS fields vs backend-v2 CMS fields]** Backend-v2 CMS controllers may return slightly different field names than the Strapi SDK types. Custom mapping functions (`mapStrapiAssessment`, etc.) may need updates.  
→ Mitigation: Audit response shapes for each CMS entity against `sdk/backend-v2/types.gen.ts` during migration. Update mapping or remove if fields align directly.

**[qs library usage in assessments]** The assessments hook manually builds Strapi query strings with `qs`. Backend-v2 uses structured query params via SDK types.  
→ Mitigation: Replace with `cmsAssessmentsControllerFindAll` query parameters. Delete `qs` import.

**[services/ callers in non-hook files]** `components/analytics-initializer.tsx` and `components/worksheet/worksheet-card.tsx` import from `@/services/`. These must be updated before services are deleted.  
→ Mitigation: Covered in the migration checklist under "component audit" for each page.

## Migration Plan

1. **Audit**: For each page, list all legacy imports (SDK, Firebase, services, types).
2. **Hook**: Create `hooks/[page]/use-[page].ts` using backend-v2 SDK + SWR.
3. **Update**: Replace page imports to use new hook. Remove legacy imports from page file.
4. **Component sweep**: Update any components used only by that page that still have legacy imports.
5. **Delete**: Once a legacy file has zero imports, delete it.
6. **Verify**: Run `tsc --noEmit` and check for broken imports after each feature area.

**Rollback**: Git revert per feature area. No database changes involved — purely frontend wiring.

## Open Questions

1. Are `patientAssessmentsControllerListMine` and `journeysControllerGetEnrollment` endpoints live and returning data in production?
2. Has the Firebase → backend RTDB data migration for assessments and journeys been completed?
3. Should `evaluationsControllerGetPrescriptions` replace `prescriptionService.fetchPrescriptions`, or does the prescription flow use a different endpoint?
4. Is the `hosClient` (HOS = Hospital Operations System) for medicine line items covered by any backend-v2 endpoint, or does it stay as a direct call?
