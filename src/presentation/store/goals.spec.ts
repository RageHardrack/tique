import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGoalStore } from './goals';
import { ApiClient } from '../../infrastructure/api/api-client';

describe('useGoalStore - Sinking Funds & Savings Goals', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockGoal = {
    id: 'goal-1',
    userId: 'user-1',
    name: 'Fondo de Emergencia',
    targetAmount: 5000,
    currentAmount: 2500,
    currency: 'USD',
    targetDate: '2026-12-31',
    color: '#10B981',
    icon: 'i-heroicons-shield-check',
    isCompleted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('should fetch and calculate overall progress percentage', async () => {
    const store = useGoalStore();
    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce([
      mockGoal,
      { ...mockGoal, id: 'goal-2', targetAmount: 5000, currentAmount: 5000, isCompleted: true },
    ]);

    await store.fetchGoals();

    expect(store.goals.length).toBe(2);
    expect(store.totalTargetAmount).toBe(10000);
    expect(store.totalSavedAmount).toBe(7500);
    expect(store.overallProgressPercentage).toBe(75);
  });

  it('should deposit funds and update state reactively', async () => {
    const store = useGoalStore();
    store.goals = [{ ...mockGoal }];

    const updatedGoal = { ...mockGoal, currentAmount: 3000 };
    vi.spyOn(ApiClient, 'post').mockResolvedValueOnce(updatedGoal);

    const result = await store.deposit('goal-1', 500, 'acc-1');

    expect(result.currentAmount).toBe(3000);
    expect(store.goals[0].currentAmount).toBe(3000);
  });

  it('should withdraw funds and update state reactively', async () => {
    const store = useGoalStore();
    store.goals = [{ ...mockGoal }];

    const updatedGoal = { ...mockGoal, currentAmount: 2000 };
    vi.spyOn(ApiClient, 'post').mockResolvedValueOnce(updatedGoal);

    const result = await store.withdraw('goal-1', 500, 'acc-1');

    expect(result.currentAmount).toBe(2000);
    expect(store.goals[0].currentAmount).toBe(2000);
  });
});
