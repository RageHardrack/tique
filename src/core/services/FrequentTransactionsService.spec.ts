import { describe, expect, it } from 'vitest';
import { FrequentTransactionsService } from './FrequentTransactionsService';
import type { Transaction } from '../entities/Transaction';

describe('FrequentTransactionsService', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      amount: 15,
      type: 'EXPENSE',
      date: '2026-08-01',
      note: 'Almuerzo diario',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'tx-2',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      amount: 17,
      type: 'EXPENSE',
      date: '2026-08-02',
      note: 'Almuerzo diario',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'tx-3',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      amount: 16,
      type: 'EXPENSE',
      date: '2026-08-03',
      note: 'Almuerzo diario',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'tx-4',
      userId: 'u1',
      accountId: 'acc-2',
      categoryId: 'cat-fuel',
      amount: 50,
      type: 'EXPENSE',
      date: '2026-08-04',
      note: 'Gasolina',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'tx-5',
      userId: 'u1',
      accountId: 'acc-1',
      destinationAccountId: 'acc-2',
      amount: 100,
      type: 'TRANSFER',
      date: '2026-08-05',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('should detect top frequent patterns with calculated average amounts and exclude transfers', () => {
    const patterns = FrequentTransactionsService.getFrequentPatterns(transactions, 2);

    expect(patterns.length).toBe(2);

    const topPattern = patterns[0];
    expect(topPattern.note).toBe('Almuerzo diario');
    expect(topPattern.count).toBe(3);
    expect(topPattern.averageAmount).toBe(16);
    expect(topPattern.categoryId).toBe('cat-food');

    const secondPattern = patterns[1];
    expect(secondPattern.note).toBe('Gasolina');
    expect(secondPattern.count).toBe(1);
    expect(secondPattern.averageAmount).toBe(50);
  });

  it('should return empty array when no transactions are provided', () => {
    expect(FrequentTransactionsService.getFrequentPatterns([])).toEqual([]);
  });
});
