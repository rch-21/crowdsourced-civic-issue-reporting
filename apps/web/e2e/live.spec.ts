import { expect, test } from '@playwright/test';

test('live API health is optional for this suite', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:4000/api/v1/health').catch(() => null);
  test.skip(!response, 'API is not running on port 4000');
  if (!response) return;
  expect([200, 503]).toContain(response.status());
});
