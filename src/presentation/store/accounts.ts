import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { ApiClient } from '../../infrastructure/api/api-client';
import type { Account, AccountType } from '../../core/entities/Account';

export interface CreateAccountInput {
  userId: string;
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
}

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const totalBalance = computed(() => {
    return accounts.value.reduce(
      (acc, account) => acc + (account.balance || 0),
      0,
    );
  });

  const balancesByCurrency = computed(() => {
    const map: Record<string, number> = {};
    accounts.value.forEach((account) => {
      const curr = (account.currency || 'USD').toUpperCase();
      map[curr] = (map[curr] || 0) + (account.balance || 0);
    });
    return map;
  });

  async function fetchAccounts(userId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      accounts.value = await ApiClient.get<Account[]>(
        `/accounts?userId=${userId}`,
      );
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function createAccount(input: CreateAccountInput) {
    isLoading.value = true;
    error.value = null;
    try {
      const newAcc = await ApiClient.post<Account>('/accounts', input);
      accounts.value.unshift(newAcc);
      return newAcc;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAccount(
    id: string,
    payload: Partial<Omit<CreateAccountInput, 'userId'>>,
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<Account>(`/accounts/${id}`, payload);
      const index = accounts.value.findIndex((acc) => acc.id === id);
      if (index !== -1) {
        accounts.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteAccount(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete<{ success: boolean }>(`/accounts/${id}`);
      accounts.value = accounts.value.filter((acc) => acc.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function reconcileAccount(id: string, realBalance: number, note?: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await ApiClient.post<{ account: Account; discrepancy: number }>(
        `/accounts/${id}/reconcile`,
        { realBalance, note },
      );
      const index = accounts.value.findIndex((acc) => acc.id === id);
      if (index !== -1) {
        accounts.value[index] = response.account;
      }
      return response;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    accounts,
    isLoading,
    error,
    totalBalance,
    balancesByCurrency,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    reconcileAccount,
  };
});
