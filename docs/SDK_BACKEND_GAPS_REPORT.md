<!--
FILE: docs/SDK_BACKEND_GAPS_REPORT.md

PURPOSE:
  Backend / SDK gap inventory. Lists changes the backend team needs to make
  to the OpenAPI spec (and therefore the regenerated SDK) so the frontend
  can stop working around missing endpoints, missing fields, and overly
  generic DTO shapes.

LOGIC OVERVIEW:
  Each entry follows: Current SDK state → Frontend workaround → Required
  backend change. Citations point at the live SDK files in
  `sdk/backend-v2/{sdk.gen.ts, types.gen.ts}` and the frontend files that
  contain the workaround. A prioritised checklist closes the report.

LAST UPDATED: 2026-04-17 — added concrete endpoint paths from sdk.gen.ts.
-->

# SDK / Backend Gap Report

**Date:** 2026-04-17
**Audience:** Backend team (OpenAPI spec owners) and SDK regeneration owner
**Scope:** Things the **backend** must change. Frontend-side cleanup is tracked separately in `docs/REST_IMPROVEMENT_REPORT.md`.

The frontend rule is: never cast around the SDK, never call raw `fetch`. Every gap below currently forces the frontend to break that rule.

---

## Summary

| # | Gap | Severity |
|---|---|---|
| 1 | No single-appointment GET endpoint | HIGH |
| 2 | `PackageResponseDto` missing `journey_document_id` / `journey_id` | HIGH |
| 3 | `RazorpayPaymentResponseDto` missing `razorpay_order_id` | HIGH |
| 4 | Mutation responses too thin (booking/payment) | HIGH |
| 5 | Generic `Array<unknown>` / `Record<string, unknown>` DTO fields | HIGH |
| 6 | Assessments list endpoint missing `category` + `hasCitation` query params | MEDIUM |
| 7 | Wellness resources not exposed through SDK (Strapi called direct) | MEDIUM |
| 8 | Journey detail endpoint exists in SDK but not used (frontend issue, see notes) | LOW |

**6 confirmed backend changes needed; 2 informational items.**

---

## 1. HIGH — No single-appointment GET endpoint

**Current SDK:** `crmControllerFetchAppointmentDetails` is a list endpoint at `GET /api/v1/crm/appointments/details` accepting `{ leadId, startDatetime }` (`sdk/backend-v2/sdk.gen.ts:279-283`). No singular variant exists.

**Frontend workaround:** `hooks/appointments/use-appointments-page.ts:74-105` (`useAppointmentById`) fetches the entire list, then `.find(a => a.id === id)`. To read one appointment row the client downloads every appointment for the lead.

**Required backend change:** Add `GET /api/v1/crm/appointments/{slotId}` returning a single `SlotDetailDto`. SDK function name suggestion: `crmControllerFetchAppointmentById`. Sits naturally next to the existing `/api/v1/crm/appointments/details` and `/api/v1/crm/appointments/book` (`sdk.gen.ts:240-242`) endpoints.

---

## 2. HIGH — `PackageResponseDto` missing journey identifier

**Current SDK:** `PackageResponseDto` (`sdk/backend-v2/types.gen.ts:813-834`) — returned by `GET /api/v1/crm/packages/products` (`sdk.gen.ts:326`) and `GET /api/v1/crm/packages/{id}/details` (`sdk.gen.ts:335`) — has no field for the linked journey.

**Frontend workaround:** Both `app/(auth)/packages/selected-package/page.tsx:85-87` and `app/(auth)/packages/book/[package_id]/page.tsx:84-85` resort to:
```ts
(pkg as Record<string, unknown>)?.journey_document_id as string | null
```
This is a direct violation of the no-cast rule and silently breaks if the field is renamed.

**Required backend change:** Add `journey_document_id: string | null` (and/or `journey_id: number | null`) to `PackageResponseDto`. Whichever the backend stores natively — the frontend just needs *one* canonical, typed identifier to call the journey endpoint.

---

## 3. HIGH — `RazorpayPaymentResponseDto` missing `razorpay_order_id`

**Current SDK:** `RazorpayPaymentResponseDto` (`sdk/backend-v2/types.gen.ts:1189-1250`) — returned by `POST /api/v1/crm/payments/razorpay` (`sdk.gen.ts:418-426`) and the campus-scoped package payment endpoints (`POST /api/v1/{campus}/packages/{id}/payments`, `sdk.gen.ts:1312`; `POST /api/v1/{campus}/packages/payments`, `sdk.gen.ts:1322`) — exposes `id` (the *link* id), `short_url`, `reference_id`, `status`, amounts — but **no `razorpay_order_id`**. This is the field the Razorpay client SDK needs to verify the callback (`types/payment.ts:10`, `lib/capacitor/razorpay.ts`).

