'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubble, TypingIndicator } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatHeader } from '@/components/chat/chat-header';
import { useAuth } from '@/hooks/use-auth';
import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/chat';

// Greeting from Dr. Riya
const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content:
    "Hello! I'm Dr. Riya, your AI mental health companion. I'm here to listen and help you explore your thoughts and feelings. How are you feeling today?",
  timestamp: new Date().toISOString(),
};

export default function NewChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const leadId = user?.lead_id ?? user?.caller_mobile ?? null;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load existing chat history on mount
  useEffect(() => {
    if (!leadId) return;

    const loadHistory = async () => {
      try {
        const data = await chatService.fetchChats({ lead_id: leadId });
        if (Array.isArray(data) && data.length > 0) {
          // Map backend data to ChatMessage shape
          const historical: ChatMessage[] = (
            data as Array<{
              id?: string;
              role?: string;
              message?: string;
              content?: string;
              timestamp?: string | number;
            }>
          ).map((m, idx) => ({
            id: m.id ?? String(idx),
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.message ?? m.content ?? '',
            timestamp: m.timestamp,
          }));
          setMessages([INITIAL_MESSAGE, ...historical]);
        }
      } catch {
        // Non-fatal: use greeting only
      }
    };

    loadHistory();
  }, [leadId]);

  const getAiResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      // Build a simple conversation context string for the API
      const context = messages
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Dr. Riya'}: ${m.content}`)
        .join('\n');

      try {
        // POST to saveLog which acts as AI trigger endpoint in this backend
        const result = await chatService.saveLog({
          lead_id: leadId,
          message: userMessage,
          context,
        });

        // Try common response shapes
        const reply =
          (result as { reply?: string })?.reply ??
          (result as { response?: string })?.response ??
          (result as { message?: string })?.message ??
          null;

        if (typeof reply === 'string' && reply.length > 0) return reply;
      } catch {
        // Fall through to default
      }

      // Thoughtful fallback responses
      const fallbacks = [
        "Thank you for sharing that with me. Can you tell me more about how that makes you feel?",
        "I hear you. It takes courage to talk about these things. What's been on your mind the most lately?",
        "That sounds challenging. How long have you been experiencing this?",
        "I appreciate you opening up. What kind of support would be most helpful for you right now?",
        "Your feelings are valid. Let's explore this together — what do you think triggered these feelings?",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    },
    [messages, leadId]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (isSending) return;
      setIsSending(true);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      // Persist user message
      if (leadId) {
        chatService
          .saveChat({
            lead_id: leadId,
            message: text,
            role: 'user',
            timestamp: userMessage.timestamp,
          })
          .catch(() => {});
      }

      try {
        const aiText = await getAiResponse(text);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiText,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Persist AI message
        if (leadId) {
          chatService
            .saveChat({
              lead_id: leadId,
              message: aiText,
              role: 'assistant',
              timestamp: aiMessage.timestamp,
            })
            .catch(() => {});
        }
      } finally {
        setIsTyping(false);
        setIsSending(false);
      }
    },
    [isSending, leadId, getAiResponse]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <ChatHeader />

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="flex flex-col min-h-full justify-end">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isTyping && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pb-[env(safe-area-inset-bottom,0px)]">
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  );
}
