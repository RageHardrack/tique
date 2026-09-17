<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useSubscriptionStore } from '../store/subscriptions';
import { useLoanStore } from '../store/loan.store';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { RecurrenceFrequency, Subscription } from '../../core/entities/Subscription';
import { useConfirm } from '../composables/useConfirm';
import SubscriptionsSection from '../components/subscriptions/SubscriptionsSection.vue';
import FinancialCalendar from '../components/calendar/FinancialCalendar.vue';
import PaySubscriptionModal from '../components/subscriptions/PaySubscriptionModal.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const subscriptionStore = useSubscriptionStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const loanStore = useLoanStore();
const rateStore = useExchangeRateStore();
const { confirm: confirmDialog } = useConfirm();

const activeTab = ref<'LIST' | 'CALENDAR'>('LIST');

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      subscriptionStore.fetchSubscriptions(authStore.user.id),
      loanStore.fetchLoans(authStore.user.id),
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

const isPayModalOpen = ref(false);
const subscriptionToPay = ref<Subscription | null>(null);

function handleOpenPay(id: string) {
  const sub = subscriptionStore.subscriptions.find((s) => s.id === id);
  if (!sub) return;
  subscriptionToPay.value = sub;
  isPayModalOpen.value = true;
}

async function handleConfirmPay(payload: {
  id: string;
  debitedAmount?: number;
  exchangeRate?: number;
  destinationAmount?: number;
  accountId?: string;
  paymentDate?: string;
  note?: string;
}) {
  await subscriptionStore.paySubscription(payload.id, {
    debitedAmount: payload.debitedAmount,
    exchangeRate: payload.exchangeRate,
    destinationAmount: payload.destinationAmount,
    accountId: payload.accountId,
    paymentDate: payload.paymentDate,
    note: payload.note,
  });
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
}

async function handleDelete(id: string) {
  const confirmed = await confirmDialog({
    title: 'Eliminar suscripción',
    message: '¿Estás seguro de que deseas eliminar esta suscripción recurrente?',
    confirmText: 'Eliminar',
    variant: 'danger',
  });

  if (confirmed) {
    await subscriptionStore.deleteSubscription(id);
  }
}
</script>

<template>
  <AppLayout
    title="Suscripciones & Pagos Fijos"
    subtitle="Supervisa tus compromisos recurrentes, fechas de cobro y calendario financiero unificado."
  >
    <div class="space-y-6">
      <!-- Tabs Switcher -->
      <div class="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#162032] border border-slate-200 dark:border-[#283a59] w-fit">
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="[
            activeTab === 'LIST'
              ? 'bg-white dark:bg-[#0B0F19] text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
          ]"
          @click="activeTab = 'LIST'"
        >
          <UIcon name="i-heroicons-list-bullet" class="w-4 h-4" />
          <span>Lista de Suscripciones</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="[
            activeTab === 'CALENDAR'
              ? 'bg-white dark:bg-[#0B0F19] text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
          ]"
          @click="activeTab = 'CALENDAR'"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
          <span>Calendario Financiero</span>
        </button>
      </div>

      <!-- Tab: Subscriptions List -->
      <SubscriptionsSection
        v-if="activeTab === 'LIST'"
        :subscriptions="subscriptionStore.subscriptions"
        :accounts="accountStore.accounts"
        :categories="categoryStore.categories"
        :base-currency="rateStore.baseCurrency"
        :is-loading="subscriptionStore.isLoading"
        @create="handleCreate"
        @update="handleUpdate"
        @pay="handleOpenPay"
        @delete="handleDelete"
      />

      <!-- Tab: Unified Financial Calendar -->
      <FinancialCalendar
        v-else-if="activeTab === 'CALENDAR'"
        :subscriptions="subscriptionStore.subscriptions"
        :loans="loanStore.loans"
        :accounts="accountStore.accounts"
        :base-currency="rateStore.baseCurrency"
        @pay-subscription="handleOpenPay"
      />

      <!-- Smart Cross-Currency Pay Modal -->
      <PaySubscriptionModal
        v-model:open="isPayModalOpen"
        :subscription="subscriptionToPay"
        :accounts="accountStore.accounts"
        @pay="handleConfirmPay"
      />
    </div>
  </AppLayout>
</template>