**Frontend workaround:** Field is referenced on the client without a typed source — currently relies on Razorpay's own callback object, which couples the client to Razorpay's wire format and prevents server-driven verification.

**Required backend change:** Add `razorpay_order_id: string` to `RazorpayPaymentResponseDto`. Either populate from the order created server-side, or expose a `RazorpayOrderDto` and reference it from the envelope.

---

## 4. HIGH — Booking/payment mutation responses are too thin

**Current SDK:**
- `POST /api/v1/crm/appointments/book` → `crmControllerBookAppointment` (`sdk.gen.ts:240-247`) returns `BookAppointmentResponseDto` (`types.gen.ts:711-728`) where `result: Array<Record<string, unknown>>` and `id: Record<string, unknown>` — the response carries no usable shape.
- `POST /api/v1/crm/payments/razorpay` → `crmControllerRazorpayPayment` (`sdk.gen.ts:418-425`) returns `RazorpayPaymentEnvelopeDto` (`types.gen.ts:4970-4975`) with payment-link details but no booking entity.
- `POST /api/v1/crm/packages/book` → `crmControllerBookPackage` (`sdk.gen.ts:342-349`) — same problem.
- Campus-scoped package endpoints `POST /api/v1/{campus}/packages/{id}/confirm` (`sdk.gen.ts:1274`) and `POST /api/v1/{campus}/packages/{id}/create-sessions` (`sdk.gen.ts:1302`) — same pattern.

**Frontend workaround:** After every successful booking the client must round-trip an extra GET (or, worse, omit cache invalidation entirely — see findings H2/H3 in the REST improvement report). The newly created appointment/package can never be inserted into the SWR cache directly.

**Required backend change:** All mutation endpoints should return the **fully shaped, typed entity that was created or updated**:
- `crmControllerBookAppointment` → return `SlotDetailDto` (or new `AppointmentDto`) for the created appointment.
- Package booking → return `BookedPackageDto`.
- Payment → return both the payment record *and* the booking entity it confirmed, with proper typed shapes (no `Record<string, unknown>`).

---

## 5. HIGH — Generic `Array<unknown>` / `Record<string, unknown>` DTO fields

**Current SDK** (`types.gen.ts`) — these DTOs are returned by the listed endpoints:

| Field | Line | Current type | Returned by |
|---|---|---|---|
| `PackageResponseDto.service_id` | 833 | `Array<unknown> \| null` | `GET /api/v1/crm/packages/products`, `GET /api/v1/crm/packages/{id}/details` |
| `PackageProductLineDto.product_id` | 844 | `Array<unknown> \| null` | `GET /api/v1/crm/packages/product-lines`, `GET /api/v1/crm/packages/booked-lines` |
| `BookedPackageDto.package_id` | 875 | `Array<unknown> \| null` | `GET /api/v1/crm/packages/user` |
| `BookedPackageDto.campus_id` | 883 | `Array<unknown> \| null` | `GET /api/v1/crm/packages/user` |
| `SlotDetailDto.doctor` | 455 | `Array<unknown> \| null` | `GET /api/v1/crm/appointments/details` |
| `BookAppointmentResponseDto.id`, `.result` | 720, 726 | `Record<string, unknown>` / `Array<Record<string, unknown>>` | `POST /api/v1/crm/appointments/book` |
| `AssessmentResponseDto.description, label, hint, citationText, image` | 2917-2933 | `Record<string, unknown> \| null` | `GET /api/v1/cms/assessments`, `GET /api/v1/cms/assessments/{id}` |

**Frontend workaround:** Manual extractors like `extractString()` in `hooks/assessments/use-assessments-page.ts:15-25`, plus scattered `as` casts. The `*_id` fields look like Odoo-style `[id, name]` tuples — the spec should reflect that.

