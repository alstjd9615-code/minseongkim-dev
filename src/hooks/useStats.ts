import { useState, useCallback } from 'react';
import { getStats } from '../api/stats';
import type { StatsResponse } from '../types';

interface UseStatsReturn {
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { stats, isLoading, error, load };
}
