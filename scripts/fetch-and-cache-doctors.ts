/**
 * Fetches all doctors (psychiatrists + psychologists + other specialists) from the CRM
 * and writes them to data/doctors.ts as static cached data.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-and-cache-doctors.ts
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { CadabamsCRM } from "@cadabams/crm-sdk";

const sdk = new CadabamsCRM();

async function main() {
  console.log("Fetching doctors...");

  const [psychiatrists, psychologists, others] = await Promise.all([
    sdk.doctors.listWithSlots({ speciality_id: 1 }),
    sdk.doctors.listWithSlots({ speciality_id: 2 }),
    sdk.doctors.listWithSlots({}),
  ]);

  const otherDoctors = others.doctors.filter(
    (item) => ![1, 2].includes(item.speciality_id[0]),
  );

  const allDoctors = [
    ...psychiatrists.doctors,
    ...psychologists.doctors,
    ...otherDoctors,
  ];

  // Deduplicate by id
  const seen = new Set<number>();
  const doctors = allDoctors.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  console.log(
    `Fetched ${doctors.length} doctors (${psychiatrists.doctors.length} psychiatrists, ${psychologists.doctors.length} psychologists, ${otherDoctors.length} other specialists)`,
  );

  const output = `// AUTO-GENERATED — do not edit manually.
// Run: pnpm tsx scripts/fetch-and-cache-doctors.ts

import type { DoctorListing } from '@cadabams/crm-sdk';

export type { DoctorListing };

export const DOCTORS: DoctorListing[] = ${JSON.stringify(doctors, null, 2)};
`;

  const outPath = resolve(process.cwd(), "data/doctors.ts");
  writeFileSync(outPath, output, "utf-8");
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
