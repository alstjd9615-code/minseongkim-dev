import { useEffect, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLifeWheel } from '../../hooks/useLifeWheel';
import type { CreateLifeWheelRequest, LifeWheelScores } from '../../types';
import { LIFE_WHEEL_DOMAINS } from '../../types';
import styles from './LifeWheel.module.css';

const DEFAULT_SCORES: LifeWheelScores = {
  건강: 5, 재정: 5, 커리어: 5, 관계: 5, 성장: 5, 여가: 5, 환경: 5, '정신/영적': 5,
};

export function LifeWheelView() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, remove } = useLifeWheel();
  const [scores, setScores] = useState<LifeWheelScores>({ ...DEFAULT_SCORES });
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const radarData = LIFE_WHEEL_DOMAINS.map(domain => ({
    domain,
    value: scores[domain],
    fullMark: 10,
  }));

  const handleScoreChange = (domain: keyof LifeWheelScores, value: number) => {
    setScores(prev => ({ ...prev, [domain]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateLifeWheelRequest = { scores, note: note.trim() || undefined };
    const result = await submit(payload);
    if (result) {
      setNote('');
      setSuccessMsg('✅ 인생의 수레바퀴가 저장되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const average = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / LIFE_WHEEL_DOMAINS.length * 10
  ) / 10;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🎡 인생의 수레바퀴</h2>
        <p>8가지 삶의 영역을 점수로 평가하고 균형을 확인하세요</p>
      </div>

      <div className={styles.mainGrid}>
        {/* 왼쪽: 슬라이더 입력 */}
        <form className={styles.scoreForm} onSubmit={handleSubmit}>
          <div className={styles.scoreList}>
            {LIFE_WHEEL_DOMAINS.map(domain => (
              <div key={domain} className={styles.scoreRow}>
                <div className={styles.scoreLabel}>
                  <span className={styles.scoreDomain}>{domain}</span>
                  <span className={styles.scoreValue}>{scores[domain]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={scores[domain]}
                  onChange={e => handleScoreChange(domain, Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            ))}
          </div>
          <div className={styles.avgBadge}>평균 점수: <strong>{average}</strong> / 10</div>
          <textarea
            className={styles.noteArea}
            placeholder="오늘의 메모 (선택사항)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          {error && <div className={styles.errorMsg}>{error}</div>}
          {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? '저장 중…' : '💾 저장하기'}
            </button>
          </div>
        </form>

        {/* 오른쪽: 레이더 차트 */}
        <div className={styles.chartBox}>
          <div className={styles.chartTitle}>현재 점수 시각화</div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 12, fill: 'var(--text)' }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={6} />
              <Radar
                name="점수"
                dataKey="value"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.35}
              />
              <Tooltip formatter={(v) => [`${String(v)}점`]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 기록 히스토리 */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h3>📋 기록 히스토리</h3>
          <span className={styles.countBadge}>{entries.length}개</span>
        </div>
        {isLoading && <div className={styles.loadingMsg}>불러오는 중…</div>}
        {!isLoading && entries.length === 0 && (
          <div className={styles.emptyMsg}>아직 기록이 없습니다. 첫 번째 수레바퀴를 저장해보세요!</div>
        )}
        <div className={styles.historyList}>
          {entries.map(entry => {
            const avg = Math.round(
              Object.values(entry.scores).reduce((a, b) => a + b, 0) / LIFE_WHEEL_DOMAINS.length * 10
            ) / 10;
            const weakest = LIFE_WHEEL_DOMAINS.reduce((min, d) =>
              entry.scores[d] < entry.scores[min] ? d : min
            );
            return (
              <div key={entry.wheelId} className={styles.historyCard}>
                <div className={styles.historyCardTop}>
                  <div className={styles.historyDate}>
                    {new Date(entry.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </div>
                  <div className={styles.historyAvg}>평균 {avg}점</div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => void remove(entry.wheelId)}
                    title="삭제"
                  >✕</button>
                </div>
                <div className={styles.historyScores}>
                  {LIFE_WHEEL_DOMAINS.map(d => (
                    <div key={d} className={styles.historyScoreItem}>
                      <span className={styles.historyDomain}>{d}</span>
                      <div className={styles.historyBar}>
                        <div
                          className={styles.historyBarFill}
                          style={{ width: `${entry.scores[d] * 10}%` }}
                        />
                      </div>
                      <span className={styles.historyScore}>{entry.scores[d]}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.historyFooter}>
                  <span className={styles.weakLabel}>💡 개선 필요: <strong>{weakest}</strong></span>
                  {entry.note && <span className={styles.historyNote}>{entry.note}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
