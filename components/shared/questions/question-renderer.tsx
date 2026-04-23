"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Agreement } from "./answer-selectors/agreement";
import { type BubbleOption, BubbleSelector } from "./answer-selectors/bubble-selector";
import { DotChooser, type DotOption } from "./answer-selectors/dot-chooser";
import { Generate } from "./answer-selectors/generate";
import { IndicatorSelector } from "./answer-selectors/indicator";
import { LevelSelector } from "./answer-selectors/level-selector";
import { type McqOption, McqSelector } from "./answer-selectors/mcq";
import { MoodSelector } from "./answer-selectors/mood-selector";
import { MultiDropdownSelector, type SubQuestion } from "./answer-selectors/multi-dropdown";
import { SmileySelector } from "./answer-selectors/smiley";
import { ViewText } from "./answer-selectors/view-text";
import { YesNoSelector } from "./answer-selectors/yes-no";

export type QuestionType =
  | "mcq"
  | "yes_no"
  | "smiley"
  | "rating"
  | "text"
  | "multi_dropdown"
  | "level_selector"
  | "bubble_selector"
  | "indicator"
  | "view_text"
  | "agreement"
  | "mood_selector"
  | "dot_chooser"
  | "generate"
  | string;

export interface QuestionOption {
  id?: string | number;
  option?: string;
  question?: string;
  value?: string;
  label?: string;
}

export interface Question {
  id: string | number;
  question?: string;
  title?: string;
  label?: string;
  description?: string;
  type?: QuestionType;
  __component?: string;
  options?: QuestionOption[];
  Questions?: McqOption[];
  required?: boolean;
  title1?: string;
  title2?: string;
  title3?: string;
  title4?: string;
  title5?: string;
  yesLabel?: string;
  noLabel?: string;
  subTitle?: string;
  subQuestions?: SubQuestion[];
  text?: string;
  count?: number;
  keyValue?: string | Record<string, string>;
  smileys?: string[];
  prompt?: string;
  answer?: string;
  // assessment.qa nested structure: sub-questions + shared answer options
  questions?: Array<{ question: string }>;
  answers?: Array<{ answer: string }>;
}

export type AnswerValue =
  | { selected: string }
  | { selected: number }
  | { selected: string[] }
  | { text: string }
  | { level: number }
  | { value: number }
  | { subAnswers: Record<string, string> }
  | Record<string, unknown>;

interface QuestionRendererProps {
  question: Question;
  answer: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onComplete: (complete: boolean) => void;
  /** Called when the generate component finishes (submit + redirect) */
  onFinish?: () => void;
}

const LIKERT_OPTIONS = [
  { id: "sd", label: "Strongly Disagree", value: "strongly_disagree" },
  { id: "d", label: "Disagree", value: "disagree" },
  { id: "n", label: "Neutral", value: "neutral" },
  { id: "a", label: "Agree", value: "agree" },
  { id: "sa", label: "Strongly Agree", value: "strongly_agree" },
];

function getQuestionType(q: Question): QuestionType {
  // Normalize both q.type and q.__component — the backend stores raw Strapi
  // __component strings (e.g. "assessment.level-selector") as `type`.
  const raw = q.type || q.__component || "";

  if (
    raw === "mcq" ||
    raw === "yes_no" ||
    raw === "smiley" ||
    raw === "rating" ||
    raw === "text" ||
    raw === "multi_dropdown" ||
    raw === "level_selector" ||
    raw === "bubble_selector" ||
    raw === "indicator" ||
    raw === "view_text" ||
    raw === "agreement" ||
    raw === "mood_selector" ||
    raw === "dot_chooser" ||
    raw === "generate" ||
    raw === "qa"
  ) {
    return raw;
  }

  // Fallback: match by substring for Strapi __component strings
  if (raw.includes("level-selector") || raw.includes("level_selector")) return "level_selector";
  if (raw.includes("bubble-selector") || raw.includes("bubble_selector")) return "bubble_selector";
  if (raw.includes("mood-selector") || raw.includes("mood_selector")) return "mood_selector";
  if (raw.includes("dot-chooser") || raw.includes("dot_chooser")) return "dot_chooser";
  if (raw.includes("indicator")) return "indicator";
  if (raw.includes("smiley")) return "smiley";
  if (raw.includes("yes") || raw.includes("no")) return "yes_no";
  if (raw.includes("multiple-choice") || raw.includes("mcq-multiple") || raw.includes("mcq"))
    return "mcq";
  if (raw.includes("multi") || raw.includes("dropdown")) return "multi_dropdown";
  if (raw.includes("view-text") || raw.includes("view_text")) return "view_text";
  if (raw.includes("agreement")) return "agreement";
  if (raw.includes("generate")) return "generate";
  // assessment.qa with sub-questions + answers = multi_dropdown (Likert grid)
  // assessment.qa without those fields = text input
  if (raw.includes("qa")) return "qa";
  if (raw.includes("text") || raw.includes("speech")) return "text";
  return "mcq";
}

