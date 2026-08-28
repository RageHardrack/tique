import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Cuentas y Conciliación Bancaria E2E', () => {
  test('abre el modal de conciliación, calcula discrepancia y realiza el ajuste', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/cuentas');
    await expect(authenticatedPage.getByText('Cuentas & Billeteras')).toBeVisible();

    // Localizar botón de Conciliar en la primera tarjeta de cuenta
    const reconcileBtn = authenticatedPage.getByRole('button', { name: 'Conciliar' }).first();
    await expect(reconcileBtn).toBeVisible();
    await reconcileBtn.click();

    // Validar apertura del modal
    await expect(authenticatedPage.getByRole('heading', { name: /Conciliación/ })).toBeVisible();
    await expect(authenticatedPage.getByText('Saldo Registrado')).toBeVisible();
    await expect(authenticatedPage.getByText('Discrepancia')).toBeVisible();

    // Ingresar saldo real
    const realBalanceInput = authenticatedPage.locator('input[type="number"]');
    await realBalanceInput.fill('6500.00');

    // Motivo
    const noteInput = authenticatedPage.locator('input[placeholder*="Intereses bancarios"]');
    if (await noteInput.isVisible()) {
      await noteInput.fill('Ajuste E2E Test');
    }

    // Botón aplicar ajuste
    const applyBtn = authenticatedPage.getByRole('button', { name: 'Aplicar Ajuste' });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Esperar cierre del modal
    await expect(authenticatedPage.getByText('Conciliación y Ajuste de Saldo')).not.toBeVisible();
  });
});
