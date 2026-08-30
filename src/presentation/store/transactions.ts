import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { ApiClient } from '../../infrastructure/api/api-client';
import type {
  Transaction,
  TransactionType,
} from '../../core/entities/Transaction';
import type {
  TaxCategory,
  TaxDeductionType,
  TaxDocumentType,
} from '../../core/entities/Tax';

export interface CreateTransactionInput {
  userId: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string | null;
  amount: number;
  destinationAmount?: number;
  exchangeRate?: number;
  type: TransactionType;
  date?: string;
  note?: string;
  taxCategory?: TaxCategory;
  taxDocumentType?: TaxDocumentType;
  taxDocumentNumber?: string;
  taxWithholdingAmount?: number | null;
  taxDeductionType?: TaxDeductionType;
}

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const totalIncome = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  });

  const totalExpenses = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  });

  async function fetchTransactions(userId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      transactions.value = await ApiClient.get<Transaction[]>(
        `/transactions?userId=${userId}`,
      );
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function createTransaction(input: CreateTransactionInput) {
    isLoading.value = true;
    error.value = null;
    try {
      const newTx = await ApiClient.post<Transaction>('/transactions', input);
      transactions.value.unshift(newTx);
      return newTx;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTransaction(
    id: string,
    payload: Partial<Omit<CreateTransactionInput, 'userId'>>,
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<Transaction>(
        `/transactions/${id}`,
        payload,
      );
      const index = transactions.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        transactions.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteTransaction(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete<{ success: boolean }>(`/transactions/${id}`);
      transactions.value = transactions.value.filter((t) => t.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    transactions,
    isLoading,
    error,
    totalIncome,
    totalExpenses,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
});
