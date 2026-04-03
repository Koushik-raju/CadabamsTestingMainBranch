'use client';

import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface JournalPrompt {
  heading: string;
  text: string;
}

interface JournalEditorProps {
  content: string;
  onChange: (value: string) => void;
  savedPrompts: JournalPrompt[];
  currentHeading: string;
  isPromptMode: boolean;
  isPrompting: boolean;
  isLoading: boolean;
  onSave: () => void;
  onPromptMe: () => void;
  onGoDeeper: () => void;
}

export function JournalEditor({
  content,
  onChange,
  savedPrompts,
  currentHeading,
  isPromptMode,
  isPrompting,
  isLoading,
  onSave,
  onPromptMe,
  onGoDeeper,
}: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Saved prompts */}
      {savedPrompts.map((prompt, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-md">
            <p className="text-sm font-semibold text-primary">{prompt.heading}</p>
          </div>
          <p className="text-base text-foreground whitespace-pre-wrap ml-2">
            {prompt.text}
          </p>
        </div>
      ))}

      {/* Current prompt heading */}
      {isPromptMode && currentHeading && (
        <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-md">
          <p className="text-sm font-semibold text-primary">{currentHeading}</p>
        </div>
      )}

      {/* Loading prompt */}
      {isPrompting && !currentHeading && (
        <div className="flex items-center gap-2 border-l-4 border-primary pl-4 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Getting a prompt for you...</span>
        </div>
      )}

      {/* Text area */}
      {(isPromptMode || savedPrompts.length === 0) && (
        <Textarea
          ref={textareaRef}
          placeholder={isPromptMode ? 'Start writing...' : "What's on your mind..."}
          value={content}
          onChange={handleChange}
          className="resize-none border-none shadow-none bg-transparent focus-visible:ring-0 text-base text-foreground min-h-[120px] overflow-hidden p-0"
          autoFocus
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        {hasContent && (savedPrompts.length > 0 || isPromptMode) ? (
          <>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onGoDeeper}
              disabled={isPrompting}
            >
              {isPrompting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Go Deeper
            </Button>
            <Button
              className="rounded-full"
              onClick={onSave}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Finish
            </Button>
          </>
        ) : hasContent ? (
          <Button className="rounded-full" onClick={onSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Finish
          </Button>
        ) : isPromptMode ? (
          <>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onPromptMe}
              disabled={isPrompting}
            >
              {isPrompting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Refresh
            </Button>
            <Button className="rounded-full" disabled>
              Finish
            </Button>
          </>
        ) : (
          <Button
            className="rounded-full"
            onClick={onPromptMe}
            disabled={isPrompting}
          >
            {isPrompting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Prompt me
          </Button>
        )}
      </div>
    </div>
  );
}
