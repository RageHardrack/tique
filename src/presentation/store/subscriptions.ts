import { ref } from 'vue';

import { defineStore } from 'pinia';

import { ApiClient } from '../../infrastructure/api/api-client';
import type {
  RecurrenceFrequency,
  Subscription,
} from '../../core/entities/Subscription';

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSubscriptions(userId: string) {
    if (!userId) return;
    isLoading.value = true;
    error.value = null;
    try {
      const data = await ApiClient.get<Subscription[]>(
        `/subscriptions?userId=${userId}`,
      );
      subscriptions.value = data;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al cargar suscripciones';
    } finally {
      isLoading.value = false;
    }
  }

  async function createSubscription(payload: {
    userId: string;
    accountId: string;
    categoryId?: string;
    name: string;
    amount: number;
    currency?: string;
    frequency?: RecurrenceFrequency;
    customIntervalDays?: number | null;
    nextDueDate: string;
  }) {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await ApiClient.post<Subscription>(
        '/subscriptions',
        payload,
      );
      subscriptions.value.push(created);
      // Re-sort by nextDueDate
      subscriptions.value.sort(
        (a, b) =>
          new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
      );
      return created;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al registrar suscripción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function paySubscription(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await ApiClient.post<{
        transactionId: string;
        subscription: Subscription;
      }>(`/subscriptions/${id}/pay`, {});

      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx !== -1) {
        subscriptions.value[idx] = response.subscription;
      }
      return response;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al registrar pago';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSubscription(
    id: string,
    payload: Partial<{
      accountId: string;
      categoryId: string | null;
      name: string;
      amount: number;
      currency: string;
      frequency: RecurrenceFrequency;
      customIntervalDays: number | null;
      nextDueDate: string;
      isActive: boolean;
    }>,
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<Subscription>(
        `/subscriptions/${id}`,
        payload,
      );
      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx !== -1) {
        subscriptions.value[idx] = updated;
      }
      subscriptions.value.sort(
        (a, b) =>
          new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
      );
      return updated;
    } catch (err: unknown) {
      error.value =
        (err as Error).message || 'Error al actualizar suscripción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteSubscription(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete(`/subscriptions/${id}`);
      subscriptions.value = subscriptions.value.filter((s) => s.id !== id);
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al eliminar suscripción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    subscriptions,
    isLoading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    paySubscription,
    deleteSubscription,
  };
});
