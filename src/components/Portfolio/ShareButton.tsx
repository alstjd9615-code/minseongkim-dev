import { useState } from 'react';
import type { Portfolio } from '../../types';
import { updatePortfolioVisibility } from '../../api/portfolio';

interface ShareButtonProps {
  portfolio: Portfolio;
  onUpdate: (updated: Portfolio) => void;
}

export function ShareButton({ portfolio, onUpdate }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/portfolio/${portfolio.id}`;

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const updated = await updatePortfolioVisibility(portfolio.sessionId, !portfolio.isPublic);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update portfolio visibility', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${portfolio.isPublic ? 'rgba(22,163,74,0.4)' : 'var(--border)'}`,
          background: portfolio.isPublic ? 'rgba(22,163,74,0.1)' : 'transparent',
          color: portfolio.isPublic ? '#16a34a' : 'var(--text)',
          fontSize: 13,
          fontWeight: 500,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {portfolio.isPublic ? '🔓 공개 중' : '🔒 비공개'}
      </button>

      {portfolio.isPublic && (
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--accent-border)',
            background: copied ? 'rgba(22,163,74,0.1)' : 'var(--accent-bg)',
            color: copied ? '#16a34a' : 'var(--accent)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✅ 복사됨!' : '🔗 링크 복사'}
        </button>
      )}
    </div>
  );
}
