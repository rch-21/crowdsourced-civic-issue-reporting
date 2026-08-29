import type { User } from '../auth/api';

export type NavItem = {
  id: string;
  label: string;
  path: string;
};

export const NAV: Record<string, readonly NavItem[]> = {
  citizen: [
    { id: 'home', label: 'Home', path: '/home' },
    { id: 'report', label: 'Report Issue', path: '/report' },
    { id: 'reports', label: 'My Reports', path: '/reports' },
    { id: 'map', label: 'Map', path: '/map' },
    { id: 'notifications', label: 'Notifications', path: '/notifications' },
    { id: 'profile', label: 'Profile', path: '/profile' }
  ],
  officer: [
    { id: 'operations', label: 'Operations', path: '/operations' },
    { id: 'mine', label: 'My Incidents', path: '/mine' },
    { id: 'map', label: 'Map', path: '/map' },
    { id: 'tasks', label: 'Tasks', path: '/mine' },
    { id: 'notifications', label: 'Notifications', path: '/notifications' },
    { id: 'profile', label: 'Profile', path: '/profile' }
  ],
  supervisor: [
    { id: 'overview', label: 'Overview', path: '/overview' },
    { id: 'queue', label: 'Incident Queue', path: '/queue' },
    { id: 'impact', label: 'Impact', path: '/impact' },
    { id: 'hotspots', label: 'Hotspots', path: '/hotspots' },
    { id: 'root-cause', label: 'Root Cause', path: '/root-cause' },
    { id: 'maintenance', label: 'Maintenance', path: '/maintenance' },
    { id: 'resources', label: 'Resources', path: '/resources' },
    { id: 'departments', label: 'Departments', path: '/departments' },
    { id: 'anomalies', label: 'Anomalies', path: '/anomalies' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' }
  ],
  administrator: [
    { id: 'overview', label: 'Overview', path: '/overview' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' },
    { id: 'health', label: 'System Health', path: '/health' },
    { id: 'queue', label: 'Incident Queue', path: '/queue' }
  ],
  public_viewer: [
    { id: 'overview', label: 'Overview', path: '/overview' },
    { id: 'map', label: 'Map', path: '/map' }
  ]
};

export function navFor(user: User): readonly NavItem[] {
  return NAV[user.role] ?? [];
}

export function homePath(role: User['role']): string {
  if (role === 'citizen') return '/home';
  if (role === 'officer') return '/operations';
  return '/overview';
}
