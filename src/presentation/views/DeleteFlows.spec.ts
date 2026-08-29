import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '../../infrastructure/api/api-client';
import { LoanApiClient } from '../../infrastructure/api/LoanApiClient';
import { useAccountStore } from '../store/accounts';
import { useBudgetStore } from '../store/budgets';
import { useCategoryStore } from '../store/categories';
import { useGoalStore } from '../store/goals';
import { useLoanStore } from '../store/loan.store';
import { useSubscriptionStore } from '../store/subscriptions';
import { useTransactionStore } from '../store/transactions';

vi.mock('../../infrastructure/api/api-client');
vi.mock('../../infrastructure/api/LoanApiClient');

describe('Exhaustive DELETE Operations Suite - Store & API Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Transactions DELETE flow', () => {
    it('successfully calls DELETE /transactions/:id and removes transaction from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useTransactionStore();
      store.transactions = [
        {
          id: 'tx-1',
          userId: 'u1',
          accountId: 'acc-1',
          amount: 50,
          type: 'EXPENSE',
          date: '2026-08-29',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'tx-2',
          userId: 'u1',
          accountId: 'acc-1',
          amount: 100,
          type: 'INCOME',
          date: '2026-08-29',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteTransaction('tx-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/transactions/tx-1');
      expect(store.transactions).toHaveLength(1);
      expect(store.transactions[0].id).toBe('tx-2');
    });

    it('sets error message when DELETE /transactions/:id fails', async () => {
      vi.mocked(ApiClient.delete).mockRejectedValueOnce(new Error('Network error'));

      const store = useTransactionStore();
      store.transactions = [
        {
          id: 'tx-1',
          userId: 'u1',
          accountId: 'acc-1',
          amount: 50,
          type: 'EXPENSE',
          date: '2026-08-29',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await expect(store.deleteTransaction('tx-1')).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.transactions).toHaveLength(1);
    });
  });

  describe('Accounts DELETE flow', () => {
    it('successfully calls DELETE /accounts/:id and removes account from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useAccountStore();
      store.accounts = [
        {
          id: 'acc-1',
          userId: 'u1',
          name: 'Main Checking',
          type: 'CHECKING',
          balance: 1000,
          currency: 'USD',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'acc-2',
          userId: 'u1',
          name: 'Savings',
          type: 'SAVINGS',
          balance: 3000,
          currency: 'USD',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteAccount('acc-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/accounts/acc-1');
      expect(store.accounts).toHaveLength(1);
      expect(store.accounts[0].id).toBe('acc-2');
    });
  });

  describe('Categories DELETE flow', () => {
    it('successfully calls DELETE /categories/:id and removes category from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useCategoryStore();
      store.categories = [
        {
          id: 'cat-1',
          userId: 'u1',
          name: 'Comida',
          type: 'EXPENSE',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteCategory('cat-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
      expect(store.categories).toHaveLength(0);
    });
  });

  describe('Budgets DELETE flow', () => {
    it('successfully calls DELETE /budgets/:id and removes budget from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useBudgetStore();
      store.budgets = [
        {
          id: 'b-1',
          userId: 'u1',
          categoryId: 'cat-1',
          amount: 500,
          currency: 'USD',
          period: 'MONTHLY',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteBudget('b-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/budgets/b-1');
      expect(store.budgets).toHaveLength(0);
    });
  });

  describe('Subscriptions DELETE flow', () => {
    it('successfully calls DELETE /subscriptions/:id and removes subscription from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useSubscriptionStore();
      store.subscriptions = [
        {
          id: 'sub-1',
          userId: 'u1',
          accountId: 'acc-1',
          name: 'Netflix',
          amount: 15,
          currency: 'USD',
          frequency: 'MONTHLY',
          nextDueDate: '2026-09-01',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteSubscription('sub-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/subscriptions/sub-1');
      expect(store.subscriptions).toHaveLength(0);
    });
  });

  describe('Savings Goals DELETE flow', () => {
    it('successfully calls DELETE /savings-goals/:id and removes goal from store', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useGoalStore();
      store.goals = [
        {
          id: 'goal-1',
          userId: 'u1',
          name: 'Fondo de Emergencia',
          targetAmount: 5000,
          currentAmount: 2000,
          currency: 'USD',
          targetDate: null,
          color: null,
          icon: null,
          isCompleted: false,
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteGoal('goal-1');

      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledWith('/savings-goals/goal-1', null);
      expect(store.goals).toHaveLength(0);
    });
  });

  describe('Loans DELETE flow', () => {
    it('successfully calls LoanApiClient.deleteLoan and removes loan from store', async () => {
      vi.mocked(LoanApiClient.deleteLoan).mockResolvedValueOnce({ success: true });

      const store = useLoanStore();
      store.loans = [
        {
          id: 'loan-1',
          userId: 'u1',
          personName: 'Carlos Gómez',
          type: 'LENT',
          amount: 1000,
          remainingAmount: 500,
          currency: 'USD',
          status: 'PENDING',
          createdAt: '',
          updatedAt: '',
        },
      ];

      await store.deleteLoan('loan-1');

      expect(LoanApiClient.deleteLoan).toHaveBeenCalledWith('loan-1', null);
      expect(store.loans).toHaveLength(0);
    });
  });
});
