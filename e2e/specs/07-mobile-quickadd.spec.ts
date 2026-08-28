import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Mobile Quick-Add Bottom Sheet E2E', () => {
  test('abre el modal/bottom sheet de registro rápido', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // El botón flotante o botón de registro rápido
    const quickAddBtn = authenticatedPage.getByRole('button', { name: 'Registro Rápido' }).or(authenticatedPage.locator('button[aria-label="Registro rápido de movimiento"]')).first();
    await expect(quickAddBtn).toBeVisible();
    await quickAddBtn.click();

    // Validar modal abierto
    await expect(authenticatedPage.getByText('Registro Rápido').first()).toBeVisible();
    await expect(authenticatedPage.getByText(/Monto \(/).first()).toBeVisible();

    // Cerrar
    const cancelBtn = authenticatedPage.getByRole('button', { name: 'Cancelar' });
    await cancelBtn.click();
    await expect(authenticatedPage.getByText('Registro Rápido')).not.toBeVisible();
  });
});
