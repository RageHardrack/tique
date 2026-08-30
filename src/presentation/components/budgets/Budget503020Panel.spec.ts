import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Budget503020Panel from './Budget503020Panel.vue';
import type { Category } from '../../../core/entities/Category';
import type { Transaction } from '../../../core/entities/Transaction';
import type { Budget } from '../../../core/entities/Budget';

describe('Budget503020Panel.vue (50/30/20 Monthly Dashboard Component)', () => {
  const categories: Category[] = [
    {
      id: 'cat-rent',
      userId: 'u1',
      name: 'Alquiler',
      type: 'EXPENSE',
      budgetGroup: 'NEEDS',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'cat-fun',
      userId: 'u1',
      name: 'Salidas',
      type: 'EXPENSE',
      budgetGroup: 'WANTS',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'cat-save',
      userId: 'u1',
      name: 'Ahorro',
      type: 'EXPENSE',
      budgetGroup: 'SAVINGS',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  const transactions: Transaction[] = [
    {
      id: 't-inc',
      userId: 'u1',
      accountId: 'acc-1',
      amount: 5000,
      type: 'INCOME',
      date: `${year}-${month}-05T00:00:00.000Z`,
      note: 'Salario',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 't-rent',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-rent',
      amount: 2000,
      type: 'EXPENSE',
      date: `${year}-${month}-06T00:00:00.000Z`,
      note: 'Alquiler',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'b-rent',
      userId: 'u1',
      categoryId: 'cat-rent',
      amount: 2200,
      currency: 'USD',
      period: 'MONTHLY',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('renders monthly income and 50/30/20 pillar metrics correctly', () => {
    const wrapper = mount(Budget503020Panel, {
      props: {
        categories,
        transactions,
        budgets,
        currency: 'USD',
      },
    });

    const text = wrapper.text();
    expect(text).toContain('Planificación Mensual — Regla 50/30/20');
    expect(text).toContain('50% Necesidades');
    expect(text).toContain('30% Deseos');
    expect(text).toContain('20% Ahorro');
    expect(text).toContain('5,000.00'); // Total Income
    expect(text).toContain('2,000.00'); // Spent in Needs
  });

  it('allows navigating months with previous and next buttons', async () => {
    const wrapper = mount(Budget503020Panel, {
      props: {
        categories,
        transactions,
        budgets,
        currency: 'USD',
      },
    });

    const vm = wrapper.vm as any;
    const initialMonth = vm.selectedMonth;

    vm.prevMonth();
    expect(vm.selectedMonth).toBe(initialMonth === 1 ? 12 : initialMonth - 1);

    vm.nextMonth();
    expect(vm.selectedMonth).toBe(initialMonth);
  });
});
