/**
 * Fetches all doctors (psychiatrists + psychologists + other specialists) from the CRM
 * and writes them to data/doctors.ts as static cached data.
 *
 * Usage:
 *   CADABAMS_AUTH_API_KEY=<key> pnpm tsx scripts/fetch-and-cache-doctors.ts
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { resolve } from "path";
import axios from "axios";

const BASE_URL = "https://auth.cadabams.com/api/v1";
const API_KEY = process.env.CADABAMS_AUTH_API_KEY;

if (!API_KEY) {
  console.error("Missing CADABAMS_AUTH_API_KEY env var");
  process.exit(1);
}

const http = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

async function fetchDoctors(speciality_id?: number) {
  const params = speciality_id ? { speciality_id } : {};
  const res = await http.get("/doctors", { params });
  return res.data as { doctors: unknown[]; total_count?: number };
}

async function main() {
  console.log("Fetching doctors...");

  const [psychiatrists, psychologists, others] = await Promise.all([
    fetchDoctors(1),
    fetchDoctors(2),
    fetchDoctors(),
  ]);

  const otherDoctors = (others.doctors as Array<{ speciality_id: [number, string] }>).filter(
    (item) => ![1, 2].includes(item.speciality_id[0])
  );

  const allDoctors = [
    ...psychiatrists.doctors,
    ...psychologists.doctors,
    ...otherDoctors,
  ];

  // Deduplicate by id
  const seen = new Set<number>();
  const doctors = allDoctors.filter((d) => {
    const id = (d as { id: number }).id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  console.log(
    `Fetched ${doctors.length} doctors (${psychiatrists.doctors.length} psychiatrists, ${psychologists.doctors.length} psychologists, ${otherDoctors.length} other specialists)`
  );

  const output = `// AUTO-GENERATED — do not edit manually.
// Run: CADABAMS_AUTH_API_KEY=<key> pnpm tsx scripts/fetch-and-cache-doctors.ts

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
