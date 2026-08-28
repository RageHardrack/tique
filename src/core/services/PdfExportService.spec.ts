import { describe, expect, it } from 'vitest';
import { PdfExportService, type PdfReportData } from './PdfExportService';

describe('PdfExportService - Financial Report Generation', () => {
  const mockData: PdfReportData = {
    rangeLabel: 'Trimestral (Cuarto de Año)',
    formattedRange: '1 jun 2026 - 31 ago 2026',
    baseCurrency: 'PEN',
    metrics: {
      totalIncome: 6800,
      totalExpenses: 1400,
      netSavings: 5400,
      savingsRate: 79.4,
      isPositive: true,
    },
    categoryBreakdown: [
      {
        categoryId: 'cat-1',
        categoryName: 'Supermercado & Comida',
        amount: 550,
        formattedAmount: 'S/ 550.00',
        percentage: 39.3,
        color: '#10B981',
        icon: 'i-heroicons-tag',
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        userId: 'u-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        amount: 550,
        type: 'EXPENSE',
        date: '2026-08-20T10:00:00Z',
        note: 'Compras de la semana',
        createdAt: '2026-08-20',
        updatedAt: '2026-08-20',
      },
    ],
    accounts: [
      {
        id: 'acc-1',
        userId: 'u-1',
        name: 'BCP Principal',
        type: 'CHECKING',
        balance: 1000,
        currency: 'PEN',
        createdAt: '',
        updatedAt: '',
      },
    ],
    categories: [
      {
        id: 'cat-1',
        userId: 'u-1',
        name: 'Supermercado & Comida',
        type: 'EXPENSE',
        createdAt: '',
        updatedAt: '',
      },
    ],
    formatFn: (amt, curr) => `${curr} ${amt.toFixed(2)}`,
  };

  it('should generate complete HTML string containing header metadata', () => {
    const html = PdfExportService.generateReportHtml(mockData);

    expect(html).toContain('TIQUE');
    expect(html).toContain('Trimestral (Cuarto de Año)');
    expect(html).toContain('1 jun 2026 - 31 ago 2026');
    expect(html).toContain('PEN');
  });

  it('should include summary metrics cards and calculated values', () => {
    const html = PdfExportService.generateReportHtml(mockData);

    expect(html).toContain('Ingresos Totales');
    expect(html).toContain('PEN 6800.00');
    expect(html).toContain('Gastos Totales');
    expect(html).toContain('PEN 1400.00');
    expect(html).toContain('Balance Neto');
    expect(html).toContain('PEN 5400.00');
    expect(html).toContain('79.4%');
  });

  it('should include category breakdown and transaction list', () => {
    const html = PdfExportService.generateReportHtml(mockData);

    expect(html).toContain('Supermercado & Comida');
    expect(html).toContain('39.3%');
    expect(html).toContain('Compras de la semana');
    expect(html).toContain('BCP Principal');
  });
});
