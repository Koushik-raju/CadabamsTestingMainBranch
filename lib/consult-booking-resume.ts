/**
 * Persists consult slot selection across auth (sessionStorage).
 * Used when an anonymous user confirms a slot then signs in.
 */

export const CONSULT_BOOKING_RESUME_KEY = "consult_booking_resume_v1";

export type ConsultBookingResume = {
  slotId: number;
  doctorId: number;
  campusId: number | null;
  subCampusId: number | null;
  consultationTypeId: 1 | 2 | 3;
  startDatetime: string | null;
  /** Optional: package-paid checkout flow after guest auth */
  bookedPackageId: number | null;
  specialityId: number | null;
  savedAt: number;
};

function isConsultationTypeId(n: number): n is 1 | 2 | 3 {
  return n === 1 || n === 2 || n === 3;
}

export function saveConsultBookingResume(state: Omit<ConsultBookingResume, "savedAt">): void {
  if (typeof window === "undefined") return;
  const payload: ConsultBookingResume = { ...state, savedAt: Date.now() };
  try {
    sessionStorage.setItem(CONSULT_BOOKING_RESUME_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export function readConsultBookingResume(): ConsultBookingResume | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CONSULT_BOOKING_RESUME_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<ConsultBookingResume>;
    if (
      typeof data.slotId !== "number" ||
      typeof data.doctorId !== "number" ||
      typeof data.savedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(CONSULT_BOOKING_RESUME_KEY);
      return null;
    }
    const consultationTypeId = Number(data.consultationTypeId);
    if (!isConsultationTypeId(consultationTypeId)) return null;

    return {
      slotId: data.slotId,
      doctorId: data.doctorId,
      campusId: typeof data.campusId === "number" ? data.campusId : null,
      subCampusId: typeof data.subCampusId === "number" ? data.subCampusId : null,
      consultationTypeId,
      startDatetime: typeof data.startDatetime === "string" ? data.startDatetime : null,
      bookedPackageId:
        typeof data.bookedPackageId === "number" && Number.isFinite(data.bookedPackageId)
          ? data.bookedPackageId
          : null,
      specialityId:
        typeof data.specialityId === "number" && Number.isFinite(data.specialityId)
          ? data.specialityId
          : null,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function clearConsultBookingResume(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CONSULT_BOOKING_RESUME_KEY);
  } catch {
    /* ignore */
  }
}
