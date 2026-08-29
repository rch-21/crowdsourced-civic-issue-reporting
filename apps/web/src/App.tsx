import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { AuthScreen } from './auth/AuthScreen';
import { logout, me, type User } from './auth/api';
import { ReportForm } from './reporting/ReportForm';
import { ReportList } from './reporting/ReportList';
import { ReportDetail } from './reporting/ReportDetail';
import { PublicDashboard } from './public/PublicDashboard';
import { IncidentQueue } from './incident/IncidentQueue';
import { IncidentDetail } from './incident/IncidentDetail';
import { OfficerWork } from './incident/OfficerWork';
import { ImpactPanel } from './impact/ImpactPanel';
import { RootCausePanel } from './rootCause/RootCausePanel';
import { PredictiveMaintenancePanel } from './predictive/PredictiveMaintenancePanel';
import { PostResolutionAnomalyPanel } from './anomaly/PostResolutionAnomalyPanel';
import { OptimizationPanel } from './optimization/OptimizationPanel';
import { LanguageSelector } from './i18n/LanguageSelector';
import { NotificationInbox } from './notifications/NotificationInbox';
import { CivicMap } from './map/CivicMap';
import { SystemHealth } from './admin/SystemHealth';
import { saveLocale } from './notifications/api';
import type { Locale } from './i18n';
import { navFor } from './lib/nav';
import { navigate, useRoute } from './lib/route';
import { incidentQueue } from './incident/api';
import { AnimatedNumber } from './ui/AnimatedNumber';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('civic_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const route = useRoute(user);
  const items = useMemo(() => (user ? navFor(user) : []), [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civic_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    me().then((x) => setUser(x.user)).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p>Checking your secure session…</p>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={() => me().then((x) => setUser(x.user))} />;

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Civic<span>Issue</span></strong>
          <small>Municipal civic intelligence</small>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <LanguageSelector
            value={locale}
            onChange={(v) => {
              setLocale(v);
              saveLocale(v).catch(() => undefined);
            }}
          />
          <span className="user-chip">{user.displayName}</span>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label="Primary">
          <div className="role-label">{user.role === 'administrator' ? 'Municipal Administrator' : user.role}</div>
          {items.map((item) => (
            <button
              key={item.id}
              className={route.path === item.path || (item.path === '/reports' && route.screen === 'report-detail') || (item.path === '/queue' && route.screen === 'incident') ? 'nav-item active' : 'nav-item'}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <main className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{user.role.replaceAll('_', ' ').toUpperCase()}</p>
              <h1>{heading(user, route.screen)}</h1>
            </div>
            {user.role === 'citizen' && route.screen !== 'report' && (
              <button className="primary" onClick={() => navigate('/report')}>Report an issue</button>
            )}
          </div>
          {renderScreen(user, route.screen, route.id)}
        </main>
      </div>
    </div>
  );
}

function heading(user: User, screen: string) {
  if (screen === 'home') return `Hello, ${user.displayName.split(' ')[0]}.`;
  if (screen === 'incident') return 'Incident intelligence';
  if (screen === 'report-detail') return 'Your report';
  return screen.replaceAll('-', ' ');
}

function renderScreen(user: User, screen: string, id?: string) {
  if (user.role === 'citizen') {
    if (screen === 'report') return <ReportForm onSubmitted={(rid) => navigate(`/reports/${rid}`)} />;
    if (screen === 'reports') return <ReportList />;
    if (screen === 'report-detail' && id) return <ReportDetail id={id} />;
    if (screen === 'map') return <CivicMap operational={false} />;
    if (screen === 'notifications') return <NotificationInbox />;
    if (screen === 'profile') return <Profile user={user} />;
    return <CitizenHome />;
  }

  if (screen === 'incident' && id) return <IncidentDetail id={id} user={user} />;
  if (user.role === 'officer' && ['impact', 'root-cause', 'maintenance', 'resources', 'departments', 'anomalies', 'health', 'hotspots'].includes(screen)) {
    return <section className="empty-state"><h2>Not available for this role</h2><p>Your account does not have access to this workspace.</p></section>;
  }
  if (screen === 'queue' || screen === 'operations' || screen === 'overview') return <Operations user={user} />;
  if (screen === 'impact') return <ImpactPanel />;
  if (screen === 'root-cause') return <RootCausePanel />;
  if (screen === 'maintenance') return <PredictiveMaintenancePanel />;
  if (screen === 'hotspots' || screen === 'analytics') return <PublicDashboard />;
  if (screen === 'resources') return <OptimizationPanel incidentId={id ?? ''} />;
  if (screen === 'departments') return <section className="empty-state"><h2>Departments</h2><p>Open an incident from the queue to coordinate lead and supporting departments.</p></section>;
  if (screen === 'anomalies') return <PostResolutionAnomalyPanel />;
  if (screen === 'mine' || screen === 'tasks') return <OfficerWork />;
  if (screen === 'map') return <CivicMap operational onSelect={(incidentId) => navigate(`/incidents/${incidentId}`)} />;
  if (screen === 'notifications') return <NotificationInbox />;
  if (screen === 'profile') return <Profile user={user} />;
  if (screen === 'health') return user.role === 'administrator' ? <SystemHealth /> : <section className="empty-state"><h2>Not available for this role</h2><p>System health is an administrator workspace.</p></section>;
  return <Operations user={user} />;
}

function CitizenHome() {
  return (
    <div className="citizen-home">
      <section className="hero-card">
        <p className="eyebrow">CITIZEN SERVICES</p>
        <h2>See something that needs fixing?</h2>
        <p>Report it once. Nearby reports can cluster into one civic incident so the city works the physical problem, not fifty copies of the same ticket.</p>
        <button className="primary" onClick={() => navigate('/report')}>Report a civic issue</button>
      </section>
      <div className="home-columns">
        <ReportList />
        <PublicDashboard />
      </div>
      <div style={{ marginTop: 20 }}>
        <CivicMap operational={false} />
      </div>
    </div>
  );
}

function Operations({ user }: { user: User }) {
  const [metrics, setMetrics] = useState({ active: 0, high: 0, sla: 0, resolved: 0 });
  useEffect(() => {
    incidentQueue()
      .then((rows) => {
        setMetrics({
          active: rows.filter((r) => !['resolved', 'closed'].includes(r.status)).length,
          high: rows.filter((r) => ['HIGH', 'CRITICAL'].includes(r.priority)).length,
          sla: rows.filter((r) => r.slaDueAt && new Date(r.slaDueAt) < new Date(Date.now() + 86400000) && !['resolved', 'closed'].includes(r.status)).length,
          resolved: rows.filter((r) => r.status === 'resolved').length
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="operations">
      <section className="ops-metrics">
        <div>
          <strong><AnimatedNumber value={metrics.active} /></strong>
          <span>Active incidents</span>
        </div>
        <div>
          <strong><AnimatedNumber value={metrics.high} /></strong>
          <span>High-impact incidents</span>
        </div>
        <div>
          <strong><AnimatedNumber value={metrics.sla} /></strong>
          <span>SLA at risk (24h)</span>
        </div>
        <div>
          <strong><AnimatedNumber value={metrics.resolved} /></strong>
          <span>Resolved in queue</span>
        </div>
      </section>
      <IncidentQueue />
      {user.role !== 'officer' && (
        <div className="intel-grid">
          <ImpactPanel />
          <PredictiveMaintenancePanel />
        </div>
      )}
    </div>
  );
}

function Profile({ user }: { user: User }) {
  return (
    <section className="profile-panel">
      <p className="eyebrow">ACCOUNT</p>
      <h2>{user.displayName}</h2>
      <p>{user.email}</p>
      <p className="muted">Role comes from the authenticated session. This is not a development role switcher.</p>
    </section>
  );
}
