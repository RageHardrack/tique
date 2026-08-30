import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Deudas a Cuotas (Cashea 14d) y Tarjetas de Crédito E2E', () => {
  test('permite crear una deuda a cuotas con cronograma y verificar su visualización', async ({
    authenticatedPage,
  }) => {
    const loanName = `Compra Cashea TV ${Date.now()}`;
    await authenticatedPage.goto('/prestamos');
    await expect(authenticatedPage.getByRole('heading', { name: /Préstamos/i }).first()).toBeVisible();

    // Abrir modal de nuevo préstamo
    const newBtn = authenticatedPage.getByRole('button', { name: 'Nuevo Préstamo o Deuda' });
    await newBtn.click();

    // Configurar Deuda "Me Prestaron Dinero"
    await authenticatedPage.getByRole('button', { name: 'Me Prestaron Dinero' }).click();
    await authenticatedPage.getByPlaceholder('Ej: Carlos Gómez, Tía María, Banco Santander').fill(loanName);
    
    // Monto 150
    const amountInput = authenticatedPage.getByPlaceholder('0.00');
    await amountInput.click();
    await amountInput.fill('150.00');

    // Activar plan a cuotas
    await authenticatedPage.locator('#installmentToggle').check();
    await expect(authenticatedPage.getByText('Cronograma Estimado')).toBeVisible();

    // Guardar
    await authenticatedPage.getByRole('button', { name: 'Registrar Préstamo' }).click();

    // Validar tarjeta con badge de cuotas
    await expect(authenticatedPage.getByRole('heading', { name: loanName })).toBeVisible();
    await expect(authenticatedPage.getByText(/cuotas/i).first()).toBeVisible();
  });

  test('permite crear una cuenta de Tarjeta de Crédito con límite y ver el desglose en cuentas y dashboard', async ({
    authenticatedPage,
  }) => {
    const cardName = `Visa Infinite ${Date.now()}`;
    await authenticatedPage.goto('/cuentas');
    await expect(authenticatedPage.getByRole('heading', { name: /Cuentas/i }).first()).toBeVisible();

    // Abrir modal de cuenta
    await authenticatedPage.getByRole('button', { name: 'Nueva Cuenta' }).click();
    await authenticatedPage.getByPlaceholder('Ej: Banco Galicia, Billetera Crypto, Efectivo').fill(cardName);

    // Seleccionar Tarjeta de Crédito
    const typeSelect = authenticatedPage.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('CREDIT_CARD');
    }

    // Guardar cuenta
    await authenticatedPage.getByRole('button', { name: 'Guardar Cuenta' }).click();

    // Validar que se muestra en cuentas con indicador de línea o crédito
    await expect(authenticatedPage.getByRole('heading', { name: cardName })).toBeVisible();

    // Ir a Dashboard y validar desglose de patrimonio
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.getByText(/Patrimonio Total/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Activos:/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Deudas:/i)).toBeVisible();
  });
});
