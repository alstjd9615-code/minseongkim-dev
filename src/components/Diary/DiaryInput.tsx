import { useState, type FormEvent } from 'react';
import type { DiaryMood } from '../../types';
import { DIARY_MOODS } from '../../types';
import styles from './Diary.module.css';

const MOOD_EMOJI: Record<DiaryMood, string> = {
  '좋음': '😊',
  '보통': '😐',
  '나쁨': '😔',
};

interface DiaryInputProps {
  onSubmit: (content: string, mood?: DiaryMood) => Promise<void>;
  isSubmitting: boolean;
}

export function DiaryInput({ onSubmit, isSubmitting }: DiaryInputProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryMood | undefined>(undefined);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    await onSubmit(content, mood);
    setContent('');
    setMood(undefined);
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
          <div className={styles.moodSelector}>
            {DIARY_MOODS.map(m => (
              <button
                key={m}
                type="button"
                className={`${styles.moodBtn} ${mood === m ? styles.moodBtnActive : ''}`}
                onClick={() => setMood(prev => (prev === m ? undefined : m))}
                disabled={isSubmitting}
                title={m}
              >
                {MOOD_EMOJI[m]} {m}
              </button>
            ))}
          </div>
          <div className={styles.inputRight}>
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
        </div>
      </form>
    </div>
  );
}
