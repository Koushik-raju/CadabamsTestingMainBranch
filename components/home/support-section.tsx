import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

interface Props {
  onTalk: () => void;
  onMatch: () => void;
}

export function SupportSection({ onTalk, onMatch }: Props) {
  return (
    <div className="px-4 mb-8">
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <LayoutGrid size={24} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-[1.5px]">
                NEED SUPPORT?
              </span>
              <h4 className="text-lg font-bold leading-tight">Find the right expert for you</h4>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={onTalk} className="flex-1 rounded-full">
              Talk to a therapist
            </Button>
            <Button onClick={onMatch} variant="secondary" className="flex-1 rounded-full">
              Match me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
