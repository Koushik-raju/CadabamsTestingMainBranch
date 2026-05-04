/**
 * FILE: app/(public)/auth/signup/dob-picker.tsx
 *
 * PURPOSE:
 *   Custom date-of-birth selector with three styled dropdown selects (Month / Day / Year)
 *   that match the Banani input design. Avoids the native browser date input which looks
 *   inconsistent across devices.
 *
 * LOGIC OVERVIEW:
 *   Maintains local month/day/year state. When all three are populated it assembles a
 *   validated ISO date string (YYYY-MM-DD) and calls onChange. Days in the list are
 *   clamped to the actual days in the selected month/year so Feb 30 is never an option.
 *   If the incoming value prop changes externally, the three selects resync.
 *
 * KEY VARIABLES / PROPS:
 *   value     — controlled ISO date string ("YYYY-MM-DD") or ""
 *   onChange  — called with the new ISO date string when all three are set
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, i) => CURRENT_YEAR - i);

interface Props {
  value: string;
  onChange: (iso: string) => void;
}

export function DOBPicker({ value, onChange }: Props) {
  const [month, setMonth] = useState(() => (value ? value.split("-")[1] : ""));
  const [day, setDay] = useState(() => (value ? String(Number(value.split("-")[2])) : ""));
  const [year, setYear] = useState(() => (value ? value.split("-")[0] : ""));

  /* Resync selects if the value prop is reset from outside. */
  useEffect(() => {
    if (!value) {
      setMonth("");
      setDay("");
      setYear("");
    }
  }, [value]);

  const daysInMonth = useMemo(() => {
    if (!month) return 31;
    /* new Date(year, month, 0) gives the last day of the previous month. */
    return new Date(year ? Number(year) : 2000, Number(month), 0).getDate();
  }, [month, year]);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  /* Clamp day when month/year change makes the current day invalid. */
  useEffect(() => {
    if (day && Number(day) > daysInMonth) setDay(String(daysInMonth));
  }, [daysInMonth, day]);

  /* Emit ISO date string when all three selects are filled. */
  useEffect(() => {
    if (!month || !day || !year) return;
    const m = Number(month),
      d = Number(day),
      y = Number(year);
    /* Guard against rolled-over dates (e.g. Feb 30 becoming Mar 2). */
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
      onChange(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }, [month, day, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectCls =
    "w-full h-13 rounded-2xl bg-white pl-4 pr-8 appearance-none text-[15px] text-gray-900 outline-none focus:ring-2 focus:ring-orange-300 transition cursor-pointer";
  const wrapCls = "relative";

  return (
    <div className="flex gap-2">
      {/* Month */}
      <div className={`${wrapCls} flex-1`}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls}>
          <option value="" disabled>
            Month
          </option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1)}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Day */}
      <div className={`${wrapCls} w-[88px]`}>
        <select value={day} onChange={(e) => setDay(e.target.value)} className={selectCls}>
          <option value="" disabled>
            Day
          </option>
          {days.map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Year */}
      <div className={`${wrapCls} w-[100px]`}>
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
          <option value="" disabled>
            Year
          </option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
