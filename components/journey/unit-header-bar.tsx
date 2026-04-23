"use client";

interface UnitHeaderBarProps {
  unitNumber: number;
  title: string;
  taskTypes?: string[];
  onGuidebookPress?: () => void;
  onClick?: () => void;
}

export function UnitHeaderBar({ unitNumber, title, onClick }: UnitHeaderBarProps) {
  return (
    <div className="flex justify-center my-3 px-4">
      <button
        onClick={onClick}
        className="px-4 py-1 rounded-full bg-muted border border-border text-[11px] font-bold text-muted-foreground tracking-wide max-w-[180px] truncate"
      >
        Day {unitNumber} · {title}
      </button>
    </div>
  );
}
