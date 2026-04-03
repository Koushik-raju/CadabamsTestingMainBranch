'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Message Dr. Riya...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      // Fallback: browser MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Voice recording unavailable:', err);
      setIsRecording(false);
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-card border-t border-border">
      {/* Voice button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'flex-shrink-0 rounded-full h-9 w-9',
          isRecording && 'bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600'
        )}
        onClick={handleVoiceToggle}
        disabled={disabled}
        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Text area */}
      <div className="flex-1 bg-muted rounded-2xl px-4 py-2.5 min-h-[40px] flex items-end">
        <TextareaAutosize
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          minRows={1}
          maxRows={5}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
          aria-label="Type your message"
        />
      </div>

      {/* Send button */}
      <Button
        type="button"
        size="icon"
        className={cn(
          'flex-shrink-0 rounded-full h-9 w-9 transition-all',
          canSend ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
