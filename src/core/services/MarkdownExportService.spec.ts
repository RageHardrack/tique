import { describe, expect, it, vi } from 'vitest';

import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import {
  MarkdownExportService,
  type MarkdownReportData,
} from './MarkdownExportService';

describe('MarkdownExportService', () => {
  const accounts: Account[] = [
    {
      id: 'acc-1',
      userId: 'user-1',
      name: 'BCP Cuenta Sueldo',
      type: 'CHECKING',
      balance: 2500,
      currency: 'PEN',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      userId: 'user-1',
      name: 'Efectivo USD',
      type: 'CASH',
      balance: 100,
      currency: 'USD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const categories: Category[] = [
    {
      id: 'cat-1',
      userId: 'user-1',
      name: 'Alimentación | Supermercado',
      type: 'EXPENSE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'cat-2',
      userId: 'user-1',
      name: 'Servicios Básicos',
      type: 'EXPENSE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amount: 150.75,
      type: 'EXPENSE',
      date: '2026-08-15T12:00:00Z',
      note: 'Compra semanal | Frutas y verduras\nSegunda línea',
      createdAt: '2026-08-15',
      updatedAt: '2026-08-15',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      accountId: 'acc-2',
      categoryId: undefined,
      amount: 50,
      type: 'EXPENSE',
      date: '2026-08-18T10:00:00Z',
      exchangeRate: 3.75,
      note: 'Cena en restaurante',
      createdAt: '2026-08-18',
      updatedAt: '2026-08-18',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      accountId: 'acc-1',
      categoryId: undefined,
      amount: 3000,
      type: 'INCOME',
      date: '2026-08-01T08:00:00Z',
      note: 'Salario quincenal',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    },
  ];

  const baseReportData: MarkdownReportData = {
    rangeLabel: 'Agosto 2026',
    formattedRange: '01 ago 2026 - 31 ago 2026',
    baseCurrency: 'PEN',
    metrics: {
      totalIncome: 3000,
      totalExpenses: 338.25,
      netSavings: 2661.75,
      savingsRate: 88.7,
      isPositive: true,
    },
    categoryBreakdown: [
      {
        categoryId: 'cat-1',
        categoryName: 'Alimentación | Supermercado',
        amount: 150.75,
        formattedAmount: '150,75 S/',
        percentage: 44.6,
        color: '#10B981',
        icon: 'i-heroicons-shopping-cart',
      },
      {
        categoryId: 'cat-2',
        categoryName: 'Servicios Básicos',
        amount: 187.5,
        formattedAmount: '187,50 S/',
        percentage: 55.4,
        color: '#3B82F6',
        icon: 'i-heroicons-bolt',
      },
    ],
    transactions,
    accounts,
    categories,
    convertFn: (amount, curr, rate) => {
      if (curr === 'USD') return amount * (rate || 3.75);
      return amount;
    },
    formatFn: (amount, curr) => `${amount.toFixed(2)} ${curr}`,
  };

  it('should sanitize table cells escaping pipes and replacing newlines', () => {
    expect(MarkdownExportService.sanitizeMarkdownCell('Simple text')).toBe(
      'Simple text',
    );
    expect(
      MarkdownExportService.sanitizeMarkdownCell('A | B | C'),
    ).toBe('A \\| B \\| C');
    expect(
      MarkdownExportService.sanitizeMarkdownCell('Line 1\nLine 2\r\nLine 3'),
    ).toBe('Line 1 Line 2 Line 3');
    expect(MarkdownExportService.sanitizeMarkdownCell(null)).toBe('');
    expect(MarkdownExportService.sanitizeMarkdownCell(undefined)).toBe('');
  });

  it('should generate complete Markdown context document with instructions, summary and tables', () => {
    const md = MarkdownExportService.generateMarkdown(baseReportData);

    // AI Instructions
    expect(md).toContain('# Contexto Financiero Personal - Reporte Tique');
    expect(md).toContain('Instrucciones para el Asistente de IA (Gemini / Claude / ChatGPT):');
    expect(md).toContain('asesor financiero personal');

    // General Info
    expect(md).toContain('## 1. Información General');
    expect(md).toContain('- **Periodo analizado:** 01 ago 2026 - 31 ago 2026 (Agosto 2026)');
    expect(md).toContain('- **Moneda base:** PEN');
    expect(md).toContain('- **Total de movimientos:** 3');

    // Executive summary
    expect(md).toContain('## 2. Resumen Ejecutivo de Flujo de Caja');
    expect(md).toContain('| **Ingresos Totales** | 3000.00 PEN |');
    expect(md).toContain('| **Gastos Totales** | 338.25 PEN |');
    expect(md).toContain('| **Balance Neto (Ahorro)** | 2661.75 PEN | Superávit / Ahorro positivo |');
    expect(md).toContain('| **Tasa de Ahorro** | 88.7% |');

    // Categories
    expect(md).toContain('## 3. Distribución de Gastos por Categoría');
    expect(md).toContain('Alimentación \\| Supermercado');
    expect(md).toContain('Servicios Básicos');
    expect(md).toContain('44.6%');
    expect(md).toContain('55.4%');

    // Transactions
    expect(md).toContain('## 4. Detalle de Movimientos del Período');
    expect(md).toContain('BCP Cuenta Sueldo');
    expect(md).toContain('Compra semanal \\| Frutas y verduras Segunda línea');
    expect(md).toContain('50.00 USD');
    expect(md).toContain('187.50 PEN'); // Converted USD amount

    // Suggested Questions
    expect(md).toContain('## 5. Preguntas Sugeridas para hacerle a la IA');
    expect(md).toContain('¿Cómo resumirías mi salud financiera durante este período');
  });

  it('should handle deficit and empty categories or transactions gracefully', () => {
    const emptyData: MarkdownReportData = {
      ...baseReportData,
      metrics: {
        totalIncome: 0,
        totalExpenses: 500,
        netSavings: -500,
        savingsRate: 0,
        isPositive: false,
      },
      categoryBreakdown: [],
      transactions: [],
    };

    const md = MarkdownExportService.generateMarkdown(emptyData);

    expect(md).toContain('Déficit / Gastos mayores a ingresos');
    expect(md).toContain('*No se registraron gastos en este período.*');
    expect(md).toContain('*No se registraron movimientos en este período.*');
  });

  it('should trigger browser download with correct blob and filename', () => {
    const clickMock = vi.fn();
    const appendChildMock = vi.spyOn(document.body, 'appendChild');
    const removeChildMock = vi.spyOn(document.body, 'removeChild');

    // Mock link element
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickMock;
      }
      return el;
    });

    // Mock URL object
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    MarkdownExportService.downloadMarkdown(
      '# Test Content',
      'test_report.md',
    );

    expect(clickMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
  });
});
