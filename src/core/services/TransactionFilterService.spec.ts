import { describe, expect, it } from 'vitest';

import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import { TransactionFilterService } from './TransactionFilterService';

describe('TransactionFilterService', () => {
  const accounts: Account[] = [
    {
      id: 'acc-1',
      userId: 'user-1',
      name: 'BCP Principal',
      type: 'CHECKING',
      balance: 1000,
      currency: 'PEN',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      userId: 'user-1',
      name: 'Interbank USD',
      type: 'SAVINGS',
      balance: 500,
      currency: 'USD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const categories: Category[] = [
    {
      id: 'cat-1',
      userId: 'user-1',
      name: 'Supermercado',
      type: 'EXPENSE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'cat-2',
      userId: 'user-1',
      name: 'Salario',
      type: 'INCOME',
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
      amount: 150,
      type: 'EXPENSE',
      date: new Date().toISOString(),
      note: 'Compras Wong',
      createdAt: '2026-08-24',
      updatedAt: '2026-08-24',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      accountId: 'acc-2',
      categoryId: 'cat-2',
      amount: 3000,
      type: 'INCOME',
      date: new Date().toISOString(),
      note: 'Pago nómina',
      createdAt: '2026-08-24',
      updatedAt: '2026-08-24',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      accountId: 'acc-1',
      destinationAccountId: 'acc-2',
      amount: 200,
      type: 'TRANSFER',
      date: '2025-01-15T10:00:00Z',
      note: 'Ahorro',
      createdAt: '2025-01-15',
      updatedAt: '2025-01-15',
    },
  ];

  it('should filter by transaction type', () => {
    const expenses = TransactionFilterService.filter(
      transactions,
      { type: 'EXPENSE' },
      accounts,
      categories,
    );
    expect(expenses.length).toBe(1);
    expect(expenses[0].id).toBe('tx-1');
  });

  it('should filter by text search in note, category name or account name', () => {
    const searchNote = TransactionFilterService.filter(
      transactions,
      { searchTerm: 'wong' },
      accounts,
      categories,
    );
    expect(searchNote.length).toBe(1);
    expect(searchNote[0].id).toBe('tx-1');

    const searchCat = TransactionFilterService.filter(
      transactions,
      { searchTerm: 'Salario' },
      accounts,
      categories,
    );
    expect(searchCat.length).toBe(1);
    expect(searchCat[0].id).toBe('tx-2');

    const searchAccount = TransactionFilterService.filter(
      transactions,
      { searchTerm: 'Interbank' },
      accounts,
      categories,
    );
    expect(searchAccount.length).toBe(2); // tx-2 (source) and tx-3 (destination)
  });

  it('should filter by specific account and category', () => {
    const byAccount = TransactionFilterService.filter(
      transactions,
      { accountId: 'acc-2' },
      accounts,
      categories,
    );
    expect(byAccount.length).toBe(2);

    const byCategory = TransactionFilterService.filter(
      transactions,
      { categoryId: 'cat-1' },
      accounts,
      categories,
    );
    expect(byCategory.length).toBe(1);
  });

  it('should filter by THIS_MONTH date preset', () => {
    const thisMonth = TransactionFilterService.filter(
      transactions,
      { datePreset: 'THIS_MONTH' },
      accounts,
      categories,
    );
    expect(thisMonth.length).toBe(2);
  });
});
