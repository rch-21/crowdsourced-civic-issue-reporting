import { useCallback, useEffect, useState } from 'react';
import { listQueuedReports, offlineQueueEvents, syncOfflineQueue, type QueuedReport } from '../lib/offlineQueue';

/** Tracks connectivity and the offline report queue so any screen can show a live count. */
export function useOfflineQueue() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [queued, setQueued] = useState<QueuedReport[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => { listQueuedReports().then(setQueued); }, []);

  useEffect(() => {
    refresh();
    const handleChanged = () => refresh();
    const handleOnline = () => { setOnline(true); refresh(); };
    const handleOffline = () => setOnline(false);
    offlineQueueEvents.addEventListener('changed', handleChanged);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      offlineQueueEvents.removeEventListener('changed', handleChanged);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  async function syncNow() {
    setSyncing(true);
    try { await syncOfflineQueue(); } finally { setSyncing(false); refresh(); }
  }

  return { online, queued, syncing, syncNow };
}
