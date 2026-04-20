import { useEffect, useRef, useState } from 'react';
import { useTasksContext } from '../../contexts/useTasksContext';
import type { TaskEntry } from '../../types';
import styles from './FocusMode.module.css';

const DEFAULT_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;

interface Props {
  task: TaskEntry | null;
  onComplete: () => void;
  onExit: () => void;
}

interface SessionProps {
  task: TaskEntry;
  onComplete: () => void;
  onExit: () => void;
}

function FocusSession({ task, onComplete, onExit }: SessionProps) {
  const { update } = useTasksContext();
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick effect: count down when running
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Phase transition effect: fires when timer reaches 0 while running
  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;
    setIsRunning(false);
    if (phase === 'focus') {
      setCycles(c => c + 1);
      setPhase('break');
      setSecondsLeft(SHORT_BREAK_MINUTES * 60);
    } else {
      setPhase('focus');
      setSecondsLeft(DEFAULT_MINUTES * 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = phase === 'focus' ? DEFAULT_MINUTES * 60 : SHORT_BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const handleToggle = () => setIsRunning(v => !v);
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(phase === 'focus' ? DEFAULT_MINUTES * 60 : SHORT_BREAK_MINUTES * 60);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onExit}>← 나가기</button>
        <div className={styles.phaseBadge} data-phase={phase}>
          {phase === 'focus' ? '🔥 집중 세션' : '☕ 짧은 휴식'}
        </div>
        {cycles > 0 && (
          <div className={styles.cyclesBadge}>🍅 {cycles}세트</div>
        )}
      </div>

      <div className={styles.taskCard}>
        <div className={styles.taskLabel}>현재 집중 태스크</div>
        <div className={styles.taskTitle}>{task.title}</div>
        {task.microStep && (
          <div className={styles.microStep}>⚡ 첫 행동: {task.microStep}</div>
        )}
      </div>

      <div className={styles.timerSection}>
        <svg className={styles.timerRing} viewBox="0 0 120 120">
          <circle
            className={styles.ringBg}
            cx="60" cy="60" r="54"
            strokeWidth="8"
          />
          <circle
            className={styles.ringProgress}
            cx="60" cy="60" r="54"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
            data-phase={phase}
          />
        </svg>
        <div className={styles.timerDisplay}>
          <span className={styles.timerMinutes}>{String(minutes).padStart(2, '0')}</span>
          <span className={styles.timerColon}>:</span>
          <span className={styles.timerSeconds}>{String(seconds).padStart(2, '0')}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.resetBtn} onClick={handleReset} title="리셋">
          ↺
        </button>
        <button
          className={[styles.playBtn, isRunning ? styles.playBtnRunning : ''].join(' ')}
          onClick={handleToggle}
        >
          {isRunning ? '⏸ 일시정지' : '▶ 시작'}
        </button>
        {!task.completed && (
          <button
            className={styles.doneBtn}
            onClick={() => {
              void update(task.taskId, { completed: true });
              onComplete();
            }}
            title="완료 처리"
          >
            ✓
          </button>
        )}
      </div>

      <div className={styles.tip}>
        {phase === 'focus'
          ? '💡 지금 이 태스크 하나에만 집중하세요. 다른 생각은 나중에.'
          : '💡 잠깐 쉬고 오세요. 물 한 잔, 스트레칭.'}
      </div>
    </div>
  );
}

export function FocusMode({ task, onComplete, onExit }: Props) {
  if (!task) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <div className={styles.emptyTitle}>집중할 태스크를 선택하세요</div>
          <div className={styles.emptyDesc}>Today Top 3 또는 태스크 목록에서 🎯 버튼을 눌러 집중 모드를 시작하세요.</div>
          <button className={styles.exitBtn} onClick={onExit}>← 홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  // key=task.taskId causes a full remount (fresh timer) whenever the task changes
  return <FocusSession key={task.taskId} task={task} onComplete={onComplete} onExit={onExit} />;
}
