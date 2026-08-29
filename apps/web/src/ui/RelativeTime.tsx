import { useEffect, useState } from 'react';

export function formatRelativeSla(targetDate: Date, now: Date = new Date()) {
  const diffMs = targetDate.getTime() - now.getTime();
  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);
  const isPast = diffMs < 0;

  let timeString = '';
  if (absDiffSec < 60) {
    timeString = `${absDiffSec}s`;
  } else if (absDiffSec < 3600) {
    const mins = Math.floor(absDiffSec / 60);
    timeString = `${mins}m`;
  } else if (absDiffSec < 86400) {
    const hours = Math.floor(absDiffSec / 3600);
    timeString = `${hours}h`;
  } else {
    const days = Math.floor(absDiffSec / 86400);
    timeString = `${days}d`;
  }

  if (isPast) {
    return {
      text: `Overdue by ${timeString}`,
      status: 'overdue',
      urgency: 'critical' as const
    };
  }

  if (diffMs < 24 * 3600 * 1000) {
    return {
      text: `Due in ${timeString}`,
      status: 'due-soon',
      urgency: 'warning' as const
    };
  }

  return {
    text: `Due in ${timeString}`,
    status: 'due-ok',
    urgency: 'normal' as const
  };
}

export function RelativeTime({
  date,
  isSla = true,
  className = ''
}: {
  date: string | Date | null | undefined;
  isSla?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  if (!date) return null;

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(targetDate.getTime())) return null;

  if (isSla) {
    const { text, status } = formatRelativeSla(targetDate, now);
    return (
      <span
        className={`relative-time-badge ${status} ${className}`}
        title={`Exact: ${targetDate.toLocaleString()}`}
      >
        {text}
      </span>
    );
  }

  return (
    <span className={`relative-time ${className}`} title={targetDate.toLocaleString()}>
      {targetDate.toLocaleString()}
    </span>
  );
}
