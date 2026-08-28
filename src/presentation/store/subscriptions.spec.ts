import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubscriptionStore } from './subscriptions';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should fetch subscriptions for user', async () => {
    const mockSubs = [
      {
        id: 'sub-1',
        userId: 'user-1',
        accountId: 'acc-1',
        name: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        frequency: 'MONTHLY' as const,
        nextDueDate: '2026-09-01',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    vi.mocked(ApiClient.get).mockResolvedValueOnce(mockSubs);

    const store = useSubscriptionStore();
    await store.fetchSubscriptions('user-1');

    expect(ApiClient.get).toHaveBeenCalledWith('/subscriptions?userId=user-1');
    expect(store.subscriptions).toEqual(mockSubs);
  });

  it('should create subscription and sort by date', async () => {
    const createdSub = {
      id: 'sub-2',
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Netflix',
      amount: 15.99,
      currency: 'USD',
      frequency: 'MONTHLY' as const,
      nextDueDate: '2026-09-10',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    vi.mocked(ApiClient.post).mockResolvedValueOnce(createdSub);

    const store = useSubscriptionStore();
    await store.createSubscription({
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Netflix',
      amount: 15.99,
      nextDueDate: '2026-09-10',
    });

    expect(ApiClient.post).toHaveBeenCalledWith('/subscriptions', {
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Netflix',
      amount: 15.99,
      nextDueDate: '2026-09-10',
    });
    expect(store.subscriptions).toContainEqual(createdSub);
  });

  it('should execute paySubscription and update state', async () => {
    const store = useSubscriptionStore();
    store.subscriptions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        accountId: 'acc-1',
        name: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        frequency: 'MONTHLY',
        nextDueDate: '2026-08-25',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const updatedSub = {
      ...store.subscriptions[0],
      nextDueDate: '2026-09-25',
    };

    vi.mocked(ApiClient.post).mockResolvedValueOnce({
      transactionId: 'tx-new-1',
      subscription: updatedSub,
    });

    const res = await store.paySubscription('sub-1');

    expect(ApiClient.post).toHaveBeenCalledWith('/subscriptions/sub-1/pay', {});
    expect(res.transactionId).toBe('tx-new-1');
    expect(store.subscriptions[0].nextDueDate).toBe('2026-09-25');
  });

  it('should support creating a custom frequency subscription with customIntervalDays', async () => {
    const customSub = {
      id: 'sub-custom-1',
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Gas Delivery',
      amount: 45,
      currency: 'USD',
      frequency: 'CUSTOM' as const,
      customIntervalDays: 45,
      nextDueDate: '2026-09-15',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    vi.mocked(ApiClient.post).mockResolvedValueOnce(customSub);

    const store = useSubscriptionStore();
    await store.createSubscription({
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Gas Delivery',
      amount: 45,
      frequency: 'CUSTOM',
      customIntervalDays: 45,
      nextDueDate: '2026-09-15',
    });

    expect(ApiClient.post).toHaveBeenCalledWith('/subscriptions', {
      userId: 'user-1',
      accountId: 'acc-1',
      name: 'Gas Delivery',
      amount: 45,
      frequency: 'CUSTOM',
      customIntervalDays: 45,
      nextDueDate: '2026-09-15',
    });
    expect(store.subscriptions).toContainEqual(customSub);
  });
});
