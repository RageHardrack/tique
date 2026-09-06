import { describe, expect, it } from 'vitest';

import { BudgetAlertService } from './BudgetAlertService';
import type { Budget } from '../entities/Budget';
import type { Transaction } from '../entities/Transaction';
import type { SupportedCurrency } from '../entities/Account';

describe('BudgetAlertService (Multi-Currency)', () => {
  const budgets: Budget[] = [
    {
      id: 'b-1',
      userId: 'u-1',
      categoryId: 'cat-mercado',
      amount: 500, // 500 USD limit
      currency: 'USD',
      period: 'MONTHLY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const accountsCurrencyMap: Record<string, string> = {
    'acc-usd': 'USD',
    'acc-ves': 'VES',
    'acc-eur': 'EUR',
  };

  // 1 USD = 23.57 VES; 1 EUR = 1.08 USD
  const convertFn = (
    amount: number,
    fromCurrency: string,
    toCurrency: SupportedCurrency,
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    if (fromCurrency === 'VES' && toCurrency === 'USD') {
      return amount / 23.57;
    }
    if (fromCurrency === 'USD' && toCurrency === 'VES') {
      return amount * 23.57;
    }
    if (fromCurrency === 'EUR' && toCurrency === 'USD') {
      return amount * 1.08;
    }
    return amount;
  };

  it('returns null if categoryId is missing, amount <= 0, or no budget matches', () => {
    expect(
      BudgetAlertService.checkBudgetThreshold({
        categoryId: '',
        transactionAmount: 100,
        budgets,
      }),
    ).toBeNull();

    expect(
      BudgetAlertService.checkBudgetThreshold({
        categoryId: 'cat-mercado',
        transactionAmount: 0,
        budgets,
      }),
    ).toBeNull();

    expect(
      BudgetAlertService.checkBudgetThreshold({
        categoryId: 'cat-nonexistent',
        transactionAmount: 100,
        budgets,
      }),
    ).toBeNull();
  });

  it('correctly converts foreign currency transaction (VES -> USD) within SAFE threshold', () => {
    // Current spent: $73.51 USD
    const monthlyTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'u-1',
        accountId: 'acc-usd',
        categoryId: 'cat-mercado',
        amount: 73.51,
        type: 'EXPENSE',
        date: '2026-09-01T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    // GIVEN user adds 4,329.87 VES (~183.70 USD)
    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 4329.87,
      transactionCurrency: 'VES',
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn,
    });

    expect(result).not.toBeNull();
    expect(result?.hasAlert).toBe(false);
    expect(result?.level).toBe('SAFE');
    expect(result?.currentSpent).toBeCloseTo(73.51, 1);
    expect(result?.newSpent).toBeCloseTo(257.21, 1);
    expect(result?.projectedPercentage).toBe(51); // 257.21 / 500 = 51.4% -> 51%
  });

  it('triggers WARNING_80 when converted new spending reaches 80%-99%', () => {
    // Current spent: $350 USD
    const monthlyTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'u-1',
        accountId: 'acc-usd',
        categoryId: 'cat-mercado',
        amount: 350,
        type: 'EXPENSE',
        date: '2026-09-01T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    // User adds 1,500 VES (~63.64 USD) -> Total: $413.64 (83% of 500 USD)
    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 1500,
      transactionCurrency: 'VES',
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn,
    });

    expect(result?.hasAlert).toBe(true);
    expect(result?.level).toBe('WARNING_80');
    expect(result?.projectedPercentage).toBe(83);
  });

  it('triggers EXCEEDED_100 when converted new spending reaches >= 100%', () => {
    // Current spent: $73.51 USD
    const monthlyTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'u-1',
        accountId: 'acc-usd',
        categoryId: 'cat-mercado',
        amount: 73.51,
        type: 'EXPENSE',
        date: '2026-09-01T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    // User adds 12,000 VES (~509.12 USD) -> Total: $582.63 (117% of 500 USD)
    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 12000,
      transactionCurrency: 'VES',
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn,
    });

    expect(result?.hasAlert).toBe(true);
    expect(result?.level).toBe('EXCEEDED_100');
    expect(result?.projectedPercentage).toBe(117);
    expect(result?.categoryLimit).toBe(500);
  });

  it('converts past transactions in non-base currency as well', () => {
    // Past transaction: 1,733 VES (~73.53 USD)
    const monthlyTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'u-1',
        accountId: 'acc-ves',
        categoryId: 'cat-mercado',
        amount: 1733,
        type: 'EXPENSE',
        date: '2026-09-01T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 4329.87,
      transactionCurrency: 'VES',
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn,
    });

    expect(result?.hasAlert).toBe(false);
    expect(result?.level).toBe('SAFE');
    expect(result?.currentSpent).toBeCloseTo(73.53, 1);
    expect(result?.newSpent).toBeCloseTo(257.23, 1);
  });

  it('preserves historical transaction USD value using stored exchangeRate even if market rate changes', () => {
    // Past transaction: 8,137.40 VES recorded at rate 813.74 -> exactly $10.00 USD
    const monthlyTransactions: Transaction[] = [
      {
        id: 'tx-historical-1',
        userId: 'u-1',
        accountId: 'acc-ves',
        categoryId: 'cat-mercado',
        amount: 8137.4,
        exchangeRate: 813.74,
        type: 'EXPENSE',
        date: '2026-09-01T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    // Market rate today is wildly different: e.g. 1 USD = 1,000.00 VES
    const floatingConvertFn = (
      amount: number,
      fromCurrency: string,
      toCurrency: SupportedCurrency,
    ): number => {
      if (fromCurrency === 'VES' && toCurrency === 'USD') {
        return amount / 1000.0;
      }
      return amount;
    };

    // User adds new transaction in USD of $15.00
    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 15,
      transactionCurrency: 'USD',
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn: floatingConvertFn,
    });

    // currentSpent MUST be 10.00 (from 8137.40 / 813.74), NOT 8.14 (from 8137.40 / 1000)
    expect(result?.currentSpent).toBe(10);
    expect(result?.newSpent).toBe(25);
  });

  it('uses transactionExchangeRate for the new transaction being evaluated if provided', () => {
    const monthlyTransactions: Transaction[] = [];

    // New transaction: 8,137.40 VES with specific rate 813.74 ($10.00 USD)
    const result = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-mercado',
      transactionAmount: 8137.4,
      transactionCurrency: 'VES',
      transactionExchangeRate: 813.74,
      budgets,
      monthlyTransactions,
      accountsCurrencyMap,
      baseCurrency: 'USD',
      convertFn: () => 9999, // Should NOT be used
    });

    expect(result?.newSpent).toBe(10);
  });
});
