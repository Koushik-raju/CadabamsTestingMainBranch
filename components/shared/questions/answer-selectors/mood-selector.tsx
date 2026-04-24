"use client";

const MOODS = [
  {
    value: 0,
    emoji: "😢",
    label: "Very Bad",
    color: "border-purple-400 bg-purple-50",
    selectedColor: "border-purple-500 bg-purple-100 ring-2 ring-purple-400",
  },
  {
    value: 1,
    emoji: "😟",
    label: "Bad",
    color: "border-blue-400 bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
  },
  {
    value: 2,
    emoji: "😐",
    label: "Neutral",
    color: "border-yellow-400 bg-yellow-50",
    selectedColor: "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-400",
  },
  {
    value: 3,
    emoji: "😊",
    label: "Good",
    color: "border-lime-400 bg-lime-50",
    selectedColor: "border-lime-500 bg-lime-100 ring-2 ring-lime-400",
  },
  {
    value: 4,
    emoji: "😄",
    label: "Very Good",
    color: "border-green-400 bg-green-50",
    selectedColor: "border-green-500 bg-green-100 ring-2 ring-green-400",
  },
];

interface MoodSelectorProps {
  title?: string;
  subTitle?: string;
  selected: number;
  onSelect: (value: number) => void;
}

export function MoodSelector({ title, subTitle, selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-4 w-full">
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2 leading-tight">
          {title}
        </h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{subTitle}</p>
      )}
      <div className="flex gap-3 sm:gap-4 justify-center mt-4">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => onSelect(mood.value)}
              className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                isSelected ? mood.selectedColor : mood.color
              }`}
              aria-label={mood.label}
              aria-pressed={isSelected}
            >
              <span
                className={`text-3xl sm:text-4xl transition-all ${isSelected ? "scale-110" : ""}`}
              >
                {mood.emoji}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[48px] ${
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
