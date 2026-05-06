/**
 * FILE: app/(auth)/consult/appointments/[appointment_id]/page.tsx
 *
 * PURPOSE:
 *   Route entry for appointment detail. Delegates to AppointmentDetailView (client)
 *   so Turbopack does not keep a stale lucide chunk keyed on this module after edits.
 *
 * LAST UPDATED: 2026-05-06 — split client UI to appointment-detail-view.tsx
 */
import { AppointmentDetailView } from "./appointment-detail-view";

export default function AppointmentDetailPage() {
  return <AppointmentDetailView />;
}
