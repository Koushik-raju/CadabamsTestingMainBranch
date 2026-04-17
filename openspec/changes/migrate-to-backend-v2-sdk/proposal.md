## Why

The codebase currently makes API calls through three separate legacy layers — `@/sdk/auth-and-crm`, `@/sdk/strapi`, and raw `axios` clients (`crmClient`, `hosClient`, `backendClient`) in `lib/api-client.ts` — plus Firebase (Firestore + RTDB) for assessments, journeys, journaling, and self-journaling data. A unified `@/sdk/backend-v2` SDK now covers all of these domains with generated, type-safe methods. This migration removes the fragmentation, eliminates custom type definitions that duplicate SDK types, and enforces a consistent hook-per-page architecture with SWR for all reads.

## What Changes

- **Replace `@/sdk/auth-and-crm` calls** in hooks and components with equivalent `@/sdk/backend-v2` functions (appointments, slots, slot-price, campuses, packages, doctor availability, auth/me).
- **Replace `@/sdk/strapi` calls** in hooks with `@/sdk/backend-v2` CMS controller functions (assessments, journeys, mindful-minutes, videos, wellness resources, worksheets, self-journaling).
- **Replace Firebase (Firestore + RTDB)** reads and writes for assessments (submissions, assigned assessments), journey progress, and self-journaling with backend-v2 controller endpoints (`patientAssessmentsController*`, `journeysController*`, `journalingController*`).
- **Replace `crmClient` / `hosClient` / `backendClient`** calls in services and page components with backend-v2 SDK methods (notifications, prescriptions, leaderboard, onboarding, documents).
- **Delete `@/sdk/auth-and-crm`**, `@/sdk/strapi`, `api/hey-api.auth-and-crm.ts`, `api/strapi.ts`, `lib/api-client.ts`, `lib/strapi-fetcher.ts`, `lib/fetcher.ts` once all consumers are migrated.
- **Delete `services/`** directory (notification, prescription, leaderboard, analytics, assessment services) — logic moves into page hooks.
- **Delete `types/`** directory entries that duplicate SDK types (`appointment.ts`, `journey.ts`, `package.ts`, `payment.ts`, `user.ts`, `notification.ts`, `wellness.ts`, `worksheet.ts`, `assessment.ts`) — import from `@/sdk/backend-v2` instead.
- **Reorganize hooks** from flat `hooks/use-*.ts` into feature subdirectories (`hooks/[page]/use-page.ts`, `hooks/shared/[use]/use-resource.ts`).
- **Add `lib/swr-keys.ts` entries** for all new resource keys; remove dead keys.
- **Migrate URL structure**: use path params (e.g. `/assessments/:id`) instead of query/context passing where possible.
- **No UI changes** — zero component visual changes, layout changes, or UX changes.

## Capabilities

### New Capabilities
- `backend-v2-api-wiring`: All data operations route through `@/sdk/backend-v2` — appointments, assessments, journeys, journaling, documents, notifications, prescriptions, packages, wellness content, leaderboard, onboarding, auth.
- `hook-architecture`: Hooks reorganized into `hooks/[page]/use-page.ts` pattern (one orchestrator per page, shared resource hooks extracted when reused across ≥2 pages).
- `swr-key-registry`: Central `lib/swr-keys.ts` with a named key factory for every resource used across hooks.

### Modified Capabilities
<!-- No existing spec-level behavior changes — this is purely an implementation wiring refactor. -->

## Impact

- **Files deleted**: `sdk/auth-and-crm/`, `sdk/strapi/`, `api/hey-api.auth-and-crm.ts`, `api/strapi.ts`, `lib/api-client.ts`, `lib/strapi-fetcher.ts`, `lib/fetcher.ts`, `services/` (5 service files), duplicate type files in `types/`.
- **Files restructured**: All 23 hooks in `hooks/` reorganized into feature subdirectories; affected app pages updated to import from new hook paths.
- **Dependency removal**: `firebase`, `firebase/firestore`, `firebase/database` no longer imported by hooks/pages (Firebase entirely removed from client bundle once journeys + assessments + journaling migrate); `qs` library dependency from assessments hook can be dropped.
- **Exceptions untouched**: `hooks/use-doctors.ts` (cached doctor data, keep as-is), `lib/mastra-client.ts` and any Mastra-related hooks.
- **App routes**: No route changes. URL path params preferred over context/query where currently using neither (e.g. assessment detail page already uses `[id]`, ensure hooks use it directly).
