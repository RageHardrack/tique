import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { ApiClient } from '../../infrastructure/api/api-client';
import type { CreateGoalInput, SavingsGoal, UpdateGoalInput } from '../../core/entities/Goal';
import { useAuthStore } from './auth';

export const useGoalStore = defineStore('goals', () => {
  const goals = ref<SavingsGoal[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const totalTargetAmount = computed(() => {
    return goals.value.reduce((sum, g) => sum + g.targetAmount, 0);
  });

  const totalSavedAmount = computed(() => {
    return goals.value.reduce((sum, g) => sum + g.currentAmount, 0);
  });

  const overallProgressPercentage = computed(() => {
    if (totalTargetAmount.value <= 0) return 0;
    return Math.min(100, Math.round((totalSavedAmount.value / totalTargetAmount.value) * 1000) / 10);
  });

  async function fetchGoals(_userId?: string) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      goals.value = await ApiClient.get<SavingsGoal[]>('/savings-goals', authStore.accessToken);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function createGoal(payload: CreateGoalInput): Promise<SavingsGoal> {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const created = await ApiClient.post<SavingsGoal>('/savings-goals', payload, authStore.accessToken);
      goals.value.unshift(created);
      return created;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateGoal(id: string, payload: UpdateGoalInput): Promise<SavingsGoal> {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<SavingsGoal>(`/savings-goals/${id}`, payload, authStore.accessToken);
      const index = goals.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        goals.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteGoal(id: string): Promise<void> {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete(`/savings-goals/${id}`, authStore.accessToken);
      goals.value = goals.value.filter((g) => g.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deposit(id: string, amount: number, accountId?: string): Promise<SavingsGoal> {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.post<SavingsGoal>(
        `/savings-goals/${id}/deposit`,
        { amount, accountId },
        authStore.accessToken,
      );
      const index = goals.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        goals.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function withdraw(id: string, amount: number, accountId?: string): Promise<SavingsGoal> {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.post<SavingsGoal>(
        `/savings-goals/${id}/withdraw`,
        { amount, accountId },
        authStore.accessToken,
      );
      const index = goals.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        goals.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    goals,
    isLoading,
    error,
    totalTargetAmount,
    totalSavedAmount,
    overallProgressPercentage,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    deposit,
    withdraw,
  };
});
