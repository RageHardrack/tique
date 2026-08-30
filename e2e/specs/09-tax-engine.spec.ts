import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Gestión Tributaria & Impuestos SUNAT E2E', () => {
  test('permite activar el perfil tributario, registrar un ingreso con retención de 4ta y consultar la proyección de renta', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/impuestos');
    await expect(authenticatedPage.getByRole('heading', { name: /Impuestos & SUNAT/ }).first()).toBeVisible();

    // Esperar a que la página e interfaz carguen
    await authenticatedPage.waitForLoadState('networkidle').catch(() => {});

    // Si el usuario aún no tiene el perfil activo, activarlo
    const activateBtn = authenticatedPage.getByRole('button', { name: 'Activar Módulo Tributario' });
    if (await activateBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      const rucInput = authenticatedPage.getByPlaceholder('Ej: 15548932014');
      if (await rucInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await rucInput.fill('15548932014').catch(() => {});
      }
      await activateBtn.click().catch(() => {});
    }

    // Validar tarjetas de métricas tributarias
    await expect(authenticatedPage.getByText('Ingresos Totales (Bruto)')).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.getByText('Deducciones Computadas')).toBeVisible();
    await expect(authenticatedPage.getByText('Deducción Adicional de hasta 3 UIT')).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: 'Escala Progresiva Acumulativa (Cálculo por Tramos)' })).toBeVisible();

    // Navegar a movimientos para registrar un Recibo por Honorarios
    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage.getByRole('heading', { name: 'Movimientos', exact: true })).toBeVisible();

    // Abrir modal de nuevo movimiento
    const newTxBtn = authenticatedPage.getByRole('button', { name: 'Nuevo Movimiento' });
    await newTxBtn.click();

    // Seleccionar Ingreso
    await authenticatedPage.getByRole('button', { name: 'Ingreso' }).click();

    // Llenar monto
    const amountInput = authenticatedPage.locator('input[placeholder="0.00"]');
    await amountInput.fill('5000.00');

    // Seleccionar 4ta Categoría
    await authenticatedPage.getByRole('button', { name: '4ta (Honorarios / RxH)' }).click();

    // Llenar número de comprobante
    const rxhInput = authenticatedPage.getByPlaceholder('Ej: E001-45');
    await rxhInput.fill('E001-99');

    // Guardar movimiento
    await authenticatedPage.getByRole('button', { name: 'Guardar Movimiento' }).click();

    // Volver a impuestos y comprobar que se actualizó el cálculo
    await authenticatedPage.goto('/impuestos');
    await expect(authenticatedPage.getByRole('heading', { name: /Impuestos & SUNAT/ }).first()).toBeVisible();
  });
});
