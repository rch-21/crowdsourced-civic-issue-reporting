import { createReport } from '../reporting/api';

const DB_NAME = 'civic-offline';
const DB_VERSION = 1;
const STORE = 'pending-reports';

export type QueuedReportPayload = {
  categoryId: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  media?: { storageKey: string; mediaType: string; fileSize: number; dataUrl: string }[];
};

export type QueuedReport = {
  id: string;
  payload: QueuedReportPayload;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

/**
 * A small IndexedDB-backed queue so a citizen can submit a report while offline
 * (or when the request fails due to a flaky connection) without losing the report.
 * The queue is drained automatically once the browser reports 'online', and can
 * also be triggered manually.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('INDEXEDDB_UNAVAILABLE')); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('INDEXEDDB_OPEN_FAILED'));
  });
}

export const offlineQueueEvents = new EventTarget();

function emitChanged() {
  offlineQueueEvents.dispatchEvent(new Event('changed'));
}

export async function queueReport(payload: QueuedReportPayload): Promise<string> {
  const db = await openDb();
  const record: QueuedReport = { id: crypto.randomUUID(), payload, createdAt: new Date().toISOString(), attempts: 0 };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('QUEUE_WRITE_FAILED'));
  });
  db.close();
  emitChanged();
  return record.id;
}

export async function listQueuedReports(): Promise<QueuedReport[]> {
  try {
    const db = await openDb();
    const rows = await new Promise<QueuedReport[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as QueuedReport[]);
      request.onerror = () => reject(request.error ?? new Error('QUEUE_READ_FAILED'));
    });
    db.close();
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

async function removeQueuedReport(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('QUEUE_DELETE_FAILED'));
  });
  db.close();
}

async function markAttempt(id: string, error: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const record = getRequest.result as QueuedReport | undefined;
      if (record) store.put({ ...record, attempts: record.attempts + 1, lastError: error });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('QUEUE_UPDATE_FAILED'));
  });
  db.close();
}

let syncing = false;

/**
 * Drains the offline queue, submitting each pending report to the server in order.
 * Failures (still offline, or a transient server error) are left in the queue with
 * an incremented attempt count rather than dropped, so nothing is silently lost.
 */
export async function syncOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  if (syncing || !navigator.onLine) return { synced: 0, remaining: (await listQueuedReports()).length };
  syncing = true;
  let synced = 0;
  try {
    const queued = await listQueuedReports();
    for (const item of queued) {
      try {
        await createReport(item.payload);
        await removeQueuedReport(item.id);
        synced += 1;
        emitChanged();
      } catch (err) {
        await markAttempt(item.id, err instanceof Error ? err.message : 'SYNC_FAILED');
        emitChanged();
        if (!navigator.onLine) break; // stop the batch if we just dropped offline again
      }
    }
  } finally {
    syncing = false;
  }
  const remaining = (await listQueuedReports()).length;
  return { synced, remaining };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void syncOfflineQueue(); });
}
