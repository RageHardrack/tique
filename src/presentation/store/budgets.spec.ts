import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetStore } from './budgets';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useBudgetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should fetch budgets for a user', async () => {
    const mockBudgets = [
      {
        id: 'b-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        amount: 300,
        currency: 'USD',
        period: 'MONTHLY',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    vi.mocked(ApiClient.get).mockResolvedValueOnce(mockBudgets);

    const store = useBudgetStore();
    await store.fetchBudgets('user-1');

    expect(ApiClient.get).toHaveBeenCalledWith('/budgets?userId=user-1');
    expect(store.budgets).toEqual(mockBudgets);
    expect(store.isLoading).toBe(false);
  });

  it('should create a budget and add to list', async () => {
    const createdBudget = {
      id: 'b-2',
      userId: 'user-1',
      categoryId: 'cat-2',
      amount: 500,
      currency: 'USD',
      period: 'MONTHLY',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    vi.mocked(ApiClient.post).mockResolvedValueOnce(createdBudget);

    const store = useBudgetStore();
    const result = await store.createBudget({
      userId: 'user-1',
      categoryId: 'cat-2',
      amount: 500,
    });

    expect(ApiClient.post).toHaveBeenCalledWith('/budgets', {
      userId: 'user-1',
      categoryId: 'cat-2',
      amount: 500,
    });
    expect(result).toEqual(createdBudget);
    expect(store.budgets).toContainEqual(createdBudget);
  });

  it('should delete a budget', async () => {
    const store = useBudgetStore();
    store.budgets = [
      {
        id: 'b-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        amount: 300,
        currency: 'USD',
        period: 'MONTHLY',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

    await store.deleteBudget('b-1');

    expect(ApiClient.delete).toHaveBeenCalledWith('/budgets/b-1');
    expect(store.budgets).toHaveLength(0);
  });
});
