"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AssessmentItem } from "@/hooks/assessments/use-assessments-page";
import { ArrowLeft, ChevronRight, Clock, ShieldCheck, Sparkles } from "lucide-react";

function extractTextFromRich(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.text && typeof obj.text === "string") return obj.text;
    if (obj.en && typeof obj.en === "string") return obj.en;
  }
  return "";
}

interface AssessmentLandingProps {
  assessment: AssessmentItem;
  onStart: () => void;
  onBack: () => void;
}

export function AssessmentLanding({ assessment, onStart, onBack }: AssessmentLandingProps) {
  const landing = assessment.landingTitle;
  const landingTitle = landing?.title ? extractTextFromRich(landing.title) : assessment.title;
  const landingDescription = landing?.landingDescription ?? assessment.description ?? "";
  const minutes = landing?.minutes;
  const questionCount = landing?.numberOfQuestion;
  const badgeText = landing?.badgeText ? extractTextFromRich(landing.badgeText) : null;
  const actionLabel = landing?.actionLabel
    ? extractTextFromRich(landing.actionLabel)
    : "Start Assessment";
  const points = landing?.points ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-12 pb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-muted"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="mt-6 space-y-3">
          {badgeText && (
            <Badge variant="secondary" className="w-max">
              {badgeText}
            </Badge>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{landingTitle}</h1>
          {landingDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">{landingDescription}</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 pb-32 space-y-6">
        {assessment.image && (
          <div className="w-full overflow-hidden rounded-3xl bg-muted border border-border shadow-sm">
            <div className="aspect-[4/3] flex items-center justify-center">
              <img
                src={assessment.image}
                alt={assessment.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {minutes && (
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-primary font-medium">
                  Duration
                </span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {minutes} min
                </span>
              </CardContent>
            </Card>
          )}
          {questionCount && (
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-primary font-medium">
                  Questions
                </span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {questionCount}
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        {points.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  What to expect
                </h2>
              </div>
              <ul className="space-y-3">
                {points.map((point, index) => (
                  <li
                    key={point.id ?? index}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span>{point.item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {assessment.citationText && (
          <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">Note</p>
            <p>{assessment.citationText}</p>
          </div>
        )}
      </main>

      {/* Private & Confidential — mandatory on all assessment surfaces */}
      <div className="px-5 pb-2">
        <p
          className="text-[11px] text-center flex items-center justify-center gap-1"
          style={{ color: "#6B7280" }}
        >
          <ShieldCheck className="w-3 h-3" style={{ color: "#1F8B4C" }} />
          Private &amp; confidential — your results are only visible to you.
        </p>
      </div>

      <footer
        className="sticky bottom-0 inset-x-0 backdrop-blur px-5 pb-8 pt-4"
        style={{ background: "rgba(250,247,244,0.95)", borderTop: "1px solid #ECE6DE" }}
      >
        <Button variant="mt-primary" size="mt-lg" onClick={onStart}>
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </footer>
    </div>
  );
}
