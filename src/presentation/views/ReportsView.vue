<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useExchangeRateStore } from '../store/exchange-rates';
import {
  DateRangeService,
  type TimeWindowPreset,
} from '../../core/services/DateRangeService';
import {
  AnalyticsService,
  type CategoryExpenseBreakdown,
  type PeriodicTrendPoint,
} from '../../core/services/AnalyticsService';
import CategoryDonutChart from '../components/analytics/CategoryDonutChart.vue';
import DateRangeSelector from '../components/reports/DateRangeSelector.vue';
import ReportSummaryCards from '../components/reports/ReportSummaryCards.vue';
import IncomeVsExpenseTrend from '../components/reports/IncomeVsExpenseTrend.vue';
import { CurrencyConverter } from '../../core/services/CurrencyConverter';
import { DateFormatter } from '../../core/services/DateFormatter';

import { CsvExportService } from '../../core/services/CsvExportService';
import { PdfExportService } from '../../core/services/PdfExportService';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();

const activePreset = ref<TimeWindowPreset>('MONTHLY');
const customStart = ref(DateRangeService.toInputDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
const customEnd = ref(DateRangeService.toInputDateString(new Date()));

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      categoryStore.fetchCategories(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
});

const currentRange = computed(() => {
  return DateRangeService.calculateRange(
    activePreset.value,
    customStart.value,
    customEnd.value,
  );
});

// Accounts currency lookup map
const accountsCurrencyMap = computed(() => {
  const map: Record<string, string> = {};
  accountStore.accounts.forEach((acc) => {
    map[acc.id] = acc.currency;
  });
  return map;
});

// Categories lookup map
const categoriesMap = computed(() => {
  const map: Record<string, string> = {};
  categoryStore.categories.forEach((cat) => {
    map[cat.id] = cat.name;
  });
  return map;
});

// Filter transactions by calculated date range
const periodTransactions = computed(() => {
  const { startDate, endDate } = currentRange.value;
  return transactionStore.transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });
});

