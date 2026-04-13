import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UIMessage } from 'ai';
import { createMastraClient } from '@/lib/mastra-client';

interface UseThreadMessagesProps {
  threadId: string;
  agentId: string;
}

export function useThreadMessages({ threadId, agentId }: UseThreadMessagesProps) {
  const router = useRouter();
  const [historicalMessages, setHistoricalMessages] = useState<UIMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadMessages = useCallback(async (page: number): Promise<{ messages: UIMessage[]; hasMore: boolean; page: number }> => {
    if (!threadId || !agentId) {
      return { messages: [], hasMore: false, page };
    }

    try {
      const client = await createMastraClient();
      const result = await client.listThreadMessages(threadId, {
        agentId,
        requestContext: { page, perPage: 10 },
      }) as any;

      const messages: UIMessage[] = (result.messages || []).map((msg: any) => {
        const parts: any[] = [];

        for (const part of msg.content?.parts || []) {
          if (part.type === 'text' && part.text) {
            parts.push({ type: 'text', text: part.text });
          } else if (part.type === 'reasoning') {
            parts.push({ type: 'reasoning', text: part.reasoning || '', details: part.details });
          } else if (part.type === 'tool-invocation') {
            parts.push({ type: 'tool-invocation', toolInvocation: part.toolInvocation });
          }
        }

        if (parts.length === 0 && msg.content?.content) {
          parts.push({ type: 'text', text: msg.content.content });
        }

        const createdAt = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);

        return {
          id: msg.id,
          role: msg.role,
          parts,
          createdAt,
        } as any;
      });

      const sortedMessages = [...messages].sort((a: any, b: any) => {
        const timeA = a.createdAt.getTime();
        const timeB = b.createdAt.getTime();
        if (timeA === timeB) {
          if (a.role === 'user' && b.role !== 'user') return -1;
          if (a.role !== 'user' && b.role === 'user') return 1;
          return 0;
        }
        return timeA - timeB;
      });

      return {
        messages: sortedMessages,
        hasMore: result?.hasMore ?? false,
        page,
      };
    } catch (error: any) {
      console.error('Error loading messages:', error);
      const message = error?.message ?? '';
      if (message.includes('404') || message.includes('Thread not found')) {
        router.replace('/chat/new');
      }
      return { messages: [], hasMore: false, page };
    }
  }, [threadId, agentId, router]);

  useEffect(() => {
    async function loadInitialMessages() {
      setIsLoading(true);
      const result = await loadMessages(0);
      setHistoricalMessages(result.messages);
      setHasMore(result.hasMore);
      setIsLoading(false);
      setIsInitialLoading(false);
    }
    loadInitialMessages();
  }, [threadId, agentId, loadMessages]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const currentCount = historicalMessages.length;
    const result = await loadMessages(currentCount);

    if (result.messages.length > 0) {
      setHistoricalMessages(prev => [...prev, ...result.messages]);
    }
    setHasMore(result.hasMore);
    setIsLoading(false);
  }, [isLoading, hasMore, historicalMessages.length, loadMessages]);

  return {
    historicalMessages,
    loadMore,
    hasMore,
    isLoading,
    isInitialLoading,
  };
}