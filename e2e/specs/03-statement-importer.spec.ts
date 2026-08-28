import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Importación Masiva de Extractos Bancarios E2E', () => {
  test('abre el asistente de importación, detecta columnas y previsualiza movimientos', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/movimientos');
    await expect(authenticatedPage.getByText('Movimientos Recientes')).toBeVisible();

    const importBtn = authenticatedPage.getByRole('button', { name: 'Importar Extracto' });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Validar modal abierto en Paso 1 (Carga)
    await expect(authenticatedPage.getByText('Importar Extracto Bancario (CSV)')).toBeVisible();
    await expect(authenticatedPage.getByText('Selecciona tu archivo CSV')).toBeVisible();

    // Crear buffer CSV en memoria para la prueba
    const csvContent = `Fecha,Concepto,Monto
2026-08-20,Compra Supermercado,-45.50
2026-08-21,Honorarios Consultoria,1500.00`;

    // Cargar archivo
    const fileInput = authenticatedPage.locator('#statement-upload-input');
    await fileInput.setInputFiles({
      name: 'extracto_bancario_test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Validar transición automática a Paso 2 (Mapeo)
    await expect(authenticatedPage.getByText('Columna de Fecha')).toBeVisible();
    await expect(authenticatedPage.getByText('Columna de Monto')).toBeVisible();

    // Avanzar a Paso 3 (Previsualización)
    const previewBtn = authenticatedPage.getByRole('button', { name: 'Previsualizar Movimientos →' });
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Validar tabla de previsualización
    await expect(authenticatedPage.getByText('Compra Supermercado')).toBeVisible();
    await expect(authenticatedPage.getByText('Honorarios Consultoria')).toBeVisible();

    // Cerrar modal
    const cancelBtn = authenticatedPage.getByRole('button', { name: 'Cancelar' });
    await cancelBtn.click();
    await expect(authenticatedPage.getByText('Importar Extracto Bancario (CSV)')).not.toBeVisible();
  });
});
