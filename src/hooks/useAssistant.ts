import { useState, useCallback, useRef } from 'react';
import { sendAssistantMessage } from '../api/assistant';
import type { Message, ChatSession } from '../types';

interface UseAssistantReturn {
  session: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  send: (text: string, context?: string) => Promise<void>;
  reset: () => void;
}

export function useAssistant(): UseAssistantReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const send = useCallback(async (text: string, context?: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setSession(prev => {
      const now = new Date().toISOString();
      if (!prev) {
        return {
          sessionId: sessionIdRef.current ?? '',
          messages: [userMessage],
          createdAt: now,
          updatedAt: now,
        };
      }
      return { ...prev, messages: [...prev.messages, userMessage], updatedAt: now };
    });
    setError(null);
    setIsLoading(true);

    try {
      const response = await sendAssistantMessage({
        sessionId: sessionIdRef.current,
        message: text.trim(),
        context,
      });

      sessionIdRef.current = response.sessionId;

      setSession(prev => {
        const now = new Date().toISOString();
        if (!prev) {
          return {
            sessionId: response.sessionId,
            messages: [userMessage, response.message],
            createdAt: now,
            updatedAt: now,
          };
        }
        return {
          ...prev,
          sessionId: response.sessionId,
          messages: [...prev.messages, response.message],
          updatedAt: now,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    sessionIdRef.current = undefined;
    setSession(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { session, isLoading, error, send, reset };
}
