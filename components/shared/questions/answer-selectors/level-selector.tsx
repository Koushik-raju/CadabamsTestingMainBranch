"use client";

const LEVELS = [
  { value: 0, label: "None", color: "bg-green-400 border-green-500", ring: "ring-green-400" },
  { value: 1, label: "Low", color: "bg-lime-400 border-lime-500", ring: "ring-lime-400" },
  {
    value: 2,
    label: "Moderate",
    color: "bg-yellow-400 border-yellow-500",
    ring: "ring-yellow-400",
  },
  { value: 3, label: "High", color: "bg-orange-400 border-orange-500", ring: "ring-orange-400" },
  { value: 4, label: "Very High", color: "bg-red-400 border-red-500", ring: "ring-red-400" },
];

interface LevelSelectorProps {
  title?: string;
  subTitle?: string;
  selected: number;
  onSelect: (value: number) => void;
}

export function LevelSelector({ title, subTitle, selected, onSelect }: LevelSelectorProps) {
  const activeLevel = LEVELS[selected] || LEVELS[0];

  return (
    <div className="flex flex-col items-center px-5 pt-6 pb-4 w-full">
      {title && (
        <h2 className="text-xl font-bold text-foreground text-center mb-2 leading-snug">{title}</h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{subTitle}</p>
      )}

      {/* Large center display */}
      <div
        className={`w-28 h-28 rounded-full border-4 flex items-center justify-center mb-4 transition-all duration-300 ${activeLevel.color} ${activeLevel.ring} ring-4 ring-opacity-30`}
      >
        <span className="text-4xl font-bold text-white">{selected + 1}</span>
      </div>
      <p className="text-base font-semibold text-foreground mb-8">{activeLevel.label}</p>

      {/* Level dots */}
      <div className="flex gap-4 justify-center">
        {LEVELS.map((level) => {
          const isSelected = selected === level.value;
          return (
            <button
              key={level.value}
              onClick={() => onSelect(level.value)}
              className={`flex flex-col items-center gap-2 transition-all duration-200 active:scale-95`}
              aria-label={`Level ${level.value + 1}: ${level.label}`}
              aria-pressed={isSelected}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${level.color} ${
                  isSelected ? `scale-110 ${level.ring} ring-2 ring-opacity-50` : "opacity-60"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
              >
                {level.value + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
