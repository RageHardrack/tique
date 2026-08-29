<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { RouterLink } from 'vue-router';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useBudgetStore } from '../store/budgets';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useSubscriptionStore } from '../store/subscriptions';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { TransactionType } from '../../core/entities/Transaction';
import { AnalyticsService } from '../../core/services/AnalyticsService';
import { CurrencyFormatter } from '../../core/services/CurrencyFormatter';
import { ReminderService } from '../../core/services/ReminderService';
import TransactionItem from '../components/transactions/TransactionItem.vue';
import CategoryDonutChart from '../components/analytics/CategoryDonutChart.vue';
import CashflowSummaryCard from '../components/analytics/CashflowSummaryCard.vue';
import CreateTransactionModal from '../components/transactions/CreateTransactionModal.vue';
import UrgentRemindersBanner from '../components/dashboard/UrgentRemindersBanner.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const budgetStore = useBudgetStore();
const subscriptionStore = useSubscriptionStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      budgetStore.fetchBudgets(authStore.user.id),
      subscriptionStore.fetchSubscriptions(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
});

const accountsMap = computed(() => {
  const map: Record<string, string> = {};
  accountStore.accounts.forEach((acc) => {
    map[acc.id] = acc.name;
  });
  return map;
});

const accountsCurrencyMap = computed(() => {
  const map: Record<string, string> = {};
  accountStore.accounts.forEach((acc) => {
    map[acc.id] = acc.currency || 'USD';
  });
  return map;
});

const categoriesMap = computed(() => {
  const map: Record<string, string> = {};
  categoryStore.categories.forEach((cat) => {
    map[cat.id] = cat.name;
  });
  return map;
});

// Patrimony Converted
const totalPatrimonyConverted = computed(() => {
  return accountStore.accounts.reduce((sum, acc) => {
    return sum + rateStore.convert(acc.balance || 0, acc.currency || 'USD');
  }, 0);
});

const formattedTotalPatrimony = computed(() => {
  return CurrencyFormatter.format(
    totalPatrimonyConverted.value,
    rateStore.baseCurrency,
  );
});

// Income Converted
const totalIncomeConverted = computed(() => {
  return transactionStore.transactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => {
      const curr = accountsCurrencyMap.value[tx.accountId] || 'USD';
      return sum + rateStore.convert(tx.amount, curr);
    }, 0);
});

const formattedTotalIncome = computed(() => {
  return CurrencyFormatter.format(
    totalIncomeConverted.value,
    rateStore.baseCurrency,
  );
});

// Expenses Converted
const totalExpensesConverted = computed(() => {
  return transactionStore.transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => {
      const curr = accountsCurrencyMap.value[tx.accountId] || 'USD';
      return sum + rateStore.convert(tx.amount, curr);
    }, 0);
});

const formattedTotalExpenses = computed(() => {
  return CurrencyFormatter.format(
    totalExpensesConverted.value,
    rateStore.baseCurrency,
  );
});

// Analytics Breakdown & Cashflow
const categoryBreakdown = computed(() => {
  return AnalyticsService.calculateCategoryExpenses({
    transactions: transactionStore.transactions,
    categories: categoryStore.categories,
    accountsCurrencyMap: accountsCurrencyMap.value,
    convertFn: (amount, from, to) => rateStore.convert(amount, from, to),
    targetCurrency: rateStore.baseCurrency,
    formatFn: (amount, curr) => CurrencyFormatter.format(amount, curr),
  });
});

const cashflowMetrics = computed(() => {
  return AnalyticsService.calculateCashflowMetrics(
    totalIncomeConverted.value,
    totalExpensesConverted.value,
  );
});

// Subscriptions approaching due date (within 7 days or overdue)
const urgentSubscriptions = computed(() => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return subscriptionStore.subscriptions.slice(0, 3);
});

// Recent 5 transactions
const recentTransactions = computed(() => {
  return transactionStore.transactions.slice(0, 5);
});

const isCreateTxModalOpen = ref(false);
const editingTransaction = ref<any>(null);

function openCreateTx() {
  editingTransaction.value = null;
  isCreateTxModalOpen.value = true;
}

