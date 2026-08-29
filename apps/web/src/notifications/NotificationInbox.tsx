import { useEffect, useState } from 'react';
import { listNotifications, type NotificationRow } from './api';
import { AsyncState } from '../ui/AsyncState';
import { navigate } from '../lib/route';

export function NotificationInbox() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    listNotifications().then(setItems).catch(setError).finally(() => setLoading(false));
  }

  useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, []);

  return (
    <section>
      <p className="eyebrow">UPDATES</p>
      <h2>Notifications</h2>
      <p className="muted">These are records from the notification outbox. Delivery providers are not configured in this environment.</p>
      <AsyncState loading={loading} error={error} empty={!items.length} onRetry={load} emptyTitle="No notifications yet" emptyBody="Status changes and assignments will appear here when the service records them.">
        {items.map((n) => (
          <article className="report-card" key={n.id} onClick={() => typeof n.payload?.reportId === 'string' && navigate(`/reports/${n.payload.reportId}`)} style={{ cursor: typeof n.payload?.reportId === 'string' ? 'pointer' : 'default' }}>
            <div>
              <strong>{n.title_key || n.event_type.replaceAll('_', ' ')}</strong>
              <span className="status-pill">{n.status}</span>
            </div>
            <p>{n.body_key}</p>
            <small>{n.channel} · {new Date(n.created_at).toLocaleString()}</small>
          </article>
        ))}
      </AsyncState>
    </section>
  );
}
