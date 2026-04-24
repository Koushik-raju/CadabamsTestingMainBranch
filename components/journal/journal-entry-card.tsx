import { Card, CardContent } from "@/components/ui/card";

interface JournalPrompt {
  heading: string;
  text: string;
}

interface JournalEntryCardProps {
  id: string;
  entry?: string;
  prompts?: JournalPrompt[];
  createdAt: string;
  onClick?: () => void;
}

export function JournalEntryCard({ entry, prompts, createdAt, onClick }: JournalEntryCardProps) {
  const preview = prompts && prompts.length > 0 ? prompts[0].text : (entry ?? "");

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border rounded-2xl"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        {prompts && prompts.length > 0 ? (
          <div className="space-y-1">
            {prompts.slice(0, 2).map((p, i) => (
              <div
                key={i}
                className="border-l-2 border-primary pl-3 py-1 rounded-r-md bg-primary/5"
              >
                <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {preview}
          </p>
        )}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </CardContent>
    </Card>
  );
}
