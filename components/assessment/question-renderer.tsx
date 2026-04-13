'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { McqSelector, type McqOption } from './answer-selectors/mcq';
import { SmileySelector } from './answer-selectors/smiley';
import { YesNoSelector } from './answer-selectors/yes-no';
import { MultiDropdownSelector, type SubQuestion } from './answer-selectors/multi-dropdown';

export type QuestionType = 'mcq' | 'yes_no' | 'smiley' | 'rating' | 'text' | 'multi_dropdown' | string;

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
  title1?: string;
  title2?: string;
  title3?: string;
  title4?: string;
  title5?: string;
  yesLabel?: string;
  noLabel?: string;
  subTitle?: string;
  subQuestions?: SubQuestion[];
}

export type AnswerValue =
  | { selected: string }
  | { selected: number }
  | { text: string }
  | { subAnswers: Record<string, string> }
  | Record<string, unknown>;

interface QuestionRendererProps {
  question: Question;
  answer: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onComplete: (complete: boolean) => void;
}

const LIKERT_OPTIONS = [
  { id: 'sd', label: 'Strongly Disagree', value: 'strongly_disagree' },
  { id: 'd', label: 'Disagree', value: 'disagree' },
  { id: 'n', label: 'Neutral', value: 'neutral' },
  { id: 'a', label: 'Agree', value: 'agree' },
  { id: 'sa', label: 'Strongly Agree', value: 'strongly_agree' },
];

function getQuestionType(q: Question): QuestionType {
  if (q.type) return q.type;
  const comp = q.__component || '';
  if (comp.includes('smiley')) return 'smiley';
  if (comp.includes('yes') || comp.includes('no')) return 'yes_no';
  if (comp.includes('multiple-choice') || comp.includes('mcq')) return 'mcq';
  if (comp.includes('multi') || comp.includes('dropdown')) return 'multi_dropdown';
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

    case 'multi_dropdown': {
      // Sub-questions come from question.subQuestions or built from options
      const subQuestions: SubQuestion[] = question.subQuestions ||
        (question.options || []).map((o) => ({
          id: o.id ?? String(Math.random()),
          label: o.option || o.question || o.value || '',
          options: LIKERT_OPTIONS,
        }));

      const subAnswers = (answer as { subAnswers?: Record<string, string> })?.subAnswers || {};
      const allAnswered = subQuestions.length > 0 &&
        subQuestions.every((sq) => !!subAnswers[String(sq.id)]);

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

    case 'rating': {
      const ratingAnswer = answer as { selected: number };
      const ratingValue = ratingAnswer?.selected ?? 5;
      return (
        <div className="flex flex-col items-center px-5 pt-6 pb-4 w-full">
          {qLabel && (
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
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
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-card border-border text-foreground hover:border-orange-300'
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
        <div className="flex flex-col px-5 pt-6 pb-4 w-full max-w-lg mx-auto">
          {qLabel && (
            <Label className="text-lg font-bold text-foreground mb-4 leading-snug">
              {qLabel}
            </Label>
          )}
          <Textarea
            className="min-h-[120px] resize-none rounded-2xl"
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
