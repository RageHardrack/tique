import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import type { Category } from '../../../core/entities/Category';
import type { Transaction } from '../../../core/entities/Transaction';
import type { Budget } from '../../../core/entities/Budget';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import BudgetsSection from './BudgetsSection.vue';

describe('BudgetsSection.vue', () => {
  it('counts current-month spending but excludes a previous-month expense', () => {
    const now = new Date();
    const currentMonthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15),
    ).toISOString();
    const previousMonthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15),
    ).toISOString();
    const categories: Category[] = [
      {
        id: 'cat-food',
        userId: 'user-1',
        name: 'Comida',
        type: 'EXPENSE',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const transactions: Transaction[] = [
      {
        id: 'tx-previous',
        userId: 'user-1',
        accountId: 'account-1',
        categoryId: 'cat-food',
        amount: 900,
        type: 'EXPENSE',
        date: previousMonthDate,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-current',
        userId: 'user-1',
        accountId: 'account-1',
        categoryId: 'cat-food',
        amount: 100,
        type: 'EXPENSE',
        date: currentMonthDate,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const budgets: Budget[] = [
      {
        id: 'budget-food',
        userId: 'user-1',
        categoryId: 'cat-food',
        amount: 1000,
        currency: 'USD',
        period: 'MONTHLY',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const wrapper = mount(BudgetsSection, {
      props: {
        budgets,
        categories,
        transactions,
        accountsCurrencyMap: { 'account-1': 'USD' },
        baseCurrency: 'USD',
        convertFn: (amount: number) => amount,
      },
    });

    const spentAmount = wrapper.findAll('strong')[0];
    expect(spentAmount.text()).toBe(CurrencyFormatter.format(100, 'USD'));
  });
});
