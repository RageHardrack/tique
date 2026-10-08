import { describe, expect, it, vi } from 'vitest';

import type { SupportedCurrency } from '../entities/Account';
import type { Transaction } from '../entities/Transaction';
import { MonthlySpendingService } from './MonthlySpendingService';

const createTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  userId: 'user-1',
  accountId: 'account-1',
  categoryId: 'category-1',
  amount: 100,
  type: 'EXPENSE',
  date: '2025-05-15T12:00:00.000Z',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const convertFn = (
  amount: number,
  _fromCurrency: string,
  _toCurrency: SupportedCurrency,
): number => amount * 2;

describe('MonthlySpendingService', () => {
  it('filters transactions by UTC year and month and excludes invalid dates', () => {
    const transactions = [
      createTransaction({ id: 'utc-match', date: '2025-05-31T23:59:59-04:00' }),
      createTransaction({ id: 'prior-month', date: '2025-04-30T23:59:59.000Z' }),
      createTransaction({ id: 'invalid-date', date: 'not-a-date' }),
      createTransaction({ id: 'missing-date', date: '' }),
    ];

    expect(MonthlySpendingService.filterByMonth(transactions, 2025, 6)).toEqual([
      transactions[0],
    ]);
  });

  it('sums only categorized expenses from the requested month in the base currency', () => {
    const transactions = [
      createTransaction({ id: 'current', amount: 120, exchangeRate: 4 }),
      createTransaction({ id: 'previous', date: '2025-04-15T12:00:00.000Z' }),
      createTransaction({ id: 'income', type: 'INCOME' }),
      createTransaction({ id: 'uncategorized', categoryId: null }),
      createTransaction({ id: 'missing-category', categoryId: undefined }),
    ];

    const fallbackConvert = vi.fn(convertFn);
    const spent = MonthlySpendingService.sumExpensesByCategory({
      transactions,
      year: 2025,
      month: 5,
      baseCurrency: 'USD',
      accountsCurrencyMap: { 'account-1': 'VES' },
      convertFn: fallbackConvert,
    });

    expect(spent).toEqual({ 'category-1': 30 });
    expect(fallbackConvert).not.toHaveBeenCalled();
  });

  it('falls back to convertFn when there is no positive stored exchange rate', () => {
    const fallbackConvert = vi.fn(convertFn);
    const spent = MonthlySpendingService.sumExpensesByCategory({
      transactions: [createTransaction({ amount: 25, exchangeRate: 0 })],
      year: 2025,
      month: 5,
      baseCurrency: 'USD',
      accountsCurrencyMap: {},
      convertFn: fallbackConvert,
    });

    expect(spent).toEqual({ 'category-1': 50 });
    expect(fallbackConvert).toHaveBeenCalledWith(25, 'USD', 'USD');
  });
});
