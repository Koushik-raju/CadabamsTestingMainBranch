'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { McqSelector, type McqOption } from './answer-selectors/mcq';
import { SmileySelector } from './answer-selectors/smiley';
import { YesNoSelector } from './answer-selectors/yes-no';

export type QuestionType = 'mcq' | 'yes_no' | 'smiley' | 'rating' | 'text' | string;

export interface QuestionOption {
  id?: string | number;
  option?: string;
  question?: string;
  value?: string;
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
  // Smiley label overrides
  title1?: string;
  title2?: string;
  title3?: string;
  title4?: string;
  title5?: string;
  yesLabel?: string;
  noLabel?: string;
  subTitle?: string;
}

export type AnswerValue =
  | { selected: string }
  | { selected: number }
  | { text: string }
  | Record<string, unknown>;

interface QuestionRendererProps {
  question: Question;
  answer: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onComplete: (complete: boolean) => void;
}

function getQuestionType(q: Question): QuestionType {
  if (q.type) return q.type;
  const comp = q.__component || '';
  if (comp.includes('smiley')) return 'smiley';
  if (comp.includes('yes') || comp.includes('no')) return 'yes_no';
  if (comp.includes('multiple-choice') || comp.includes('mcq')) return 'mcq';
  if (comp.includes('qa') || comp.includes('text')) return 'text';
  return 'mcq';
}

function getQuestionLabel(q: Question): string {
  return q.question || q.title || q.label || q.description || '';
}

export function QuestionRenderer({ question, answer, onChange, onComplete }: QuestionRendererProps) {
  const qType = getQuestionType(question);
  const qLabel = getQuestionLabel(question);
  const options: McqOption[] = question.Questions || question.options?.map(o => ({ option: o.option || o.value, id: o.id })) || [];

  switch (qType) {
    case 'mcq':
      return (
        <McqSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          questions={options}
          selected={(answer as { selected: string })?.selected || ''}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
        />
      );

    case 'yes_no':
      return (
        <YesNoSelector
          title={qLabel}
          subTitle={question.subTitle || question.description}
          yesLabel={question.yesLabel || 'Yes'}
          noLabel={question.noLabel || 'No'}
          selected={(answer as { selected: string })?.selected || ''}
          onSelect={(value) => {
            onChange({ selected: value });
            onComplete(true);
          }}
        />
      );

    case 'smiley': {
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
          labels={[question.title1, question.title2, question.title3, question.title4, question.title5]}
        />
      );
    }

    case 'rating': {
      const ratingAnswer = answer as { selected: number };
      const ratingValue = ratingAnswer?.selected ?? 5;
      return (
        <div className="flex flex-col items-center px-4 pt-4 pb-4 w-full">
          {qLabel && (
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
              {qLabel}
            </h2>
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
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-foreground hover:border-primary/50'
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

    case 'text':
    default: {
      const textAnswer = answer as { text: string };
      return (
        <div className="flex flex-col px-4 pt-4 pb-4 w-full max-w-lg mx-auto">
          {qLabel && (
            <Label className="text-base sm:text-lg font-semibold text-foreground mb-3 leading-snug">
              {qLabel}
            </Label>
          )}
          <Textarea
            className="min-h-[120px] resize-none"
            placeholder="Type your answer here..."
            value={textAnswer?.text || ''}
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
