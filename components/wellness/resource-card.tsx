import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { WellnessResource } from "@/hooks/wellness/use-wellness-resources";
import { ChevronRight, Play } from "lucide-react";
import Image from "next/image";

function getStrapiImageUrl(coverImage?: WellnessResource["coverImage"]): string | null {
  const url = coverImage?.webImage?.url || coverImage?.mobileImage?.url;
  if (!url) return null;
  if (url.startsWith("http")) return url.split("?")[0];
  return `https://admin.mindtalkbuddy.com${url}`.split("?")[0];
}

interface ResourceCardProps {
  resource: WellnessResource;
  index?: number;
  onClick?: () => void;
}

export function ResourceCard({ resource, index = 0, onClick }: ResourceCardProps) {
  const imageUrl = getStrapiImageUrl(resource.coverImage);
  const categories = Array.isArray(resource.category)
    ? resource.category
    : resource.category
      ? [resource.category]
      : [];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className="group overflow-hidden cursor-pointer border-border bg-card shadow-sm hover:-translate-y-1 transition-transform duration-300 rounded-2xl"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[200px] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={resource.title ?? "Wellness resource"}
            fill
            priority={index < 4}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] font-bold rounded-full">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground font-bold text-[15px] leading-snug line-clamp-2 flex-1">
            {resource.title}
          </h3>
          <div
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
            aria-hidden="true"
          >
            <ChevronRight size={18} />
          </div>
        </div>

        {resource.duration && (
          <p className="text-muted-foreground text-xs font-medium">{resource.duration}</p>
        )}
      </div>
    </Card>
  );
}
