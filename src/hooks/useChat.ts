import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../api/chat';
import type { Message, Portfolio, ChatSession } from '../types';

interface UseChatReturn {
  session: ChatSession | null;
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

export function useChat(): UseChatReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const send = useCallback(async (text: string) => {
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
      const response = await sendMessage({
        sessionId: sessionIdRef.current,
        message: text.trim(),
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

      setPortfolio(response.portfolio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    sessionIdRef.current = undefined;
    setSession(null);
    setPortfolio(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { session, portfolio, isLoading, error, send, reset };
}
