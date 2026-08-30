import { describe, expect, it } from 'vitest';
import { CategorySuggestionService } from './CategorySuggestionService';
import { BudgetAlertService } from './BudgetAlertService';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type { Budget } from '../entities/Budget';

describe('CategorySuggestionService & BudgetAlertService', () => {
  const dummyCategories: Category[] = [
    { id: 'cat-food', userId: 'u1', name: 'Alimentación', icon: 'i-food', color: '#10B981', type: 'EXPENSE', createdAt: '', updatedAt: '' },
    { id: 'cat-transport', userId: 'u1', name: 'Transporte', icon: 'i-car', color: '#3B82F6', type: 'EXPENSE', createdAt: '', updatedAt: '' },
    { id: 'cat-stream', userId: 'u1', name: 'Entretenimiento', icon: 'i-film', color: '#8B5CF6', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  ];

  const dummyTransactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-stream',
      amount: 15.99,
      type: 'EXPENSE',
      note: 'Netflix Mensual',
      date: '2026-09-01',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('suggests category from historical match', () => {
    const result = CategorySuggestionService.suggestCategory({
      description: 'Netflix Mensual',
      categories: dummyCategories,
      recentTransactions: dummyTransactions,
    });

    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('cat-stream');
    expect(result?.confidence).toBe('HIGH');
  });

  it('suggests category from keyword rules', () => {
    const result = CategorySuggestionService.suggestCategory({
      description: 'Viaje en Uber al aeropuerto',
      categories: dummyCategories,
    });

    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('cat-transport');
    expect(result?.confidence).toBe('MEDIUM');
  });

  it('triggers budget warning at 80% and critical alert at 100%', () => {
    const budgets: Budget[] = [
      {
        id: 'b-1',
        userId: 'u1',
        amount: 100,
        currency: 'USD',
        period: 'MONTHLY',
        categoryId: 'cat-food',
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Current spend is 50. Adding 35 reaches 85% (Warning)
    const existingTxs: Transaction[] = [
      { id: 't1', userId: 'u1', accountId: 'a1', categoryId: 'cat-food', amount: 50, type: 'EXPENSE', date: '2026-09-01', createdAt: '', updatedAt: '' },
    ];

    const warningStatus = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-food',
      transactionAmount: 35,
      budgets,
      monthlyTransactions: existingTxs,
    });

    expect(warningStatus?.hasAlert).toBe(true);
    expect(warningStatus?.level).toBe('WARNING_80');
    expect(warningStatus?.projectedPercentage).toBe(85);

    // Adding 60 reaches 110% (Exceeded)
    const exceededStatus = BudgetAlertService.checkBudgetThreshold({
      categoryId: 'cat-food',
      transactionAmount: 60,
      budgets,
      monthlyTransactions: existingTxs,
    });

    expect(exceededStatus?.hasAlert).toBe(true);
    expect(exceededStatus?.level).toBe('EXCEEDED_100');
    expect(exceededStatus?.projectedPercentage).toBe(110);
  });
});
