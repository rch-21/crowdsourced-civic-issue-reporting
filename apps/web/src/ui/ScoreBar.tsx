import { useEffect, useState } from 'react';

export function ScoreBar({
  score,
  max = 100,
  showLabel = true,
  label,
  className = ''
}: {
  score: number | string;
  max?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}) {
  const numScore = Math.max(0, Math.min(max, typeof score === 'number' ? score : parseFloat(String(score)) || 0));
  const percentage = Math.round((numScore / max) * 100);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Start animation on mount/update
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const tone = percentage >= 75 ? 'tone-critical' : percentage >= 45 ? 'tone-warning' : 'tone-low';

  return (
    <div className={`score-bar-container ${className}`}>
      {showLabel && (
        <div className="score-bar-header">
          <span>{label || 'Score'}</span>
          <strong>{Math.round(numScore)}/{max}</strong>
        </div>
      )}
      <div className="score-bar-track">
        <div
          className={`score-bar-fill ${tone}`}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={Math.round(numScore)}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
