import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Calendario Financiero Unificado E2E', () => {
  test('permite alternar a la pestaña de Calendario Financiero, navegar meses y ver compromisos', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/suscripciones');
    await expect(authenticatedPage.getByRole('heading', { name: /Suscripciones/i }).first()).toBeVisible();

    // Alternar a pestaña Calendario Financiero
    const calendarTabBtn = authenticatedPage.getByRole('button', { name: 'Calendario Financiero' });
    await calendarTabBtn.click();

    // Validar que se muestra el calendario con días y totales
    await expect(authenticatedPage.getByText(/Compromisos del Mes:/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel('Mes siguiente')).toBeVisible();

    // Navegar mes siguiente
    await authenticatedPage.getByLabel('Mes siguiente').click();
    await expect(authenticatedPage.getByText(/Compromisos del Mes:/i)).toBeVisible();
  });
});
