import type { ReactNode } from 'react';
import { ApiError, userFacingMessage } from '../lib/http';

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} />)}
    </div>
  );
}

export function AsyncState({
  loading,
  error,
  empty,
  onRetry,
  emptyTitle,
  emptyBody,
  signInHref,
  children
}: {
  loading: boolean;
  error: unknown;
  empty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
  signInHref?: string;
  children: ReactNode;
}) {
  if (loading) return <SkeletonList />;
  if (error) {
    const unauthenticated = error instanceof ApiError && error.status === 401;
    return (
      <div className="state-panel error-state" role="alert">
        <strong>{userFacingMessage(error, 'This information is temporarily unavailable.')}</strong>
        <p>You can try again in a moment.</p>
        {unauthenticated && signInHref ? <a className="primary" href={signInHref}>Sign in</a> : onRetry && <button type="button" onClick={onRetry}>Retry</button>}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="state-panel">
        <h3>{emptyTitle ?? 'Nothing to show yet'}</h3>
        <p>{emptyBody ?? 'When records exist, they will appear here.'}</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function DecisionSupport({ children }: { children: ReactNode }) {
  return <p className="decision-label">{children}</p>;
}
