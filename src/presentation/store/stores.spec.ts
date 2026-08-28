import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountStore } from './accounts';
import { useCategoryStore } from './categories';
import { useTransactionStore } from './transactions';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Pinia Stores for Financial Domain', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('useAccountStore', () => {
    it('should fetch accounts for a given user', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          userId: 'user-1',
          name: 'Main Bank',
          type: 'CHECKING',
          balance: 1000,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      vi.mocked(ApiClient.get).mockResolvedValueOnce(mockAccounts);

      const store = useAccountStore();
      await store.fetchAccounts('user-1');

      expect(ApiClient.get).toHaveBeenCalledWith('/accounts?userId=user-1');
      expect(store.accounts).toEqual(mockAccounts);
      expect(store.isLoading).toBe(false);
    });

    it('should create an account and prepend to state', async () => {
      const newAcc = {
        id: 'acc-2',
        userId: 'user-1',
        name: 'Cash',
        type: 'CASH' as const,
        balance: 200,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(ApiClient.post).mockResolvedValueOnce(newAcc);

      const store = useAccountStore();
      await store.createAccount({
        userId: 'user-1',
        name: 'Cash',
        type: 'CASH',
        balance: 200,
      });

      expect(ApiClient.post).toHaveBeenCalledWith('/accounts', {
        userId: 'user-1',
        name: 'Cash',
        type: 'CASH',
        balance: 200,
      });
      expect(store.accounts).toContainEqual(newAcc);
    });
    it('should calculate totalBalance properly', () => {
      const store = useAccountStore();
      store.accounts = [
        {
          id: 'acc-1',
          userId: 'user-1',
          name: 'Checking',
          type: 'CHECKING',
          balance: 1500,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'acc-2',
          userId: 'user-1',
          name: 'Savings',
          type: 'SAVINGS',
          balance: 3500.5,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(store.totalBalance).toBe(5000.5);
    });

    it('should calculate balancesByCurrency accurately', () => {
      const store = useAccountStore();
      store.accounts = [
        {
          id: 'acc-1',
          userId: 'user-1',
          name: 'USD Checking',
          type: 'CHECKING',
          balance: 2000,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'acc-2',
          userId: 'user-1',
          name: 'PEN Savings',
          type: 'SAVINGS',
          balance: 5000,
          currency: 'PEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'acc-3',
          userId: 'user-1',
          name: 'VES Wallet',
          type: 'CASH',
          balance: 100000,
          currency: 'VES',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(store.balancesByCurrency).toEqual({
        USD: 2000,
        PEN: 5000,
        VES: 100000,
      });
    });

    it('should delete an account and remove from state', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useAccountStore();
      store.accounts = [
        {
          id: 'acc-1',
          userId: 'user-1',
          name: 'Checking',
          type: 'CHECKING',
          balance: 1500,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'acc-2',
          userId: 'user-1',
          name: 'Cash',
          type: 'CASH',
          balance: 100,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await store.deleteAccount('acc-1');

      expect(ApiClient.delete).toHaveBeenCalledWith('/accounts/acc-1');
      expect(store.accounts).toHaveLength(1);
      expect(store.accounts[0].id).toBe('acc-2');
    });
  });

  describe('useCategoryStore', () => {
    it('should fetch categories for a user', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          userId: 'user-1',
          name: 'Food',
          type: 'EXPENSE' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      vi.mocked(ApiClient.get).mockResolvedValueOnce(mockCategories);

      const store = useCategoryStore();
      await store.fetchCategories('user-1');

      expect(ApiClient.get).toHaveBeenCalledWith('/categories?userId=user-1');
      expect(store.categories).toEqual(mockCategories);
    });

    it('should create a category and add to state', async () => {
      const newCat = {
        id: 'cat-2',
        userId: 'user-1',
        name: 'Salary',
        type: 'INCOME' as const,
        icon: 'i-heroicons-banknotes',
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(ApiClient.post).mockResolvedValueOnce(newCat);

      const store = useCategoryStore();
      await store.createCategory({
        userId: 'user-1',
        name: 'Salary',
        type: 'INCOME',
        icon: 'i-heroicons-banknotes',
        color: '#10b981',
      });

      expect(ApiClient.post).toHaveBeenCalledWith('/categories', {
        userId: 'user-1',
        name: 'Salary',
        type: 'INCOME',
        icon: 'i-heroicons-banknotes',
        color: '#10b981',
      });
      expect(store.categories).toContainEqual(newCat);
    });

    it('should delete a category and remove from state', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useCategoryStore();
      store.categories = [
        {
          id: 'cat-1',
          userId: 'user-1',
          name: 'Food',
          type: 'EXPENSE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await store.deleteCategory('cat-1');

      expect(ApiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
      expect(store.categories).toHaveLength(0);
    });

    it('should correctly filter incomeCategories and expenseCategories', () => {
      const store = useCategoryStore();
      store.categories = [
        {
          id: 'cat-1',
          userId: 'user-1',
          name: 'Salary',
          type: 'INCOME',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-2',
          userId: 'user-1',
          name: 'Groceries',
          type: 'EXPENSE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(store.incomeCategories).toHaveLength(1);
      expect(store.incomeCategories[0].name).toBe('Salary');
      expect(store.expenseCategories).toHaveLength(1);
      expect(store.expenseCategories[0].name).toBe('Groceries');
    });
  });

  describe('useTransactionStore', () => {
    it('should fetch transactions for a user', async () => {
      const mockTx = [
        {
          id: 'tx-1',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 50,
          type: 'EXPENSE' as const,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      vi.mocked(ApiClient.get).mockResolvedValueOnce(mockTx);

      const store = useTransactionStore();
      await store.fetchTransactions('user-1');

      expect(ApiClient.get).toHaveBeenCalledWith('/transactions?userId=user-1');
      expect(store.transactions).toEqual(mockTx);
    });

    it('should create a transaction and prepend to state', async () => {
      const newTx = {
        id: 'tx-2',
        userId: 'user-1',
        accountId: 'acc-1',
        amount: 250,
        type: 'INCOME' as const,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(ApiClient.post).mockResolvedValueOnce(newTx);

      const store = useTransactionStore();
      await store.createTransaction({
        userId: 'user-1',
        accountId: 'acc-1',
        amount: 250,
        type: 'INCOME',
      });

      expect(ApiClient.post).toHaveBeenCalledWith('/transactions', {
        userId: 'user-1',
        accountId: 'acc-1',
        amount: 250,
        type: 'INCOME',
      });
      expect(store.transactions).toContainEqual(newTx);
    });

    it('should delete a transaction and remove from state', async () => {
      vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

      const store = useTransactionStore();
      store.transactions = [
        {
          id: 'tx-1',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 50,
          type: 'EXPENSE',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await store.deleteTransaction('tx-1');

      expect(ApiClient.delete).toHaveBeenCalledWith('/transactions/tx-1');
      expect(store.transactions).toHaveLength(0);
    });

    it('should correctly compute totalIncome and totalExpenses', () => {
      const store = useTransactionStore();
      store.transactions = [
        {
          id: 'tx-1',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 1000,
          type: 'INCOME',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 500,
          type: 'INCOME',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'tx-3',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 200,
          type: 'EXPENSE',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'tx-4',
          userId: 'user-1',
          accountId: 'acc-1',
          destinationAccountId: 'acc-2',
          amount: 300,
          type: 'TRANSFER',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(store.totalIncome).toBe(1500);
      expect(store.totalExpenses).toBe(200);
    });
  });
});
