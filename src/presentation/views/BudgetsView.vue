<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useBudgetStore } from '../store/budgets';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { SupportedCurrency } from '../../core/entities/Account';
import BudgetsSection from '../components/budgets/BudgetsSection.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      budgetStore.fetchBudgets(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
});

const accountsCurrencyMap = computed(() => {
  const map: Record<string, string> = {};
  accountStore.accounts.forEach((acc) => {
    map[acc.id] = acc.currency || 'USD';
  });
  return map;
});

function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: SupportedCurrency,
) {
  return rateStore.convert(amount, fromCurrency, toCurrency);
}

async function handleCreate(payload: {
  categoryId: string;
  amount: number;
  currency: string;
  period: string;
}) {
  if (!authStore.user?.id) return;
  await budgetStore.createBudget({
    ...payload,
    userId: authStore.user.id,
  });
}

async function handleUpdate(
  id: string,
  payload: {
    amount: number;
    currency: string;
    period: string;
  },
) {
  await budgetStore.updateBudget(id, payload);
}

async function handleDelete(id: string) {
  await budgetStore.deleteBudget(id);
}
</script>

<template>
  <AppLayout
    title="Presupuestos Mensuales"
    subtitle="Establece límites de gasto por categoría y mantén tus finanzas bajo control."
  >
    <BudgetsSection
      :budgets="budgetStore.budgets"
      :categories="categoryStore.categories"
      :transactions="transactionStore.transactions"
      :accounts-currency-map="accountsCurrencyMap"
      :base-currency="rateStore.baseCurrency"
      :convert-fn="convertAmount"
      :is-loading="budgetStore.isLoading"
      @create="handleCreate"
      @update="handleUpdate"
      @delete="handleDelete"
    />
  </AppLayout>
</template>
