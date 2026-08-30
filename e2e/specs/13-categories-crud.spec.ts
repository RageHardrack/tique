import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Categorías CRUD Completo E2E (con Regla 50/30/20 y API real)', () => {
  test('permite crear una categoría con regla 50/30/20, listar, editar grupo presupuestario y eliminarla', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/categorias');
    await expect(
      authenticatedPage.getByRole('heading', { level: 1, name: 'Categorías' }),
    ).toBeVisible();

    // 1. Abrir Modal de Creación
    const newCategoryBtn = authenticatedPage.getByRole('button', { name: 'Nueva Categoría' });
    await newCategoryBtn.click();
    await expect(authenticatedPage.getByRole('heading', { name: 'Nueva Categoría' })).toBeVisible();

    // 2. Llenar formulario con Regla 50/30/20 (NEEDS)
    const uniqueCategoryName = `Vivienda & Luz E2E ${Date.now()}`;
    const nameInput = authenticatedPage.getByPlaceholder('Ej: Supermercado, Salario, Gimnasio');
    await nameInput.fill(uniqueCategoryName);

    // Seleccionar grupo 50% Necesidades dentro del modal
    const modal = authenticatedPage.locator('[role="dialog"], [data-slot="content"]').first();
    const budgetSelect = modal.locator('select[name="budgetGroup"]');
    if (await budgetSelect.isVisible().catch(() => false)) {
      await budgetSelect.selectOption('NEEDS');
    }

    // Guardar Categoría
    const createPromise = authenticatedPage.waitForResponse(
      (res) => res.url().includes('/categories') && res.request().method() === 'POST',
    );
    await modal.getByRole('button', { name: 'Guardar Categoría' }).click();
    const createRes = await createPromise;
    expect(createRes.status()).toBe(201);
    const createdData = await createRes.json();
    expect(createdData.budgetGroup).toBe('NEEDS');

    // 3. Verificar que la categoría aparece en el DOM con su nombre y badge
    await expect(authenticatedPage.getByRole('heading', { name: uniqueCategoryName })).toBeVisible();
    await expect(authenticatedPage.getByText('50% Necesidades').first()).toBeVisible();

    // 4. Editar Categoría para cambiar a 30% Deseos
    const categoryCard = authenticatedPage
      .locator('.rounded-2xl')
      .filter({ has: authenticatedPage.getByRole('heading', { name: uniqueCategoryName }) });

    const editBtn = categoryCard.locator('button').first();
    await editBtn.click();
    await expect(authenticatedPage.getByRole('heading', { name: 'Editar Categoría' })).toBeVisible();

    const updatedCategoryName = `${uniqueCategoryName} (Modificado)`;
    await modal.getByPlaceholder('Ej: Supermercado, Salario, Gimnasio').fill(updatedCategoryName);

    if (await budgetSelect.isVisible().catch(() => false)) {
      await budgetSelect.selectOption('WANTS');
    }

    const updatePromise = authenticatedPage.waitForResponse(
      (res) => res.url().includes('/categories/') && res.request().method() === 'PUT',
    );
    await modal.getByRole('button', { name: 'Guardar Categoría' }).click();
    const updateRes = await updatePromise;
    expect(updateRes.status()).toBe(200);
    const updatedData = await updateRes.json();
    expect(updatedData.budgetGroup).toBe('WANTS');

    // 5. Verificar que el badge y nombre actualizado se renderizan
    await expect(authenticatedPage.getByRole('heading', { name: updatedCategoryName })).toBeVisible();

    // 6. Eliminar Categoría a través del diálogo de confirmación custom UI
    const updatedCard = authenticatedPage
      .locator('.rounded-2xl')
      .filter({ has: authenticatedPage.getByRole('heading', { name: updatedCategoryName }) });

    const deleteBtn = updatedCard.locator('button').nth(1);
    await deleteBtn.click();

    // Modal de confirmación UI
    await expect(authenticatedPage.getByText('Eliminar categoría')).toBeVisible();
    const deletePromise = authenticatedPage.waitForResponse(
      (res) => res.url().includes('/categories/') && res.request().method() === 'DELETE',
    );
    await authenticatedPage.getByRole('button', { name: 'Eliminar', exact: true }).click();
    const deleteRes = await deletePromise;
    expect(deleteRes.status()).toBe(200);

    // 7. Verificar que ya no existe en el DOM
    await expect(authenticatedPage.getByRole('heading', { name: updatedCategoryName })).not.toBeVisible();
  });
});
