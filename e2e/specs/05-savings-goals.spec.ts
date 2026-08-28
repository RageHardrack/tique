import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Metas de Ahorro E2E', () => {
  test('muestra metas de ahorro y permite abrir el modal de nueva meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/metas');
    await expect(authenticatedPage.getByRole('heading', { name: 'Metas de Ahorro', exact: true })).toBeVisible();

    const newGoalBtn = authenticatedPage.getByRole('button', { name: 'Nueva Meta' });
    await expect(newGoalBtn).toBeVisible();
    await newGoalBtn.click();

    // Validar modal abierto
    await expect(authenticatedPage.getByRole('heading', { name: 'Nueva Meta de Ahorro' })).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder('Ej: Fondo de Emergencia, Vacaciones, Laptop')).toBeVisible();

    // Cerrar modal
    const closeBtn = authenticatedPage.getByRole('button', { name: 'Cancelar' });
    await closeBtn.click();
    await expect(authenticatedPage.getByRole('heading', { name: 'Nueva Meta de Ahorro' })).not.toBeVisible();
  });
});
