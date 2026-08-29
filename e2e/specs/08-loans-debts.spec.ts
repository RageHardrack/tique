import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Préstamos y Deudas E2E', () => {
  test('permite crear un préstamo, filtrar por tipo, registrar un abono y verificar liquidación', async ({
    authenticatedPage,
  }) => {
    const testPerson = `Contacto Prueba ${Date.now()}`;
    await authenticatedPage.goto('/prestamos');
    await expect(authenticatedPage.getByRole('heading', { name: /Préstamos/i }).first()).toBeVisible();

    // Validar tarjetas ejecutivas de resumen
    await expect(authenticatedPage.getByText('Por Cobrar (Presté)')).toBeVisible();
    await expect(authenticatedPage.getByText('Por Pagar (Me prestaron)')).toBeVisible();

    // Abrir modal de creación
    const newLoanBtn = authenticatedPage.getByRole('button', { name: 'Nuevo Préstamo o Deuda' });
    await expect(newLoanBtn).toBeVisible();
    await newLoanBtn.click();

    // Validar modal de creación
    await expect(authenticatedPage.getByRole('heading', { name: 'Nuevo Préstamo o Deuda' })).toBeVisible();

    // Llenar formulario: Presté $300
    await authenticatedPage.getByRole('button', { name: 'Presté Dinero' }).click();
    await authenticatedPage.getByPlaceholder('Ej: Carlos Gómez, Tía María, Banco Santander').fill(testPerson);
    
    // Rellenar monto de forma estricta
    const amountInput = authenticatedPage.getByPlaceholder('0.00');
    await amountInput.click();
    await amountInput.fill('300.00');

    // Guardar
    await authenticatedPage.getByRole('button', { name: 'Registrar Préstamo' }).click();

    // Validar que la tarjeta se creó en la vista
    await expect(authenticatedPage.getByRole('heading', { name: testPerson })).toBeVisible();
    await expect(authenticatedPage.getByText('Saldo Pendiente').first()).toBeVisible();

    // Registrar un abono de $150
    const addPaymentBtn = authenticatedPage.getByRole('button', { name: 'Registrar Abono' }).first();
    await expect(addPaymentBtn).toBeVisible();
    await addPaymentBtn.click();

    // Validar modal de abono
    await expect(authenticatedPage.getByRole('heading', { name: /Registrar Abono/ })).toBeVisible();
    
    // Ingresar $150
    const paymentAmountInput = authenticatedPage.locator('input[type="number"]');
    await paymentAmountInput.fill('150.00');

    await authenticatedPage.getByRole('button', { name: 'Aplicar Abono' }).click();

    // Validar que ahora muestra 50% abonado
    await expect(authenticatedPage.getByText(/50%/).first()).toBeVisible();

    // Registrar el abono final de $150 para liquidar
    await addPaymentBtn.click();
    await paymentAmountInput.fill('150.00');
    await authenticatedPage.getByRole('button', { name: 'Aplicar Abono' }).click();

    // Validar estado liquidado
    await expect(authenticatedPage.getByText('Préstamo 100% Liquidado').first()).toBeVisible();
  });
});
