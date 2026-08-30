import { useEffect, useState } from 'react';
import { abuseEvents, abuseSummary, AdminApiError, type AbuseEvent, type AbuseSummary } from './http';

export function AbuseView() {
  const [events, setEvents] = useState<AbuseEvent[]>([]);
  const [summary, setSummary] = useState<AbuseSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setError('');
      const [nextEvents, nextSummary] = await Promise.all([abuseEvents(), abuseSummary()]);
      setEvents(nextEvents);
      setSummary(nextSummary);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Flagged activity is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return <>
    {error && <div className="alert">{error}</div>}
    <section className="metric-grid compact">
      <div className="metric"><strong>{events.length}</strong><span>Recent flagged events</span></div>
      <div className="metric"><strong>{summary?.flaggedUsers.length ?? 0}</strong><span>Flagged users</span></div>
      <div className="metric"><strong>{summary?.byType.reduce((n, x) => n + x.last24h, 0) ?? 0}</strong><span>Events in last 24h</span></div>
    </section>
    <section className="dashboard-grid">
      <div className="panel wide">
        <div className="panel-heading"><div><p className="eyebrow">ABUSE SIGNALS</p><h2>Recent flagged activity</h2></div><span className="count">{events.length}</span></div>
        {loading ? <div className="empty">Loading flagged activity...</div> : !events.length ? <div className="empty">No abuse events have been flagged.</div> : <div className="incident-rows">{events.map((event) => <div className="incident-row" key={event.id}>
          <div className="row-main"><strong>{event.eventType.replaceAll('_', ' ')}</strong><small>{event.userDisplayName ?? 'Anonymous'}</small></div>
          <div className="row-data"><span><b>{new Date(event.createdAt).toLocaleString()}</b><small>detected</small></span><span><b>{event.fingerprint ? `${event.fingerprint.slice(0, 12)}...` : '—'}</b><small>fingerprint</small></span></div>
        </div>)}</div>}
      </div>
      <div className="panel"><p className="eyebrow">BREAKDOWN</p><h2>Event types</h2>{!summary?.byType.length ? <div className="empty">No events recorded.</div> : <div className="signal-list">{summary.byType.map((item) => <div key={item.eventType}><span>{item.eventType.replaceAll('_', ' ')}</span><strong>{item.count}</strong></div>)}</div>}</div>
    </section>
    <section className="panel"><p className="eyebrow">FLAGGED USERS</p><h2>Users requiring review</h2>{!summary?.flaggedUsers.length ? <div className="empty">No users currently require review.</div> : <div className="signal-list">{summary.flaggedUsers.map((user) => <div key={user.userId}><span>{user.userDisplayName ?? user.userId}</span><strong>{user.eventCount} events</strong><small>{new Date(user.lastEventAt).toLocaleString()}</small></div>)}</div>}</section>
  </>;
}