function convertAmount(
  amount: number,
  from: string,
  to: any,
  exchangeRate?: number | null,
): number {
  return CurrencyConverter.convertTransaction(
    amount,
    from,
    to,
    exchangeRate,
    rateStore.rates,
  );
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || rateStore.baseCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Cashflow metrics calculation for the period
const metrics = computed(() => {
  let income = 0;
  let expenses = 0;

  periodTransactions.value.forEach((tx) => {
    const sourceCurr = accountsCurrencyMap.value[tx.accountId] || 'USD';
    const converted = convertAmount(
      tx.amount,
      sourceCurr,
      rateStore.baseCurrency,
      tx.exchangeRate,
    );

    if (tx.type === 'INCOME') {
      income += converted;
    } else if (tx.type === 'EXPENSE') {
      expenses += converted;
    }
  });

  return AnalyticsService.calculateCashflowMetrics(income, expenses);
});

// Category expense breakdown
const categoryBreakdown = computed<CategoryExpenseBreakdown[]>(() => {
  return AnalyticsService.calculateCategoryExpenses({
    transactions: periodTransactions.value,
    categories: categoryStore.categories,
    accountsCurrencyMap: accountsCurrencyMap.value,
    convertFn: convertAmount,
    targetCurrency: rateStore.baseCurrency,
    formatFn: formatAmount,
  });
});

// Sub-period trends
const periodicTrends = computed<PeriodicTrendPoint[]>(() => {
  return AnalyticsService.calculatePeriodicTrends({
    transactions: periodTransactions.value,
    accountsCurrencyMap: accountsCurrencyMap.value,
    convertFn: convertAmount,
    targetCurrency: rateStore.baseCurrency,
  });
});

function handleExportCsv() {
  const csv = CsvExportService.generateCsv({
    transactions: periodTransactions.value,
    accounts: accountStore.accounts,
    categories: categoryStore.categories,
    baseCurrency: rateStore.baseCurrency,
    convertFn: (amount, fromCurrency, exchangeRate) =>
      convertAmount(amount, fromCurrency, rateStore.baseCurrency, exchangeRate),
  });

  const startSlug = DateRangeService.toInputDateString(currentRange.value.startDate);
  const endSlug = DateRangeService.toInputDateString(currentRange.value.endDate);
  CsvExportService.downloadCsv(csv, `tique_reporte_${startSlug}_a_${endSlug}.csv`);
}

function handleExportPdf() {
  PdfExportService.exportToPdf({
    rangeLabel: currentRange.value.label,
    formattedRange: currentRange.value.formattedRange,
    baseCurrency: rateStore.baseCurrency,
    metrics: metrics.value,
    categoryBreakdown: categoryBreakdown.value,
    transactions: periodTransactions.value,
    accounts: accountStore.accounts,
    categories: categoryStore.categories,
    formatFn: formatAmount,
  });
}
</script>

<template>
  <AppLayout
    title="Reportes Financieros"
    subtitle="Análisis patrimonial periódico, flujo de caja y distribución de gastos por ventanas de tiempo."
  >
    <div class="space-y-6">
      <!-- Period Selector Header with Export Actions -->
      <section class="p-6 rounded-2xl bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-[#283a59]/60">
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-[#1B3E9B] dark:text-[#4D7EA8]" />
              Periodo de Análisis
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rango activo: <span class="font-bold text-[#1B3E9B] dark:text-[#E0DDCF]">{{ currentRange.formattedRange }}</span>
            </p>
          </div>

          <!-- Export Action Buttons -->
          <div class="flex items-center flex-wrap gap-2">
            <div class="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {{ periodTransactions.length }} movimientos
            </div>

            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-table-cells"
              class="font-semibold cursor-pointer min-h-[40px]"
              :disabled="periodTransactions.length === 0"
              @click="handleExportCsv"
            >
              Exportar CSV
            </UButton>

            <UButton
              color="primary"
              icon="i-heroicons-printer"
              class="font-semibold cursor-pointer min-h-[40px]"
              :disabled="periodTransactions.length === 0"
              @click="handleExportPdf"
            >
              Exportar PDF
            </UButton>
          </div>
        </div>

        <DateRangeSelector
          v-model="activePreset"
          v-model:custom-start-date="customStart"
          v-model:custom-end-date="customEnd"
        />
      </section>

      <!-- Executive Metric Cards -->
      <ReportSummaryCards
        :total-income="metrics.totalIncome"
        :total-expenses="metrics.totalExpenses"
        :net-savings="metrics.netSavings"
        :savings-rate="metrics.savingsRate"
        :base-currency="rateStore.baseCurrency"
        :format-fn="formatAmount"
        :transaction-count="periodTransactions.length"
      />

      <!-- Visual Trend & Distribution Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <!-- Periodic Trend Bar Chart -->
        <IncomeVsExpenseTrend
          :trends="periodicTrends"
          :base-currency="rateStore.baseCurrency"
          :format-fn="formatAmount"
          class="h-full"
        />

        <!-- Category Expenses Donut Chart -->
        <CategoryDonutChart
          :breakdown="categoryBreakdown"
          :base-currency="rateStore.baseCurrency"
          class="h-full"
        />
      </div>

      <!-- Transactions List of the Period -->
      <section class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm dark:shadow-lg">
        <header class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-[#4D7EA8]">
              <UIcon name="i-heroicons-list-bullet" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
                Movimientos del Periodo
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
                Listado filtrado entre {{ currentRange.formattedRange }}
              </p>
            </div>
          </div>
        </header>

        <div v-if="periodTransactions.length === 0" class="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
          No existen movimientos registrados dentro de las fechas seleccionadas.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th class="py-3 px-2">Fecha</th>
                <th class="py-3 px-2">Tipo</th>
                <th class="py-3 px-2">Categoría</th>
                <th class="py-3 px-2">Cuenta</th>
                <th class="py-3 px-2">Nota</th>
                <th class="py-3 px-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr
                v-for="tx in periodTransactions"
                :key="tx.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td class="py-3 px-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {{ DateFormatter.format(tx.date, 'DD MMM YYYY') }}
                </td>
                <td class="py-3 px-2 text-xs font-bold">
                  <span
                    :class="[
                      tx.type === 'INCOME'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'EXPENSE'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400',
                    ]"
                  >
                    {{ tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : 'Transferencia' }}
                  </span>
                </td>
                <td class="py-3 px-2 text-xs text-slate-700 dark:text-slate-300">
                  {{ tx.categoryId ? categoriesMap[tx.categoryId] || 'General' : 'General' }}
                </td>
                <td class="py-3 px-2 text-xs text-slate-600 dark:text-slate-400">
                  {{ accountStore.accounts.find((a) => a.id === tx.accountId)?.name || 'Cuenta' }}
                </td>
                <td class="py-3 px-2 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {{ tx.note || '-' }}
                </td>
                <td class="py-3 px-2 text-xs font-black text-right text-slate-900 dark:text-white whitespace-nowrap">
                  {{ formatAmount(tx.amount, accountsCurrencyMap[tx.accountId] || rateStore.baseCurrency) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
