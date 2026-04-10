import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import styles from './Chat.module.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  return (
    <form className={styles.inputForm} onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder ?? "포트폴리오 정보를 입력하세요 (예: 이름, 경력, 기술 스택)..."}
        rows={1}
        disabled={disabled}
      />
      <button
        type="submit"
        className={styles.sendButton}
        disabled={!value.trim() || disabled}
        aria-label="메시지 전송"
      >
        ↑
      </button>
    </form>
  );
}
