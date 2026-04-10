import { useEffect, useRef } from 'react';
import type { ChatSession } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import styles from './Chat.module.css';

interface ChatInterfaceProps {
  session: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onReset: () => void;
  title?: string;
  emptyStateIcon?: string;
  emptyStateText?: string;
  placeholder?: string;
}

export function ChatInterface({
  session,
  isLoading,
  error,
  onSend,
  onReset,
  title = '💬 AI 포트폴리오 생성',
  emptyStateIcon = '✨',
  emptyStateText = 'AI에게 자신을 소개해주세요.\n포트폴리오를 자동으로 생성해드립니다.',
  placeholder,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isLoading]);

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <h2>{title}</h2>
        {session && (
          <button className={styles.resetButton} onClick={onReset}>
            새로 시작
          </button>
        )}
      </div>

      <div className={styles.messageList}>
        {!session || session.messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span>{emptyStateIcon}</span>
            <p>{emptyStateText.split('\n').map((line, i) => (
              <span key={i}>{line}{i < emptyStateText.split('\n').length - 1 ? <br /> : null}</span>
            ))}</p>
          </div>
        ) : (
          session.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.avatar}>🤖</div>
            <div className={styles.typingDots}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <div className={styles.inputArea}>
        <ChatInput onSend={onSend} disabled={isLoading} placeholder={placeholder} />
      </div>
    </div>
  );
}
