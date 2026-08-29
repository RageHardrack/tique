import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Custom UI Confirmation Dialogs (No native browser alert/confirm)', () => {
  test('opens custom UI modal on delete, supports cancellation and confirmation without triggering native dialogs', async ({
    authenticatedPage,
  }) => {
    // Fail immediately if any native window.confirm or window.alert is triggered
    authenticatedPage.on('dialog', (dialog) => {
      throw new Error(`Unexpected native browser dialog detected: "${dialog.message()}"`);
    });

    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage.getByRole('heading', { name: 'Movimientos', exact: true })).toBeVisible();

    // 1. Locate the first transaction item in the list
    const targetItem = authenticatedPage.locator('article').first();
    await expect(targetItem).toBeVisible();

    // 2. Click delete -> should open custom UI ConfirmModal (NOT window.confirm)
    const deleteBtn = targetItem.getByRole('button', { name: /Eliminar movimiento/i });
    await deleteBtn.click();

    // 3. Check custom UI ConfirmModal is open
    const confirmModal = authenticatedPage.getByRole('dialog');
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.getByText(/Eliminar movimiento/i)).toBeVisible();
    await expect(confirmModal.getByText(/El saldo de la cuenta será reajustado/i)).toBeVisible();

    // 4. Click "Cancelar" -> should close modal and preserve item
    const cancelBtn = confirmModal.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(confirmModal).toBeHidden();
    await expect(targetItem).toBeVisible();

    // 5. Click delete again -> click "Eliminar" inside UI modal
    await deleteBtn.click();
    await expect(confirmModal).toBeVisible();

    const confirmActionBtn = confirmModal.getByRole('button', { name: 'Eliminar', exact: true });
    await confirmActionBtn.click();
    await expect(confirmModal).toBeHidden();
  });
});