function getQuestionLabel(q: Question): string {
  return q.question || q.title || q.label || q.description || "";
}

function parseKeyValue(kv?: string | Record<string, string>): Record<string, string> | undefined {
  if (!kv) return undefined;
  if (typeof kv === "object") return kv;
  try {
    return JSON.parse(kv);
  } catch {
    return undefined;
  }
}

export function QuestionRenderer({
  question,
  answer,
  onChange,
  onComplete,
  onFinish,
}: QuestionRendererProps) {
  const qType = getQuestionType(question);
  const qLabel = getQuestionLabel(question);
  const options: McqOption[] =
    question.Questions ||
    question.options?.map((o) => ({ option: o.option || o.label || o.value, id: o.id })) ||
    [];

  switch (qType) {
    case "mcq":
      return (
        <McqSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          questions={options}
          selected={(answer as { selected: string })?.selected || ""}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
        />
      );

    case "yes_no":
      return (
        <YesNoSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          yesLabel={question.yesLabel || "Yes"}
          noLabel={question.noLabel || "No"}
          selected={(answer as { selected: string })?.selected || ""}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
        />
      );

    case "smiley": {
      const smileyAnswer = answer as { selected: number };
      return (
        <SmileySelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          selected={smileyAnswer?.selected ?? 2}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
          labels={[
            question.title1,
            question.title2,
            question.title3,
            question.title4,
            question.title5,
          ]}
        />
      );
    }

    case "mood_selector": {
      const moodAnswer = answer as { selected: number };
      return (
        <MoodSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          selected={moodAnswer?.selected ?? 2}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
        />
      );
    }

    case "level_selector": {
      const levelAnswer = answer as { level: number };
      return (
        <LevelSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          selected={levelAnswer?.level ?? 0}
          onSelect={(value) => {
            onChange({ level: value });
            onComplete(true);
          }}
        />
      );
    }

    case "bubble_selector": {
      const bubbleAnswer = answer as { selected: string[] };
      const bubbleOptions: BubbleOption[] = (question.options || []).map((o) => ({
        id: o.id,
        label: o.option || o.label || o.value || "",
        value: o.value,
      }));
      const selectedBubbles = bubbleAnswer?.selected || [];

      return (
        <BubbleSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          options={bubbleOptions}
          selected={selectedBubbles}
          onToggle={(value) => {
            const next = selectedBubbles.includes(value)
              ? selectedBubbles.filter((v) => v !== value)
              : [...selectedBubbles, value];
            onChange({ selected: next });
            onComplete(next.length > 0);
          }}
        />
      );
    }

    case "dot_chooser": {
      const dotAnswer = answer as { selected: string[] };
      const dotOptions: DotOption[] = (question.options || []).map((o) => ({
        id: o.id,
        label: o.option || o.label || o.value || "",
        value: o.value,
      }));
      const selectedDots = dotAnswer?.selected || [];

      return (
        <DotChooser
          title={qLabel}
          subTitle={question.subTitle || question.description}
          options={dotOptions}
          selected={selectedDots}
          maxSlots={question.count || 3}
          onToggle={(value) => {
            const next = selectedDots.includes(value)
              ? selectedDots.filter((v) => v !== value)
              : [...selectedDots, value];
            onChange({ selected: next });
            onComplete(next.length > 0);
          }}
        />
      );
    }

    case "indicator": {
      const indicatorAnswer = answer as { value: number };
      return (
        <IndicatorSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          value={indicatorAnswer?.value ?? 50}
          onChange={(value) => {
            onChange({ value });
            onComplete(true);
          }}
          keyValue={parseKeyValue(question.keyValue)}
        />
      );
    }

    case "view_text":
      return (
        <ViewText
          title={qLabel}
          text={question.text}
          description={question.description}
          onComplete={() => onComplete(true)}
        />
      );

    case "agreement":
      return (
        <Agreement
          title={qLabel}
          text={question.text}
          description={question.description}
          onComplete={() => onComplete(true)}
        />
      );

    case "generate":
      return (
        <Generate
          title={qLabel}
          onComplete={() => onComplete(true)}
          onFinish={onFinish || (() => {})}
        />
      );

    case "qa": {
      // assessment.qa: has `questions[]` (sub-items) + `answers[]` (shared options)
      // Renders as a Likert-style grid via MultiDropdownSelector
      const qaQuestions = question.questions || [];
      const qaAnswers = question.answers || [];

      if (qaQuestions.length > 0 && qaAnswers.length > 0) {
        const qaSubQuestions: SubQuestion[] = qaQuestions.map((sq, idx) => ({
          id: `qa_${idx}`,
          label: sq.question,
          options: qaAnswers.map((a, aIdx) => ({
            id: `ans_${aIdx}`,
            label: a.answer,
            value: a.answer,
          })),
        }));

        const qaSubAnswers = (answer as { subAnswers?: Record<string, string> })?.subAnswers || {};

        return (
          <MultiDropdownSelector
            title={qLabel}
            subTitle={question.subTitle || question.description}
            subQuestions={qaSubQuestions}
            answers={qaSubAnswers}
            onAnswer={(sqId, value) => {
              const next = { ...qaSubAnswers, [String(sqId)]: value };
              onChange({ subAnswers: next });
              const complete = qaSubQuestions.every((sq) => !!next[String(sq.id)]);
              onComplete(complete);
            }}
          />
        );
      }

      // Fallback: qa without sub-questions = plain text
      const qaTextAnswer = answer as { text: string };
      return (
        <div className="flex flex-col px-5 pt-6 pb-4 w-full max-w-lg mx-auto">
          {qLabel && (
            <Label className="text-lg font-bold text-foreground mb-4 leading-snug">{qLabel}</Label>
          )}
          <Textarea
            className="min-h-[120px] resize-none rounded-2xl"
            placeholder="Type your answer here..."
            value={qaTextAnswer?.text || ""}
            onChange={(e) => {
              onChange({ text: e.target.value });
              onComplete(e.target.value.trim().length > 0);
            }}
          />
        </div>
      );
    }

    case "multi_dropdown": {
      const subQuestions: SubQuestion[] =
        question.subQuestions ||
        (question.options || []).map((o) => ({
          id: o.id ?? String(Math.random()),
          label: o.option || o.question || o.value || "",
          options: LIKERT_OPTIONS,
        }));

      const subAnswers = (answer as { subAnswers?: Record<string, string> })?.subAnswers || {};

      return (
        <MultiDropdownSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          subQuestions={subQuestions}
          answers={subAnswers}
          onAnswer={(sqId, value) => {
            const next = { ...subAnswers, [String(sqId)]: value };
            onChange({ subAnswers: next });
            const complete = subQuestions.every((sq) => !!next[String(sq.id)]);
            onComplete(complete);
          }}
        />
      );
    }

    case "rating": {
      const ratingAnswer = answer as { selected: number };
      const ratingValue = ratingAnswer?.selected ?? 5;
      return (
        <div className="flex flex-col items-center px-5 pt-6 pb-4 w-full">
          {qLabel && (
            <h2 className="text-xl font-bold text-foreground text-center mb-2">{qLabel}</h2>
          )}
          <div className="flex gap-2 mt-6 justify-center flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => {
                  onChange({ selected: n });
                  onComplete(true);
                }}
                className={`w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all duration-200 active:scale-95 ${
                  ratingValue === n
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-foreground hover:border-primary/50"
                }`}
                aria-label={`Rating ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            1 = Not at all &nbsp;|&nbsp; 10 = Extremely
          </p>
        </div>
      );
    }

    case "text":
    default: {
      const textAnswer = answer as { text: string };
      return (
        <div className="flex flex-col px-5 pt-6 pb-4 w-full max-w-lg mx-auto">
          {qLabel && (
            <Label className="text-lg font-bold text-foreground mb-4 leading-snug">{qLabel}</Label>
          )}
          <Textarea
            className="min-h-[120px] resize-none rounded-2xl"
            placeholder="Type your answer here..."
            value={textAnswer?.text || ""}
            onChange={(e) => {
              onChange({ text: e.target.value });
              onComplete(e.target.value.trim().length > 0);
            }}
          />
        </div>
      );
    }
  }
}
