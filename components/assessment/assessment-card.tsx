/**
 * FILE: components/assessment/assessment-card.tsx
 *
 * PURPOSE:
 *   Three card variants for assessment surfaces: AssessmentCard (list row),
 *   AssessmentGridCard (2-col grid tile), RecommendedAssessmentCard (hero).
 *
 * LOGIC OVERVIEW:
 *   1. AssessmentCard — compact row for search results; glyph tile (--mt-tint-* colors),
 *      title, category + time meta, chevron.
 *   2. AssessmentGridCard — 2-col grid tile; tinted bg with white glyph tile,
 *      description, footer with time/questions/reports link.
 *   3. RecommendedAssessmentCard — dark hero card (--mt-ink-800 bg), white text,
 *      "Recommended" pill, large watermark icon. Includes "Private & Confidential" note.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessment — AssessmentItem from use-assessments hook
 *   onClick    — parent handles navigation after click
 *
 * DEPENDENCIES:
 *   getCategoryInfo — maps assessment type to icon, bgColor, textColor
 *   lucide-react, Card, CardContent, Link
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: white bg-card cards with gradient icon tiles,
 *   token-based colors, shadow scale; removed pastel card backgrounds
 */

"use client";
import { CalendarClock, ChevronRight, Clock3, FileText, HelpCircle, Lock } from "lucide-react";
import Link from "next/link";
import { GlyphTile, TINTS } from "@/components/shared/glyph-tile";
import type { AssessmentItem } from "@/hooks/use-assessments";
import type { WorksheetItem } from "@/hooks/use-worksheets";
import { getCategoryInfo } from "./assessment-category";

type BrowseCardItem = AssessmentItem | WorksheetItem;

interface AssessmentCardProps<T extends BrowseCardItem = AssessmentItem> {
  assessment: T;
  onClick: (assessment: T) => void;
  /** When set, replaces the default “Reports” link (assessments only). */
  browseFooterLink?: { href: string; label: string };
}

function extractHintCategory(hint: string | null): string | null {
  if (!hint) return null;
  const splittedHint = hint.split("|");
  if (splittedHint.length < 2) return null;
  const last = splittedHint.at(-1)?.trim();
  if (!last) return null;
  return last.split(",")[0]?.trim() || null;
}

/* Plain row — used in search results list */
export function AssessmentCard<T extends BrowseCardItem = AssessmentItem>({
  assessment,
  onClick,
}: AssessmentCardProps<T>) {
  const { icon: Icon, tint } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;

  return (
    <div
      className="flex items-center gap-3 py-3 cursor-pointer transition-colors hover:bg-muted active:bg-muted/80 rounded-[14px] px-2"
      onClick={() => onClick(assessment)}
      role="button"
      tabIndex={0}
      aria-label={assessment.title}
      onKeyDown={(e) => e.key === "Enter" && onClick(assessment)}
    >
      <GlyphTile icon={Icon} tint={tint} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-snug truncate">
          {assessment.title}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {[hintCategory, minutes ? `${minutes} min` : null].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

/* Grid tile — full-width card on the assessments screen */
export function AssessmentGridCard<T extends BrowseCardItem = AssessmentItem>({
  assessment,
  onClick,
  browseFooterLink,
}: AssessmentCardProps<T>) {
  const { icon: Icon, tint } = getCategoryInfo(assessment);
  const { bg, fg } = TINTS[tint];
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;
  const questionCount = assessment.landingTitle?.numberOfQuestion || assessment.Questions?.length;
  const description = assessment.description || assessment.landingTitle?.landingDescription;

  return (
    <div
      className="bg-card rounded-3xl border border-border shadow-[var(--sh-2)] p-4 cursor-pointer active:scale-[0.97] transition-transform duration-[140ms] overflow-hidden"
      onClick={() => onClick(assessment)}
      role="button"
      tabIndex={0}
      aria-label={assessment.title}
      onKeyDown={(e) => e.key === "Enter" && onClick(assessment)}
    >
      {/* Header: GlyphTile + title + chevron */}
      <div className="flex items-start gap-3">
        <GlyphTile icon={Icon} tint={tint} />
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[14px] font-bold text-foreground leading-snug">{assessment.title}</p>
          {hintCategory && (
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
              style={{ background: bg, color: fg }}
            >
              {hintCategory}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      {/* Description */}
      {description && (
        <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed line-clamp-3">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        {minutes != null && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Clock3 className="w-3 h-3" />
            {minutes} min
          </span>
        )}
        {questionCount && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <HelpCircle className="w-3 h-3" />
            {questionCount} questions
          </span>
        )}
        <Link
          href={browseFooterLink?.href ?? `/assessments/${assessment.id}/reports`}
          onClick={(e) => e.stopPropagation()}
          aria-label={browseFooterLink?.label ?? "View previous reports"}
          className="ml-auto flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-1 transition-colors"
          style={{ background: bg, color: fg }}
        >
          <FileText className="w-3 h-3" />
          {browseFooterLink?.label ?? "Reports"}
        </Link>
      </div>
    </div>
  );
}

/* Hero recommended card — dark ink-800 bg, white text */
interface RecommendedAssessmentCardProps<T extends BrowseCardItem = AssessmentItem> {
  assessment: T;
  onClick: (assessment: T) => void;
}

export function RecommendedAssessmentCard<T extends BrowseCardItem = AssessmentItem>({
  assessment,
  onClick,
}: RecommendedAssessmentCardProps<T>) {
  const { icon: Icon, textColor } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;
  const questionCount = assessment.landingTitle?.numberOfQuestion;
  const description = assessment.description || assessment.landingTitle?.landingDescription;

  return (
    <div
      className="rounded-[24px] cursor-pointer active:scale-[0.98] transition-transform duration-[140ms] overflow-hidden relative min-h-[170px]"
      style={{
        background: "#1C2433",
        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      }}
      onClick={() => onClick(assessment)}
      role="button"
      tabIndex={0}
      aria-label={assessment.title}
      onKeyDown={(e) => e.key === "Enter" && onClick(assessment)}
    >
      <div className="p-5 relative z-10">
        {/* Top row: Recommended badge + Private chip */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-block text-white text-[10px] font-bold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(249,115,22,0.25)",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            Recommended
          </span>
          {/* Private & Confidential — mandatory per design system */}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-white/50">
            <Lock className="w-3 h-3" />
            Private &amp; confidential
          </span>
        </div>

        <h3 className="text-[22px] font-extrabold tracking-tight mb-2 leading-tight max-w-[200px] text-white">
          {assessment.title}
        </h3>
        {description && (
          <p className="text-[12px] text-white/60 leading-relaxed max-w-[195px] mb-4 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-4 text-[12px] text-white/60">
          <span className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            {minutes || 5} min
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {questionCount || assessment.Questions?.length || 12} questions
          </span>
        </div>
        {hintCategory && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[11px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
              {hintCategory}
            </span>
          </div>
        )}
        {/* Large watermark icon */}
        <div className="absolute right-4 bottom-4 opacity-20">
          <Icon className={`w-20 h-20 ${textColor}`} />
        </div>
      </div>
    </div>
  );
}
