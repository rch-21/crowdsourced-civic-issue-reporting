import { useEffect, useState } from 'react';
import { homePath } from './nav';
import type { User } from '../auth/api';

export type AppRoute = { path: string; screen: string; id?: string };

export function parseHash(hash: string): AppRoute {
  const raw = (hash.startsWith('#') ? hash.slice(1) : hash) || '/';
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'incidents' && parts[1]) return { path: raw.startsWith('/') ? raw : `/${raw}`, screen: 'incident', id: parts[1] };
  if (parts[0] === 'reports' && parts[1]) return { path: raw.startsWith('/') ? raw : `/${raw}`, screen: 'report-detail', id: parts[1] };
  const screen = parts[0] ?? 'home';
  return { path: `/${screen}`, screen };
}

export function navigate(path: string) {
  const next = path.startsWith('/') ? path : `/${path}`;
  if (window.location.hash === `#${next}`) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = next;
}

export function useRoute(user: User | null): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash));
  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!user) return;
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      navigate(homePath(user.role));
    }
  }, [user]);
  return route;
}
