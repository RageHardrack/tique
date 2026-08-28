import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Autenticación y Navegación E2E', () => {
  test('inicia sesión correctamente y muestra el dashboard', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/.*dashboard/);
    await expect(authenticatedPage.getByText('Resumen Ejecutivo')).toBeVisible();
    await expect(authenticatedPage.getByText('Patrimonio Total')).toBeVisible();
  });

  test('permite navegar entre todos los módulos del sidebar', async ({ authenticatedPage }) => {
    // Cuentas
    await authenticatedPage.goto('/cuentas');
    await expect(authenticatedPage).toHaveURL(/.*cuentas/);
    await expect(authenticatedPage.getByRole('heading', { name: 'Cuentas & Billeteras' })).toBeVisible();

    // Movimientos
    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage).toHaveURL(/.*movimientos/);
    await expect(authenticatedPage.getByRole('heading', { name: 'Movimientos', exact: true })).toBeVisible();

    // Presupuestos
    await authenticatedPage.goto('/presupuestos');
    await expect(authenticatedPage).toHaveURL(/.*presupuestos/);
    await expect(authenticatedPage.getByRole('banner').getByRole('heading', { name: 'Presupuestos Mensuales' })).toBeVisible();

    // Metas de ahorro
    await authenticatedPage.goto('/metas');
    await expect(authenticatedPage).toHaveURL(/.*metas/);
    await expect(authenticatedPage.getByRole('banner').getByRole('heading', { name: 'Metas de Ahorro' })).toBeVisible();

    // Suscripciones
    await authenticatedPage.goto('/suscripciones');
    await expect(authenticatedPage).toHaveURL(/.*suscripciones/);
    await expect(authenticatedPage.getByRole('banner').getByRole('heading', { name: 'Suscripciones & Pagos' })).toBeVisible();

    // Impuestos & SUNAT
    await authenticatedPage.goto('/impuestos');
    await expect(authenticatedPage).toHaveURL(/.*impuestos/);
    await expect(authenticatedPage.getByRole('heading', { name: /Impuestos & SUNAT/ }).first()).toBeVisible();

    // Reportes
    await authenticatedPage.goto('/reportes');
    await expect(authenticatedPage).toHaveURL(/.*reportes/);
    await expect(authenticatedPage.getByRole('banner').getByRole('heading', { name: 'Reportes Financieros' })).toBeVisible();
  });

  test('permite plegar y desplegar la barra lateral en escritorio', async ({ authenticatedPage, isMobile }) => {
    test.skip(isMobile, 'Solo aplicable a viewport de escritorio');

    await authenticatedPage.goto('/dashboard');
    const collapseBtn = authenticatedPage.getByTitle('Plegar barra lateral').first();
    await expect(collapseBtn).toBeVisible();

    // Plegar sidebar
    await collapseBtn.click();
    const expandBtn = authenticatedPage.getByTitle('Expandir barra lateral').first();
    await expect(expandBtn).toBeVisible();

    // Desplegar sidebar
    await expandBtn.click();
    await expect(authenticatedPage.getByTitle('Plegar barra lateral').first()).toBeVisible();
  });
});