function handleEditTx(tx: any) {
  editingTransaction.value = tx;
  isCreateTxModalOpen.value = true;
}

async function handleCreateTx(payload: {
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
  await accountStore.fetchAccounts(authStore.user.id);
}

async function handleUpdateTx(
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

async function handleDeleteTx(id: string) {
  await transactionStore.deleteTransaction(id);
  if (authStore.user?.id) {
    await accountStore.fetchAccounts(authStore.user.id);
  }
}

const categoriesDetailsMap = computed(() => {
  const map: Record<string, { name: string; icon?: string; color?: string }> = {};
  categoryStore.categories.forEach((cat) => {
    map[cat.id] = {
      name: cat.name,
      icon: cat.icon || undefined,
      color: cat.color || undefined,
    };
  });
  return map;
});

// Urgent subscription reminders
const urgentReminders = computed(() => {
  return ReminderService.getUrgentReminders({
    subscriptions: subscriptionStore.subscriptions,
    accountsMap: accountsMap.value,
    categoriesMap: categoriesDetailsMap.value,
    formatFn: (amt, curr) => CurrencyFormatter.format(amt, curr),
    thresholdDays: 3,
  });
});

async function handlePaySubscription(subscriptionId: string) {
  await subscriptionStore.paySubscription(subscriptionId);
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
}
</script>

<template>
  <AppLayout
    title="Resumen Ejecutivo"
    :subtitle="`Bienvenido, ${authStore.user?.name || 'Usuario'}. Panorama general de tu salud financiera.`"
  >
    <div class="space-y-6">
      <!-- Urgent Reminders Banner -->
      <UrgentRemindersBanner
        :reminders="urgentReminders"
        @pay="handlePaySubscription"
      />

      <!-- Top Metrics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Total Patrimony -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#4D7EA8]"
            >
              Patrimonio Total ({{ rateStore.baseCurrency }})
            </span>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-sky-300"
            >
              <UIcon name="i-heroicons-banknotes" class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3
              class="text-3xl font-black text-slate-900 dark:text-[#FAF7F2] tracking-tight"
            >
              {{ formattedTotalPatrimony }}
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {{ accountStore.accounts.length }} cuentas activas
            </p>
          </div>
        </div>

        <!-- Income of the Month -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#4D7EA8]"
            >
              Ingresos del Mes ({{ rateStore.baseCurrency }})
            </span>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <UIcon name="i-heroicons-arrow-trending-up" class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3
              class="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight"
            >
              {{ formattedTotalIncome }}
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Entradas registradas este mes
            </p>
          </div>
        </div>

        <!-- Expenses of the Month -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#4D7EA8]"
            >
              Gastos del Mes ({{ rateStore.baseCurrency }})
            </span>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400"
            >
              <UIcon name="i-heroicons-arrow-trending-down" class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3
              class="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight"
            >
              {{ formattedTotalExpenses }}
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Salidas y cobros recurrentes
            </p>
          </div>
        </div>
      </div>

      <!-- Analytics Charts Section -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7">
          <CategoryDonutChart
            :breakdown="categoryBreakdown"
            :base-currency="rateStore.baseCurrency"
          />
        </div>
        <div class="lg:col-span-5">
          <CashflowSummaryCard
            :metrics="cashflowMetrics"
            :base-currency="rateStore.baseCurrency"
          />
        </div>
      </section>

      <!-- Executive Overview Widgets (Cuentas, Presupuestos, Suscripciones) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Top Accounts Widget -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <h3
                class="font-bold text-base text-slate-900 dark:text-[#f1f5f9]"
              >
                Mis Cuentas
              </h3>
              <RouterLink
                to="/cuentas"
                class="text-xs font-semibold text-[#1B3E9B] dark:text-sky-400 hover:underline"
              >
                Ver todas →
              </RouterLink>
            </div>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="acc in accountStore.accounts.slice(0, 3)"
                :key="acc.id"
                class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-100 dark:border-[#283a59]/60 text-xs"
              >
                <span class="font-bold text-slate-800 dark:text-slate-200">
                  {{ acc.name }}
                </span>
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ CurrencyFormatter.format(acc.balance, acc.currency) }}
                </span>
              </div>
              <p
                v-if="accountStore.accounts.length === 0"
                class="text-xs text-slate-500 dark:text-slate-400 text-center py-4"
              >
                No tienes cuentas registradas aún.
              </p>
            </div>
          </div>
        </div>

        <!-- Budgets Status Widget -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <h3
                class="font-bold text-base text-slate-900 dark:text-[#f1f5f9]"
              >
                Presupuestos
              </h3>
              <RouterLink
                to="/presupuestos"
                class="text-xs font-semibold text-[#1B3E9B] dark:text-sky-400 hover:underline"
              >
                Gestionar →
              </RouterLink>
            </div>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="b in budgetStore.budgets.slice(0, 3)"
                :key="b.id"
                class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-100 dark:border-[#283a59]/60 text-xs flex items-center justify-between"
              >
                <span class="font-bold text-slate-800 dark:text-slate-200">
                  {{ categoriesMap[b.categoryId] || 'Categoría' }}
                </span>
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ CurrencyFormatter.format(b.amount, b.currency) }}
                </span>
              </div>
              <p
                v-if="budgetStore.budgets.length === 0"
                class="text-xs text-slate-500 dark:text-slate-400 text-center py-4"
              >
                No tienes presupuestos activos.
              </p>
            </div>
          </div>
        </div>

        <!-- Upcoming Subscriptions Widget -->
        <div
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <h3
                class="font-bold text-base text-slate-900 dark:text-[#f1f5f9]"
              >
                Suscripciones
              </h3>
              <RouterLink
                to="/suscripciones"
                class="text-xs font-semibold text-[#1B3E9B] dark:text-sky-400 hover:underline"
              >
                Ver calendario →
              </RouterLink>
            </div>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="s in urgentSubscriptions"
                :key="s.id"
                class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-100 dark:border-[#283a59]/60 text-xs"
              >
                <span class="font-bold text-slate-800 dark:text-slate-200">
                  {{ s.name }}
                </span>
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ CurrencyFormatter.format(s.amount, s.currency) }}
                </span>
              </div>
              <p
                v-if="urgentSubscriptions.length === 0"
                class="text-xs text-slate-500 dark:text-slate-400 text-center py-4"
              >
                No tienes suscripciones registradas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Section -->
      <div
        class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-black text-lg text-slate-900 dark:text-[#f1f5f9]">
              Últimos Movimientos
            </h3>
            <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
              Tus actividades y gastos más recientes.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UButton
              color="primary"
              size="xs"
              icon="i-heroicons-plus"
              @click="openCreateTx"
            >
              Nuevo Movimiento
            </UButton>
            <RouterLink
              to="/movimientos"
              class="text-xs font-bold text-[#1B3E9B] dark:text-sky-400 hover:underline"
            >
              Ver todos ({{ transactionStore.transactions.length }}) →
            </RouterLink>
          </div>
        </div>

        <div
          v-if="recentTransactions.length === 0"
          class="text-center py-8 text-xs text-slate-500"
        >
          No hay movimientos registrados.
        </div>
        <div v-else class="space-y-2.5">
          <TransactionItem
            v-for="tx in recentTransactions"
            :key="tx.id"
            :transaction="tx"
            :account-name="accountsMap[tx.accountId]"
            :account-currency="accountsCurrencyMap[tx.accountId]"
            :destination-account-name="
              tx.destinationAccountId
                ? accountsMap[tx.destinationAccountId]
                : undefined
            "
            :destination-account-currency="
              tx.destinationAccountId
                ? accountsCurrencyMap[tx.destinationAccountId]
                : undefined
            "
            :category-name="
              tx.categoryId ? categoriesMap[tx.categoryId] : undefined
            "
            @edit="handleEditTx"
            @delete="handleDeleteTx"
          />
        </div>
      </div>
    </div>

    <!-- Create/Edit Transaction Modal -->
    <CreateTransactionModal
      v-model:open="isCreateTxModalOpen"
      :transaction="editingTransaction"
      :accounts="accountStore.accounts"
      :categories="categoryStore.categories"
      @created="handleCreateTx"
      @updated="handleUpdateTx"
    />
  </AppLayout>
</template>
