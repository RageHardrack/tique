import { ref } from 'vue';

import { defineStore } from 'pinia';

import type { Budget } from '../../core/entities/Budget';
import { ApiClient } from '../../infrastructure/api/api-client';

export const useBudgetStore = defineStore('budgets', () => {
  const budgets = ref<Budget[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchBudgets(userId: string) {
    if (!userId) return;
    isLoading.value = true;
    error.value = null;
    try {
      const data = await ApiClient.get<Budget[]>(`/budgets?userId=${userId}`);
      budgets.value = data;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al cargar presupuestos';
    } finally {
      isLoading.value = false;
    }
  }

  async function createBudget(payload: {
    userId: string;
    categoryId: string;
    amount: number;
    currency?: string;
    period?: string;
  }) {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await ApiClient.post<Budget>('/budgets', payload);
      // Remove any existing budget for the same category if upserted
      budgets.value = budgets.value.filter(
        (b) => b.categoryId !== payload.categoryId,
      );
      budgets.value.unshift(created);
      return created;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al crear presupuesto';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateBudget(
    id: string,
    payload: {
      amount?: number;
      currency?: string;
      period?: string;
    },
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<Budget>(`/budgets/${id}`, payload);
      const index = budgets.value.findIndex((b) => b.id === id);
      if (index !== -1) {
        budgets.value[index] = updated;
      }
      return updated;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al actualizar presupuesto';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteBudget(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete(`/budgets/${id}`);
      budgets.value = budgets.value.filter((b) => b.id !== id);
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al eliminar presupuesto';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    budgets,
    isLoading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
});
