"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlotResponseDto as TimeSlot } from "@/sdk/backend-v2";

type AvailStatus = "available" | "few-left" | "no-slots" | "full";

function getAvailStatus(count: number): AvailStatus {
  if (count === 0) return "no-slots";
  if (count <= 2) return "few-left";
  return "available";
}

const AVAIL_CFG: Record<AvailStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-green-100  text-green-700" },
  "few-left": { label: "Few left", cls: "bg-orange-100 text-orange-600" },
  "no-slots": { label: "No slots", cls: "bg-red-100    text-red-600" },
  full: { label: "Full", cls: "bg-red-100    text-red-600" },
};

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DateTile({
  date,
  slotCount,
  isSelected,
  onClick,
}: {
  date: Date;
  slotCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = getAvailStatus(slotCount);
  const { label, cls } = AVAIL_CFG[status];
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = date.getDate();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-2 rounded-xl flex-1 min-w-0 transition-all",
        isSelected ? "bg-primary" : "hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-medium",
          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {dayName}
      </span>
      <span
        className={cn(
          "text-lg font-bold leading-none",
          isSelected ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {dayNum}
      </span>
      <span
        className={cn(
          "text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-tight",
          isSelected ? "bg-white/20 text-white" : cls,
        )}
      >
        {label}
      </span>
    </button>
  );
}

export interface DateStripProps {
  dates: Date[];
  slotsByDate: Record<string, TimeSlot[]>;
  selectedDate: Date;
  datePage: number;
  maxPage: number;
  loadingSlots: boolean;
  onDateSelect: (date: Date) => void;
  onPageChange: (page: number) => void;
}

export function DateStrip({
  dates,
  slotsByDate,
  selectedDate,
  datePage,
  maxPage,
  loadingSlots,
  onDateSelect,
  onPageChange,
}: DateStripProps) {
  const visibleDates = dates.slice(datePage * 10, datePage * 10 + 10);
  const dateRow1 = visibleDates.slice(0, 5);
  const dateRow2 = visibleDates.slice(5, 10);
  const monthLabel =
    visibleDates[0]?.toLocaleDateString("en-US", { month: "long", year: "numeric" }) ?? "";
  const selectedKey = toDateKey(selectedDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={datePage === 0}
            onClick={() => onPageChange(Math.max(0, datePage - 1))}
            className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={datePage >= maxPage}
            onClick={() => onPageChange(Math.min(maxPage, datePage + 1))}
            className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1">
        {dateRow1.map((date) => {
          const key = toDateKey(date);
          return (
            <DateTile
              key={key}
              date={date}
              slotCount={loadingSlots ? 0 : (slotsByDate[key]?.length ?? 0)}
              isSelected={selectedKey === key}
              onClick={() => onDateSelect(date)}
            />
          );
        })}
      </div>

      {dateRow2.length > 0 && (
        <div className="flex gap-1 mt-1">
          {dateRow2.map((date) => {
            const key = toDateKey(date);
            return (
              <DateTile
                key={key}
                date={date}
                slotCount={loadingSlots ? 0 : (slotsByDate[key]?.length ?? 0)}
                isSelected={selectedKey === key}
                onClick={() => onDateSelect(date)}
              />
            );
          })}
          {Array.from({ length: 5 - dateRow2.length }).map((_, i) => (
            <div key={i} className="flex-1" />
          ))}
        </div>
      )}
    </div>
  );
}

export type { AvailStatus };
export { AVAIL_CFG, getAvailStatus, toDateKey };
