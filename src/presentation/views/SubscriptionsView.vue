<script setup lang="ts">
import { onMounted } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useSubscriptionStore } from '../store/subscriptions';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { RecurrenceFrequency } from '../../core/entities/Subscription';
import SubscriptionsSection from '../components/subscriptions/SubscriptionsSection.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const subscriptionStore = useSubscriptionStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      subscriptionStore.fetchSubscriptions(authStore.user.id),
    ]);
  }
});

async function handleCreate(payload: {
  name: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  currency: string;
  frequency: RecurrenceFrequency;
  customIntervalDays?: number | null;
  nextDueDate: string;
}) {
  if (!authStore.user?.id) return;
  await subscriptionStore.createSubscription({
    ...payload,
    userId: authStore.user.id,
  });
}

async function handleUpdate(
  id: string,
  payload: {
    name: string;
    accountId: string;
    categoryId?: string | null;
    amount: number;
    currency: string;
    frequency: RecurrenceFrequency;
    customIntervalDays?: number | null;
    nextDueDate: string;
  },
) {
  await subscriptionStore.updateSubscription(id, payload);
}

async function handlePay(id: string) {
  await subscriptionStore.paySubscription(id);
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
}

async function handleDelete(id: string) {
  await subscriptionStore.deleteSubscription(id);
}
</script>

<template>
  <AppLayout
    title="Suscripciones & Pagos Fijos"
    subtitle="Supervisa tus compromisos recurrentes, fechas de cobro y registra pagos con un solo clic."
  >
    <SubscriptionsSection
      :subscriptions="subscriptionStore.subscriptions"
      :accounts="accountStore.accounts"
      :categories="categoryStore.categories"
      :base-currency="rateStore.baseCurrency"
      :is-loading="subscriptionStore.isLoading"
      @create="handleCreate"
      @update="handleUpdate"
      @pay="handlePay"
      @delete="handleDelete"
    />
  </AppLayout>
</template>
