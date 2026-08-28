import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Suscripciones y Pagos Recurrentes E2E', () => {
  test('muestra suscripciones activas y permite abrir el modal de registro', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/suscripciones');
    await expect(authenticatedPage.getByRole('banner').getByRole('heading', { name: 'Suscripciones & Pagos' })).toBeVisible();

    const newSubBtn = authenticatedPage.getByRole('button', { name: 'Nueva Suscripción' });
    await expect(newSubBtn).toBeVisible();
    await newSubBtn.click();

    // Validar modal abierto
    await expect(authenticatedPage.getByRole('heading', { name: 'Nueva Suscripción' })).toBeVisible();

    // Cerrar modal
    const closeBtn = authenticatedPage.getByRole('button', { name: 'Cancelar' });
    await closeBtn.click();
    await expect(authenticatedPage.getByRole('heading', { name: 'Nueva Suscripción' })).not.toBeVisible();
  });
});
