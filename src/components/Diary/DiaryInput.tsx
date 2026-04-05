import { useState, type FormEvent } from 'react';
import styles from './Diary.module.css';

interface DiaryInputProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
}

export function DiaryInput({ onSubmit, isSubmitting }: DiaryInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    await onSubmit(content);
    setContent('');
  };

  return (
    <div className={styles.inputArea}>
      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="오늘 읽은 책, 운동 기록, 아이디어... 무엇이든 자유롭게 입력하세요. AI가 자동으로 분류합니다."
          disabled={isSubmitting}
        />
        <div className={styles.inputFooter}>
          <span className={styles.inputHint}>
            {isSubmitting ? '🤖 AI가 분류 중...' : `${content.length} / 5000자`}
          </span>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!content.trim() || isSubmitting || content.length > 5000}
          >
            {isSubmitting ? '분류 중...' : '✨ 기록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
