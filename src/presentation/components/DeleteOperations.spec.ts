import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import AccountCard from './accounts/AccountCard.vue';
import BudgetsSection from './budgets/BudgetsSection.vue';
import CategoryItem from './categories/CategoryItem.vue';
import GoalCard from './goals/GoalCard.vue';
import LoanCard from './loans/LoanCard.vue';
import SubscriptionsSection from './subscriptions/SubscriptionsSection.vue';
import TransactionItem from './transactions/TransactionItem.vue';

describe('Exhaustive DELETE Operations Suite - UI Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('TransactionItem.vue', () => {
    it('emits "delete" with the transaction ID when delete button is clicked', async () => {
      const mockTx = {
        id: 'tx-delete-123',
        userId: 'u1',
        accountId: 'acc-1',
        amount: 150,
        type: 'EXPENSE' as const,
        date: '2026-08-29T10:00:00.000Z',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(TransactionItem, {
        props: {
          transaction: mockTx,
          canDelete: true,
        },
      });

      const deleteBtn = wrapper.find('button[aria-label="Eliminar movimiento"]');
      expect(deleteBtn.exists()).toBe(true);

      await deleteBtn.trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['tx-delete-123']);
    });

    it('hides delete button when canDelete is false', () => {
      const mockTx = {
        id: 'tx-nodelete-456',
        userId: 'u1',
        accountId: 'acc-1',
        amount: 200,
        type: 'INCOME' as const,
        date: '2026-08-29T10:00:00.000Z',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(TransactionItem, {
        props: {
          transaction: mockTx,
          canDelete: false,
        },
      });

      const deleteBtn = wrapper.find('button[aria-label="Eliminar movimiento"]');
      expect(deleteBtn.exists()).toBe(false);
    });
  });

  describe('AccountCard.vue', () => {
    it('emits "delete" with the account ID when delete is triggered', async () => {
      const mockAccount = {
        id: 'acc-del-789',
        userId: 'u1',
        name: 'Cuenta Ahorros BBVA',
        type: 'SAVINGS' as const,
        balance: 5000,
        currency: 'PEN',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(AccountCard, {
        props: {
          account: mockAccount,
        },
      });

      const vm = wrapper.vm as any;
      vm.handleDelete();

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['acc-del-789']);
    });
  });

  describe('CategoryItem.vue', () => {
    it('emits "delete" with the category ID when delete is triggered', async () => {
      const mockCategory = {
        id: 'cat-del-101',
        userId: 'u1',
        name: 'Restaurantes & Bares',
        type: 'EXPENSE' as const,
        icon: 'i-heroicons-cake',
        color: '#f59e0b',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CategoryItem, {
        props: {
          category: mockCategory,
        },
      });

      const vm = wrapper.vm as any;
      vm.handleDelete();

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['cat-del-101']);
    });
  });

  describe('BudgetsSection.vue', () => {
    it('emits "delete" with the budget ID when handleDelete is called', async () => {
      const wrapper = mount(BudgetsSection, {
        props: {
          budgets: [
            {
              id: 'budget-del-555',
              userId: 'u1',
              categoryId: 'cat-1',
              amount: 800,
              currency: 'USD',
              period: 'MONTHLY' as const,
              createdAt: '',
              updatedAt: '',
            },
          ],
          categories: [{ id: 'cat-1', userId: 'u1', name: 'Super', type: 'EXPENSE' as const, createdAt: '', updatedAt: '' }],
          transactions: [],
          accountsCurrencyMap: {},
          baseCurrency: 'USD',
          convertFn: (amt: number) => amt,
          isLoading: false,
        },
      });

      const vm = wrapper.vm as any;
      vm.handleDelete('budget-del-555');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['budget-del-555']);
    });
  });

  describe('SubscriptionsSection.vue', () => {
    it('emits "delete" with subscription ID when handleDelete is called', async () => {
      const wrapper = mount(SubscriptionsSection, {
        props: {
          subscriptions: [
            {
              id: 'sub-del-333',
              userId: 'u1',
              accountId: 'acc-1',
              name: 'Spotify Family',
              amount: 15.99,
              currency: 'USD',
              frequency: 'MONTHLY' as const,
              nextDueDate: '2026-09-01',
              isActive: true,
              createdAt: '',
              updatedAt: '',
            },
          ],
          accounts: [{ id: 'acc-1', userId: 'u1', name: 'Main', type: 'CHECKING' as const, balance: 1000, currency: 'USD', createdAt: '', updatedAt: '' }],
          categories: [],
          baseCurrency: 'USD',
          isLoading: false,
        },
      });

      const vm = wrapper.vm as any;
      vm.handleDelete('sub-del-333');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['sub-del-333']);
    });
  });

  describe('GoalCard.vue', () => {
    it('emits "delete" with goal ID when delete button is clicked', async () => {
      const mockGoal = {
        id: 'goal-del-777',
        userId: 'u1',
        name: 'Viaje a Japón',
        targetAmount: 4000,
        currentAmount: 1500,
        currency: 'USD',
        targetDate: null,
        color: null,
        icon: null,
        isCompleted: false,
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(GoalCard, {
        props: {
          goal: mockGoal,
          baseCurrency: 'USD',
          formatFn: (amt: number, cur: string) => `$${amt} ${cur}`,
        },
      });

      const deleteBtn = wrapper.find('button[aria-label="Eliminar meta"]');
      expect(deleteBtn.exists()).toBe(true);

      await deleteBtn.trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['goal-del-777']);
    });
  });

  describe('LoanCard.vue', () => {
    it('emits "delete" with loan ID when delete button is clicked', async () => {
      const mockLoan = {
        id: 'loan-del-888',
        userId: 'u1',
        personName: 'Carlos Gómez',
        type: 'LENT' as const,
        amount: 1000,
        remainingAmount: 600,
        currency: 'USD',
        status: 'PENDING' as const,
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(LoanCard, {
        props: {
          loan: mockLoan,
        },
      });

      const deleteBtn = wrapper.find('button[aria-label="Eliminar préstamo"]');
      expect(deleteBtn.exists()).toBe(true);

      await deleteBtn.trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['loan-del-888']);
    });
  });
});
