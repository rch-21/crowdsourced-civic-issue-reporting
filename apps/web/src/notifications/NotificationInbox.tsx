import { useEffect, useState } from 'react';
import { listNotifications, type NotificationRow } from './api';
import { AsyncState } from '../ui/AsyncState';

export function NotificationInbox() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    listNotifications().then(setItems).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <p className="eyebrow">UPDATES</p>
      <h2>Notifications</h2>
      <p className="muted">These are records from the notification outbox. Delivery providers are not configured in this environment.</p>
      <AsyncState loading={loading} error={error} empty={!items.length} onRetry={load} emptyTitle="No notifications yet" emptyBody="Status changes and assignments will appear here when the service records them.">
        {items.map((n) => (
          <article className="report-card" key={n.id}>
            <div>
              <strong>{n.event_type.replaceAll('_', ' ')}</strong>
              <span className="status-pill">{n.status}</span>
            </div>
            <small>{n.channel} · {new Date(n.created_at).toLocaleString()}</small>
          </article>
        ))}
      </AsyncState>
    </section>
  );
}
