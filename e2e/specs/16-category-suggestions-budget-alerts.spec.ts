import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Sugerencias de Categorías y Alertas de Desviación Presupuestaria E2E', () => {
  test('muestra chip de sugerencia al tipear un concepto conocido en notas de movimiento', async ({
    authenticatedPage,
  }) => {
    // 1. Asegurar que existe una categoría de Transporte
    await authenticatedPage.goto('/categorias');
    await authenticatedPage.getByRole('button', { name: 'Nueva Categoría' }).click();
    const modal = authenticatedPage.locator('[role="dialog"], [data-slot="content"]').first();
    await authenticatedPage.getByPlaceholder('Ej: Supermercado, Salario, Gimnasio').fill('Transporte');
    const savePromise = authenticatedPage.waitForResponse(
      (res) => res.url().includes('/categories') && res.request().method() === 'POST',
    );
    await modal.getByRole('button', { name: 'Guardar Categoría' }).click();
    await savePromise;

    // 2. Ir a Movimientos y probar sugerencia inteligente
    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage.getByRole('heading', { name: /Movimientos/i }).first()).toBeVisible();

    // Abrir modal de nuevo movimiento
    const newTxBtn = authenticatedPage.getByRole('button', { name: 'Nuevo Movimiento' });
    await newTxBtn.click();

    // Escribir en Nota "Uber al trabajo"
    const noteInput = authenticatedPage.getByPlaceholder('Ej: Supermercado, Alquiler, Salario');
    await noteInput.fill('Uber al trabajo');

    // Verificar que aparece la sugerencia inteligente o chip de categoría
    await expect(authenticatedPage.getByText(/Sugerencia:/i)).toBeVisible();
    const applyBtn = authenticatedPage.getByRole('button', { name: /Transporte \(Aplicar\)/i });
    await expect(applyBtn).toBeVisible();

    // Aplicar sugerencia
    await applyBtn.click();
  });
});
