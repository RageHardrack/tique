import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('E2E - Date Precision and Transaction Deletion', () => {
  test('creates transaction on 2026-09-06 and verifies exact calendar date without previous-day shift', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage.getByRole('heading', { name: 'Movimientos', exact: true })).toBeVisible();

    // Click "Nuevo Movimiento"
    const newTxBtn = authenticatedPage.getByRole('button', { name: /Nuevo Movimiento/i });
    await newTxBtn.click();

    // Fill form
    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Enter amount
    const amountInput = modal.getByPlaceholder('0.00');
    await amountInput.fill('75.50');

    // Enter date 2026-09-06
    const dateInput = modal.locator('input[type="date"]');
    await dateInput.fill('2026-09-06');

    // Enter note
    const noteInput = modal.getByPlaceholder(/Ej: Supermercado/i);
    await noteInput.fill('Prueba Fecha 06-09');

    // Submit
    const submitBtn = modal.getByRole('button', { name: /Guardar Movimiento|Guardar/i });
    await submitBtn.click();
    await expect(modal).toBeHidden();

    // Verify transaction appears with 06 sep 2026
    const createdItem = authenticatedPage.locator('article', { hasText: 'Prueba Fecha 06-09' }).first();
    await expect(createdItem).toBeVisible();
    await expect(createdItem.getByText(/06 sep 2026/i)).toBeVisible();

    // Verify it does NOT say 05 sep 2026
    await expect(createdItem.getByText(/05 sep 2026/i)).toBeHidden();

    // Edit transaction to test date prefill in modal
    const editBtn = createdItem.getByRole('button', { name: /Editar movimiento/i });
    await editBtn.click();
    await expect(modal).toBeVisible();
    await expect(dateInput).toHaveValue('2026-09-06');

    // Change date to 2026-09-15
    await dateInput.fill('2026-09-15');
    await submitBtn.click();
    await expect(modal).toBeHidden();

    // Verify updated date on list
    await expect(createdItem.getByText(/15 sep 2026/i)).toBeVisible();

    // Delete the transaction
    authenticatedPage.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = createdItem.getByRole('button', { name: /Eliminar movimiento/i });
    await deleteBtn.click();

    // Verify item is removed from DOM
    await expect(createdItem).toBeHidden();
  });
});
