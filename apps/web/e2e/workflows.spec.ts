import { expect, test, type Page } from '@playwright/test';

async function mockSession(page: Page, role: 'citizen' | 'officer' | 'supervisor' | 'administrator', options: { failReports?: boolean } = {}) {
  await page.addInitScript(() => localStorage.setItem('civic_session', 'e2e-token'));
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('/auth/me')) {
      return route.fulfill({
        json: { user: { id: '00000000-0000-4000-8000-000000000001', role, email: `${role}@civic.test`, displayName: 'E2E User' } }
      });
    }
    if (url.includes('/reports/mine')) {
      if (options.failReports) return route.fulfill({ status: 500, json: { message: 'boom' } });
      return route.fulfill({ json: [] });
    }
    if (url.includes('/public/dashboard')) {
      return route.fulfill({
        json: { summary: { total_reports: 0, total_incidents: 0, active_incidents: 0, resolved_incidents: 0 }, wards: [], departments: [], hotspots: [], trends: [] }
      });
    }
    if (url.includes('/incidents/queue')) return route.fulfill({ json: [] });
    if (url.includes('/officers/me/incidents')) return route.fulfill({ json: [] });
    if (url.includes('/notifications') && method === 'GET') return route.fulfill({ json: [] });
    if (url.includes('/notifications/locale')) return route.fulfill({ json: { locale: 'en' } });
    if (url.includes('/reference/categories')) return route.fulfill({ json: [{ id: '00000000-0000-4000-8000-000000000002', name: 'Pothole', code: 'POTHOLE', description: null }] });
    if (url.includes('/incidents/impact/ranked')) return route.fulfill({ json: [] });
    if (url.includes('/predictive-maintenance/queue')) return route.fulfill({ json: [] });
    if (url.includes('/root-cause/hypotheses')) return route.fulfill({ json: [] });
    if (url.includes('/post-resolution-anomalies')) return route.fulfill({ json: [] });
    if (url.includes('/health')) return route.fulfill({ json: { status: 'ok', service: 'civic-issue-api', version: 'v1', checks: { database: 'up' } } });
    if (url.includes('/auth/logout')) return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: 404, json: { message: 'Not mocked' } });
  });
}

test('unauthenticated users see sign-in, not municipal tools', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await expect(page.getByText('Incident queue')).toHaveCount(0);
});

test('citizen workspace exposes report and my reports, not the officer queue', async ({ page }) => {
  await mockSession(page, 'citizen');
  await page.goto('/#/home');
  await expect(page.getByRole('button', { name: 'Report an issue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My Reports' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Incident Queue' })).toHaveCount(0);
  await page.getByRole('button', { name: 'My Reports' }).click();
  await expect(page.getByText('No reports yet')).toBeVisible();
});

test('officer workspace exposes operations and assignments, not admin health', async ({ page }) => {
  await mockSession(page, 'officer');
  await page.goto('/#/operations');
  await expect(page.getByRole('button', { name: 'Operations' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My Incidents' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'System Health' })).toHaveCount(0);
  await page.getByRole('button', { name: 'My Incidents' }).click();
  await expect(page.getByText('You currently have no active incident assignments.')).toBeVisible();
});

test('supervisor workspace exposes impact and prevention tools', async ({ page }) => {
  await mockSession(page, 'supervisor');
  await page.goto('/#/overview');
  await expect(page.getByRole('button', { name: 'Impact' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Root Cause' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Maintenance' })).toBeVisible();
  await page.getByRole('button', { name: 'Impact' }).click();
  await expect(page.getByText('Decision support')).toBeVisible();
});

test('administrator sees system health and not citizen reporting CTA', async ({ page }) => {
  await mockSession(page, 'administrator');
  await page.goto('/#/health');
  await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Report an issue' })).toHaveCount(0);
  await expect(page.getByText('database', { exact: false })).toBeVisible();
});

test('report form error and retry states stay user-facing', async ({ page }) => {
  await mockSession(page, 'citizen', { failReports: true });
  await page.goto('/#/reports');
  await expect(page.getByText('This information is temporarily unavailable.').or(page.getByText('The civic service is temporarily unavailable.'))).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
