import { Play } from "lucide-react";
import Image from "next/image";

interface RecommendationItem {
  id: string;
  title: string;
  category: string;
  duration?: string;
  image: string;
}

const PLACEHOLDERS: RecommendationItem[] = [
  {
    id: "morning",
    title: "Morning Clarity",
    category: "Guided Visualization",
    duration: "5 min",
    image: "/morning_clarity.png",
  },
  {
    id: "anxiety",
    title: "Anxiety Relief",
    category: "Soundscape",
    duration: "10 min",
    image: "/anxiety_relief.png",
  },
];

interface Props {
  items?: RecommendationItem[];
  onRecommendClick?: (id: string) => void;
}

export function Recommendations({ items, onRecommendClick }: Props) {
  const display = items && items.length > 0 ? items.slice(0, 5) : PLACEHOLDERS;

  return (
    <div className="px-4 mb-8">
      <h3 className="text-lg font-bold mb-5">Recommended for You</h3>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {display.map((item) => (
            <div
              key={item.id}
              onClick={() => onRecommendClick?.(item.id)}
              className="bg-card rounded-xl overflow-hidden border border-border flex-shrink-0 w-[240px] cursor-pointer active:scale-95 transition-transform group"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {item.duration && (
                  <div className="absolute right-4 bottom-4 bg-foreground/80 text-background backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                    <Play className="w-2.5 h-2.5 fill-background" />
                    <span>{item.duration}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 pb-5 px-4">
                <h4 className="text-[15px] font-bold mb-1 leading-snug line-clamp-2 min-h-[40px]">
                  {item.title}
                </h4>
                <p className="text-muted-foreground text-[12px] font-medium">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Right fade to hint at more cards */}
        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