**Required backend change:** Replace each `unknown` with a real shape:
- `*_id` tuple fields → `{ id: number; name: string }` (or split into two fields).
- `SlotDetailDto.doctor` → `DoctorDto` (the doctor object) or just `doctor_id: number` + a `DoctorDto` include.
- `AssessmentResponseDto` rich-text fields → a typed `RichTextBlockDto` or plain `string`.
- `BookAppointmentResponseDto` → typed entity (covered by gap #4).

---

## 6. MEDIUM — Assessments list endpoint missing `category` + `hasCitation` filters

**Current SDK:** `GET /api/v1/cms/assessments` → `cmsAssessmentsControllerFindAll` (`sdk.gen.ts:2058-2062`) accepts `{ limit, offset, status, search }` only.

**Frontend workaround:** `hooks/assessments/use-assessments-page.ts:254-328` fetches `limit: 100` then filters client-side by `item.citationText != null` and by `category`. Wastes payload and breaks pagination semantics — a "page" of 100 may render zero rows after the filter.

**Required backend change:** Add to `GET /api/v1/cms/assessments`:
- `category?: string` — filter by category slug/name.
- `hasCitation?: boolean` — return only items with `citationText` populated.

---

## 7. MEDIUM — Wellness resources not exposed through the SDK

**Current SDK:** No SDK function for wellness resources. `hooks/wellness/use-wellness-resources.ts` calls `lib/strapi-fetcher` directly against Strapi, with a hand-written `WellnessResource` interface (lines 12-35) including `text: ResourceBlock[]` and `similarBlogs: WellnessResource[]`.

**Frontend workaround:** Local interface duplicates an external Strapi shape; the list endpoint returns the full fat object (including `text` and `similarBlogs`) for every row even though the list view only renders `title`, `image`, `category`.

**Required backend change:** Either
- Proxy wellness resources through the same backend so they appear in the generated SDK as `cmsWellnessResourcesController*` with two DTOs (`WellnessResourceSummaryDto` for list, `WellnessResourceDetailDto` for detail), **or**
- Generate a typed Strapi SDK and split the list/detail projections at the source.

A summary projection is the bigger win here — `text` blocks can be substantial.

Suggested new endpoints if proxied through this backend:
- `GET /api/v1/cms/wellness-resources` → `WellnessResourceSummaryDto[]`
- `GET /api/v1/cms/wellness-resources/{slug}` → `WellnessResourceDetailDto` (includes `text`, `similarBlogs`)

---

## 8. LOW — Journey detail endpoint (informational)

**Current SDK:** `GET /api/v1/cms/journeys/{id}` → `cmsJourneysControllerGetById` already exists (`sdk.gen.ts:2514-2518`). **No backend gap.**

**Frontend status:** `app/(auth)/packages/selected-package/page.tsx:89-106` and `app/(auth)/packages/book/[package_id]/page.tsx:87-104` use raw `fetch(${JOURNEY_BASE_URL}/${journeyId})`. This is a frontend bug — switch to `cmsJourneysControllerGetById`. Listed here only for visibility; no spec change required.

---

## 9. LOW — Relationships endpoint (informational)

`GET /api/v1/crm/masters/relationships` → `crmControllerGetRelationships` already exists (`sdk.gen.ts:373-377`). Return shape is currently generic and is cast as `Array<{ id: number; name: string }>` in `app/(auth)/onboarding/page.tsx:85-89`. If the backend hasn't already, tighten the return type to that shape so the cast can be removed.

---

## Recommended order of work for the backend

**Wave 1 — unblock the cast removals (gaps 2, 3, 5):**
1. Add `journey_document_id` to `PackageResponseDto`.
2. Add `razorpay_order_id` to `RazorpayPaymentResponseDto`.
3. Replace every `Array<unknown>` / `Record<string, unknown>` field listed in gap #5 with a real DTO. These three together remove every active cast in the codebase.

**Wave 2 — fix the wasteful endpoints (gaps 1, 4, 6):**
4. Ship `crmControllerFetchAppointmentById`.
5. Make booking/payment mutations return the created entity.
6. Add `category` + `hasCitation` query params to the assessments list.

**Wave 3 — projection cleanup (gap 7):**
7. Decide on the wellness-resources story (proxy or typed Strapi SDK) and split list/detail DTOs.

After each wave, regenerate the SDK and the frontend can collapse the matching workaround in a single PR.

---

## Appendix — files cited

```
sdk/backend-v2/sdk.gen.ts          (lines 373-376, 2514)
sdk/backend-v2/types.gen.ts        (lines 455, 711-728, 813-834, 844, 875, 883,
                                    1189-1250, 2917-2933, 4970-4975)
hooks/appointments/use-appointments-page.ts:74-105
hooks/assessments/use-assessments-page.ts:15-25, 254-328
hooks/wellness/use-wellness-resources.ts:12-35
app/(auth)/onboarding/page.tsx:85-89
app/(auth)/packages/book/[package_id]/page.tsx:84-85, 87-104
app/(auth)/packages/selected-package/page.tsx:85-87, 89-106
types/payment.ts:10
lib/capacitor/razorpay.ts
```
