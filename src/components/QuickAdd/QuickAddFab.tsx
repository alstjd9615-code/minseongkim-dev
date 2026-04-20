import styles from './QuickAdd.module.css';

interface Props {
  onClick: () => void;
}

export function QuickAddFab({ onClick }: Props) {
  return (
    <button
      className={styles.fab}
      onClick={onClick}
      aria-label="태스크 빠른 추가 (Ctrl+K)"
      title="태스크 빠른 추가 (Ctrl+K)"
    >
      ＋
    </button>
  );
}
