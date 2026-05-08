/**
 * FILE: scripts/fetch-and-cache-doctors.ts
 *
 * PURPOSE:
 *   Fetches all doctors across every known specialty from the Cadabams ERP
 *   (rich `/get/doctors/testing` endpoint) and writes them to
 *   `data/doctors.ts` as a statically cached array.
 *
 * LOGIC OVERVIEW:
 *   1. Read ERP connection vars (`ERP_BASE_URL`, `ERP_BEARER_TOKEN`) from env.
 *   2. For each specialty id in SPECIALTY (1, 2, and OTHERS 3–10) call
 *      GET `<ERP_BASE_URL>/get/doctors/testing?speciality_id=<id>` with a
 *      Bearer Authorization header.
 *   3. Concatenate every `doctors` array from the responses and deduplicate
 *      by `id` to avoid overlap between specialty buckets.
 *   4. Emit a TypeScript module at `data/doctors.ts` exporting the
 *      resulting `DoctorListing[]` as `DOCTORS`.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   BASE_URL       — ERP base URL from `ERP_BASE_URL`.
 *   BEARER_TOKEN   — Bearer credential from `ERP_BEARER_TOKEN`.
 *   SPECIALTY      — enum-like map of specialty ids to iterate over.
 *   fetchDoctors() — GETs doctors for one `speciality_id`.
 *   main()         — orchestrates fetch, dedupe, and file write.
 *
 * DEPENDENCIES:
 *   axios, dotenv/config, node:fs, node:path
 *
 * LAST UPDATED: 2026-04-20 — switched from auth.cadabams.com to ERP
 *   `/get/doctors/testing` Bearer endpoint and iterate SPECIALTY ids.
 */
import "dotenv/config";
import axios from "axios";
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = process.env.ERP_BASE_URL;
const BEARER_TOKEN = process.env.ERP_BEARER_TOKEN;

if (!BASE_URL) {
  console.error("Missing ERP_BASE_URL env var");
  process.exit(1);
}
if (!BEARER_TOKEN) {
  console.error("Missing ERP_BEARER_TOKEN env var");
  process.exit(1);
}

const SPECIALTY = {
  CONSULTANT_PSYCHIATRIST: 1,
  CLINICAL_PSYCHOLOGIST: 2,
  PSYCHIATRIC_SOCIAL_WORKER: 3,
  CONSULTANT_NEUROLOGIST: 4,
  SPEECH_LANGUAGE_PATHOLOGIST: 5,
  OCCUPATIONAL_THERAPIST: 6,
  BEHAVIOR_THERAPIST: 7,
  FAMILY_THERAPIST: 8,
  PEDIATRIC_PHYSIOTHERAPIST: 9,
  SPECIAL_EDUCATOR: 10,
} as const;

const SPECIALTY_IDS: number[] = Object.values(SPECIALTY);

const http = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${BEARER_TOKEN}`, Accept: "application/json" },
});

async function fetchDoctors(speciality_id: number) {
  try {
    const res = await http.get("/get/doctors/testing", {
      params: { speciality_id },
    });
    return res.data as { doctors: unknown[]; total_count?: number };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      console.warn(`  speciality_id=${speciality_id}: 404 (no doctors) — skipping`);
      return { doctors: [], total_count: 0 };
    }
    throw err;
  }
}

async function main() {
  console.log(`Fetching doctors from ${BASE_URL} across ${SPECIALTY_IDS.length} specialties...`);

  const results = await Promise.all(SPECIALTY_IDS.map((id) => fetchDoctors(id)));

  const allDoctors = results.flatMap((r) => r.doctors);

  const seen = new Set<number>();
  const doctors = allDoctors.filter((d) => {
    const id = (d as { id: number }).id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  results.forEach((r, i) => {
    console.log(`  speciality_id=${SPECIALTY_IDS[i]}: ${r.doctors.length} doctors`);
  });
  console.log(`Total unique doctors: ${doctors.length}`);

  const output = `// AUTO-GENERATED — do not edit manually.
// Run: pnpm tsx scripts/fetch-and-cache-doctors.ts

type Doctor = {
  id: number;
  name: string;
  speciality_id: [number | string, number | string];
  image?: string;
  book_package: boolean;
  [key: string]: unknown;
};

type DoctorPreferenceTuple = [string, number];

export type DoctorListing = Doctor & {
  cns_preference?: DoctorPreferenceTuple[] | null;
  illness_treated?: DoctorPreferenceTuple[] | null;
  age_preference?: DoctorPreferenceTuple[] | null;
  language_preference?: DoctorPreferenceTuple[] | null;
  city?: DoctorPreferenceTuple[] | null;
  area?: DoctorPreferenceTuple[] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DOCTORS: DoctorListing[] = (${JSON.stringify(doctors, null, 2)} as unknown) as DoctorListing[];
`;

  const outPath = resolve(process.cwd(), "data/doctors.ts");
  writeFileSync(outPath, output, "utf-8");
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
