import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Mobile-First Navigation & Viewport Ergonomics E2E', () => {
  test('navegación inferior mobile muestra 4 accesos primarios y drawer "Más" sin overflow', async ({
    authenticatedPage,
  }) => {
    // Forzar viewport móvil estándar (iPhone SE / 375x667)
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // Validar que la barra inferior es visible
    const moreBtn = authenticatedPage.locator('[data-testid="more-nav-btn"]');
    await expect(moreBtn).toBeVisible();

    // Validar que el viewport no tiene scroll horizontal (overflow-x-hidden)
    const hasHorizontalScroll = await authenticatedPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Abrir drawer secundario
    await moreBtn.click();
    await expect(authenticatedPage.getByText('Más Secciones')).toBeVisible();
    await expect(authenticatedPage.getByText('Metas')).toBeVisible();

    // Navegar a Metas desde el drawer
    await authenticatedPage.getByText('Metas').click();
    await expect(authenticatedPage).toHaveURL(/.*metas/);
  });
});
