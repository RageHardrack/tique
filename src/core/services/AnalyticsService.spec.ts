import { describe, expect, it } from 'vitest';

import type { Category } from '../entities/Category';
import { AnalyticsService } from './AnalyticsService';
import type { Transaction } from '../entities/Transaction';

describe('AnalyticsService', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      userId: 'user-1',
      name: 'Supermercado',
      type: 'EXPENSE',
      color: '#10B981',
      icon: 'i-heroicons-shopping-cart',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'cat-2',
      userId: 'user-1',
      name: 'Transporte',
      type: 'EXPENSE',
      color: '#3B82F6',
      icon: 'i-heroicons-truck',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amount: 150,
      type: 'EXPENSE',
      date: '2026-08-20',
      createdAt: '2026-08-20',
      updatedAt: '2026-08-20',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      accountId: 'acc-1',
      categoryId: 'cat-2',
      amount: 50,
      type: 'EXPENSE',
      date: '2026-08-21',
      createdAt: '2026-08-21',
      updatedAt: '2026-08-21',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      accountId: 'acc-1',
      amount: 1000,
      type: 'INCOME',
      date: '2026-08-22',
      createdAt: '2026-08-22',
      updatedAt: '2026-08-22',
    },
  ];

  const accountsCurrencyMap = {
    'acc-1': 'USD',
  };

  const simpleConvertFn = (amount: number) => amount;
  const simpleFormatFn = (amount: number) => `$${amount.toFixed(2)}`;

  it('should calculate category breakdown percentages correctly', () => {
    const breakdown = AnalyticsService.calculateCategoryExpenses({
      transactions: mockTransactions,
      categories: mockCategories,
      accountsCurrencyMap,
      convertFn: simpleConvertFn,
      targetCurrency: 'USD',
      formatFn: simpleFormatFn,
    });

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].categoryName).toBe('Supermercado');
    expect(breakdown[0].amount).toBe(150);
    expect(breakdown[0].percentage).toBe(75); // 150 / 200 = 75%

    expect(breakdown[1].categoryName).toBe('Transporte');
    expect(breakdown[1].amount).toBe(50);
    expect(breakdown[1].percentage).toBe(25); // 50 / 200 = 25%
  });

  it('should return empty array if there are no expense transactions', () => {
    const breakdown = AnalyticsService.calculateCategoryExpenses({
      transactions: [mockTransactions[2]], // Only income
      categories: mockCategories,
      accountsCurrencyMap,
      convertFn: simpleConvertFn,
      targetCurrency: 'USD',
      formatFn: simpleFormatFn,
    });

    expect(breakdown).toEqual([]);
  });

  it('should calculate cashflow metrics and savings rate accurately', () => {
    const metrics = AnalyticsService.calculateCashflowMetrics(1000, 200);

    expect(metrics.totalIncome).toBe(1000);
    expect(metrics.totalExpenses).toBe(200);
    expect(metrics.netSavings).toBe(800);
    expect(metrics.savingsRate).toBe(80); // (800 / 1000) * 100
    expect(metrics.isPositive).toBe(true);
  });

  it('should handle negative cashflow when expenses exceed income', () => {
    const metrics = AnalyticsService.calculateCashflowMetrics(500, 800);

    expect(metrics.netSavings).toBe(-300);
    expect(metrics.savingsRate).toBe(-60); // (-300 / 500) * 100
    expect(metrics.isPositive).toBe(false);
  });
});
