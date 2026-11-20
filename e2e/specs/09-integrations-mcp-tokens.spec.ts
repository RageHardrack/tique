import { expect, type Page, test } from '@playwright/test';

/**
 * `/integraciones` E2E (S10-S12, S15, S16). Self-contained: every Guilliman
 * API call is intercepted with page.route, so this spec runs without a real
 * backend. Only the Vite dev server and the stubbed API are needed.
 */
const API_BASE = 'http://guilliman.localhost:1355/api/v1';
const SESSION_TOKEN = 'test-session-jwt';
const SECRET = 'gmcp_E2eToken0123456789abcdefABCDEF01';

interface StubOptions {
  role: 'ADMIN' | 'USER';
  revokeFails?: boolean;
}

type TokenRecord = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

async function installApi(page: Page, options: StubOptions) {
  const records: TokenRecord[] = [
    {
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-01T10:00:00.000Z',
      lastUsedAt: null,
      revokedAt: null,
    },
    {
      id: 'mt-2',
      name: 'Prueba antigua',
      createdAt: '2026-10-01T10:00:00.000Z',
      lastUsedAt: '2026-10-05T10:00:00.000Z',
      revokedAt: '2026-10-06T10:00:00.000Z',
    },
  ];

  const user = {
    id: 'u-1',
    email: `${options.role === 'ADMIN' ? 'daniel' : 'maria'}@lascar.dev`,
    name: options.role === 'ADMIN' ? 'Daniel' : 'Maria',
    role: options.role,
    isActive: true,
    taxProfileEnabled: false,
    taxCountry: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });

    if (path.endsWith('/auth/login') && method === 'POST') {
      return json({ accessToken: SESSION_TOKEN, user });
    }
    if (path.endsWith('/auth/me')) {
      return json(user);
    }
    // Loaded by the layout on startup; answered with real-shaped data so the
    // app never sees an unexpected payload.
    if (path.endsWith('/exchange-rates')) {
      return json({
        baseCurrency: 'USD',
        rates: { USD: 1, PEN: 3.6, VES: 54.1 },
        sources: {},
        lastUpdated: '2026-11-20T00:00:00.000Z',
      });
    }
    if (path.endsWith('/mcp/tokens') && method === 'GET') {
      return json(records);
    }
    if (path.endsWith('/mcp/tokens') && method === 'POST') {
      const name = String(JSON.parse(request.postData() ?? '{}').name);
      const record: TokenRecord = {
        id: 'mt-new',
        name,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        revokedAt: null,
      };
      records.unshift(record);
      return json(
        { id: record.id, name, createdAt: record.createdAt, token: SECRET },
        201,
      );
    }
    if (path.includes('/mcp/tokens/') && method === 'DELETE') {
      if (options.revokeFails) {
        return json({ message: 'No se pudo revocar el token.' }, 500);
      }
      const id = path.split('/').pop() as string;
      const record = records.find((t) => t.id === id);
      if (record) record.revokedAt = new Date().toISOString();
      return json({ success: true });
    }
    // Any other endpoint the app may load at startup: empty list.
    return json([]);
  });
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Integraciones (MCP tokens) E2E with stubbed API (S16)', () => {
  test('ADMIN entra, ve la lista sin secretos, crea un token y el panel de Hermes desaparece al cerrarlo', async ({
    page,
  }) => {
    await installApi(page, { role: 'ADMIN' });
    await login(page, 'daniel@lascar.dev');

    await page.goto('/integraciones');
    await expect(page).toHaveURL(/\/integraciones/);
    await expect(
      page.getByRole('heading', { name: 'Integraciones' }).first(),
    ).toBeVisible();

    // The list shows rows and never any secret material (S12).
    await expect(page.getByTestId('mcp-token-row')).toHaveCount(2);
    await expect(page.locator('body')).not.toContainText('gmcp_');

    // Create: the panel shows the plaintext, the Hermes YAML with the MCP
    // URL derived from the configured API base, and the .env line (S11).
    await page.getByTestId('token-name-input').fill('Token E2E');
    await page.getByTestId('create-token-btn').click();

    const panel = page.getByTestId('issued-token-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(SECRET);
    await expect(panel).toContainText(`${API_BASE}/mcp`);
    await expect(panel).toContainText('${GUILLIMAN_MCP_TOKEN}');
    await expect(panel).toContainText(`GUILLIMAN_MCP_TOKEN=${SECRET}`);

    // Closing removes the plaintext from the DOM and it never touched the
    // storages (S11).
    await page.getByTestId('close-issued-panel').click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('gmcp_');

    const stored = await page.evaluate(() =>
      [localStorage, sessionStorage].flatMap((s) => Object.values(s)).join('|'),
    );
    expect(stored).not.toContain('gmcp_');
  });

  test('un revoke con 500 muestra el error y deja la lista igual', async ({
    page,
  }) => {
    await installApi(page, { role: 'ADMIN', revokeFails: true });
    await login(page, 'daniel@lascar.dev');

    await page.goto('/integraciones');
    await expect(page.getByTestId('mcp-token-row')).toHaveCount(2);

    await page.getByTestId('revoke-token-btn').first().click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Revocar', exact: true })
      .click();

    await expect(page.getByTestId('integrations-error')).toBeVisible();
    await expect(page.getByTestId('integrations-error')).toContainText(
      'No se pudo revocar el token.',
    );

    // The rows are exactly as the API last reported them: nothing revoked (S12).
    await expect(page.getByTestId('mcp-token-row')).toHaveCount(2);
    await expect(page.getByTestId('mcp-token-row').first()).toContainText(
      'Hermes laptop',
    );
    await expect(page.getByTestId('mcp-token-row').first()).toContainText(
      /activo/i,
    );
    await expect(page.getByTestId('mcp-token-row').first()).not.toContainText(
      /revocado/i,
    );
    await expect(page.getByTestId('revoke-token-btn').first()).toBeVisible();
  });

  test('ADMIN ve la entrada Integraciones en el sidebar y en el sheet "Más"', async ({
    page,
    isMobile,
  }) => {
    await installApi(page, { role: 'ADMIN' });
    await login(page, 'daniel@lascar.dev');
    await expect(page).toHaveURL(/\/dashboard/);

    if (isMobile) {
      await page.getByTestId('more-nav-btn').click();
      await expect(page.getByText('Más Secciones')).toBeVisible();
      // The sheet is teleported after the (hidden) sidebar, so the visible
      // entry is the last match.
      await expect(
        page.getByRole('link', { name: 'Integraciones' }).last(),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Usuarios & Accesos' }).last(),
      ).toBeVisible();
    } else {
      await expect(page.locator('a[href="/integraciones"]')).not.toHaveCount(0);
      await expect(page.locator('a[href="/admin/users"]')).not.toHaveCount(0);
    }
  });

  test('un no-ADMIN es redirigido y no ve la entrada en ningún menú', async ({
    page,
    isMobile,
  }) => {
    await installApi(page, { role: 'USER' });
    await login(page, 'maria@lascar.dev');

    await page.goto('/integraciones');
    await expect(page).toHaveURL(/\/dashboard/);

    // No entry in the desktop sidebar (present in the DOM on both projects).
    await expect(page.locator('a[href="/integraciones"]')).toHaveCount(0);

    // And none in the mobile "Más" sheet (S15).
    if (isMobile) {
      await page.getByTestId('more-nav-btn').click();
      await expect(page.getByText('Más Secciones')).toBeVisible();
      await expect(page.getByText('Integraciones')).toHaveCount(0);
      await expect(page.getByText('Usuarios & Accesos')).toHaveCount(0);
    }
  });
});
