import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Monthly 50/30/20 Budget Planning View', () => {
  test('navigates to budgets, switches to 50/30/20 tab and renders monthly distribution pillars', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/presupuestos');
    await expect(
      authenticatedPage.getByRole('heading', { level: 1, name: 'Presupuestos Mensuales' }),
    ).toBeVisible();

    // 1. Verify view switcher tabs
    const categoriesTab = authenticatedPage.getByRole('button', { name: /Límites por Categoría/i });
    const ruleTab = authenticatedPage.getByRole('button', { name: /Regla 50\/30\/20/i });

    await expect(categoriesTab).toBeVisible();
    await expect(ruleTab).toBeVisible();

    // 2. Click 50/30/20 Tab
    await ruleTab.click();

    // 3. Verify 50/30/20 dashboard elements
    await expect(
      authenticatedPage.getByText(/Planificación Mensual — Regla 50\/30\/20/i),
    ).toBeVisible();
    await expect(
      authenticatedPage.getByText(/Ingreso Neto Total del Mes/i),
    ).toBeVisible();

    // 4. Verify 3 Pillars
    await expect(authenticatedPage.getByRole('heading', { name: '50% Necesidades' })).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: '30% Deseos' })).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: '20% Ahorro' })).toBeVisible();

    // 5. Click on '30% Deseos' card to inspect tab switching
    await authenticatedPage.getByRole('heading', { name: '30% Deseos' }).click();
    await expect(
      authenticatedPage.getByText(/Desglose Detallado: Deseos y Estilo de Vida \(30%\)/i),
    ).toBeVisible();

    // 6. Switch back to categories view
    await categoriesTab.click();
    await expect(
      authenticatedPage.getByText(/Planificación Mensual — Regla 50\/30\/20/i),
    ).toBeHidden();
  });
});
