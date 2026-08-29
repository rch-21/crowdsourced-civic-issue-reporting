import { useEffect, useState } from 'react';

export function AnimatedNumber({
  value,
  duration = 750,
  prefix = '',
  suffix = '',
  formatter
}: {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNaNValue = isNaN(numericValue);

  const [displayValue, setDisplayValue] = useState<number>(() => (isNaNValue ? 0 : 0));

  useEffect(() => {
    if (isNaNValue) return;

    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = numericValue;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic easing for smooth landing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [numericValue, duration, isNaNValue]);

  if (isNaNValue) {
    return <span>{String(value)}</span>;
  }

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString();

  return (
    <span className="animated-number">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
