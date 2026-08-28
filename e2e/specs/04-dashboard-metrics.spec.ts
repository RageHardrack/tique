import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Dashboard y Métricas E2E', () => {
  test('muestra cards ejecutivas, patrimonio y accesos rápidos', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.getByText('Resumen Ejecutivo')).toBeVisible();
    await expect(authenticatedPage.getByText('Patrimonio Total')).toBeVisible();
    await expect(authenticatedPage.getByText('Ingresos del Mes')).toBeVisible();
    await expect(authenticatedPage.getByText('Gastos del Mes')).toBeVisible();
  });
});
