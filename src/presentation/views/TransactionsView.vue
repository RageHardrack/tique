<script setup lang="ts">
import { onMounted } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { TransactionType } from '../../core/entities/Transaction';
import TransactionsSection from '../components/transactions/TransactionsSection.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
});

async function handleCreate(payload: {
  type: TransactionType;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  amount: number;
  destinationAmount?: number;
  exchangeRate?: number;
  date: string;
  note?: string;
}) {
  if (!authStore.user?.id) return;
  await transactionStore.createTransaction({
    ...payload,
    userId: authStore.user.id,
  });
  // Refresh accounts to reflect balance change
  await accountStore.fetchAccounts(authStore.user.id);
}

async function handleUpdate(
  id: string,
  payload: {
    type: TransactionType;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    amount: number;
    destinationAmount?: number;
    exchangeRate?: number;
    date: string;
    note?: string;
  },
) {
  await transactionStore.updateTransaction(id, payload);
  if (authStore.user?.id) {
    await accountStore.fetchAccounts(authStore.user.id);
  }
}

async function handleDelete(id: string) {
  if (confirm('¿Estás seguro de eliminar este movimiento?')) {
    await transactionStore.deleteTransaction(id);
    if (authStore.user?.id) {
      await accountStore.fetchAccounts(authStore.user.id);
    }
  }
}

async function handleImportBatch(
  transactions: {
    type: TransactionType;
    accountId: string;
    categoryId?: string;
    amount: number;
    date: string;
    note?: string;
  }[],
) {
  if (!authStore.user?.id) return;
  const userId = authStore.user.id;

  for (const tx of transactions) {
    await transactionStore.createTransaction({
      ...tx,
      userId,
    });
  }

  await Promise.all([
    accountStore.fetchAccounts(userId),
    transactionStore.fetchTransactions(userId),
  ]);
}
</script>

<template>
  <AppLayout
    title="Movimientos"
    subtitle="Historial detallado, buscador en tiempo real, filtros multicriterio y exportación de datos."
  >
    <TransactionsSection
      :transactions="transactionStore.transactions"
      :accounts="accountStore.accounts"
      :categories="categoryStore.categories"
      :base-currency="rateStore.baseCurrency"
      :convert-fn="
        (amt, from) => rateStore.convert(amt, from, rateStore.baseCurrency)
      "
      :is-loading="transactionStore.isLoading"
      @create="handleCreate"
      @update="handleUpdate"
      @delete="handleDelete"
      @import-batch="handleImportBatch"
    />
  </AppLayout>
</template>
