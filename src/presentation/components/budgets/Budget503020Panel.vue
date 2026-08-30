<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Category } from '../../../core/entities/Category';
import type { Transaction } from '../../../core/entities/Transaction';
import type { Budget } from '../../../core/entities/Budget';
import { BudgetRule503020Service } from '../../../core/services/BudgetRule503020Service';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  currency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'USD',
});

const emit = defineEmits<{
  (e: 'open-category-modal', category?: Category): void;
}>();

const now = new Date();
const selectedYear = ref(now.getUTCFullYear());
const selectedMonth = ref(now.getUTCMonth() + 1);

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
}

const report = computed(() => {
  return BudgetRule503020Service.calculate({
    transactions: props.transactions,
    categories: props.categories,
    budgets: props.budgets,
    year: selectedYear.value,
    month: selectedMonth.value,
  });
});

const activeTab = ref<'NEEDS' | 'WANTS' | 'SAVINGS'>('NEEDS');

function formatMoney(amount: number) {
  return CurrencyFormatter.format(amount, props.currency);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Month Navigation Header -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
    >
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-emerald-500" />
          Planificación Mensual — Regla 50/30/20
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Distribución recomendada: 50% Gastos Fijos / Necesidades, 30% Estilo de Vida y 20% Ahorro.
        </p>
      </div>

      <!-- Month Controls -->
      <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <UButton
          icon="i-heroicons-chevron-left"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Mes anterior"
          @click="prevMonth"
        />
        <span class="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
          {{ monthNames[selectedMonth - 1] }} {{ selectedYear }}
        </span>
        <UButton
          icon="i-heroicons-chevron-right"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Mes siguiente"
          @click="nextMonth"
        />
      </div>
    </div>

    <!-- Income Baseline Card -->
    <div
      class="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5"
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Ingreso Neto Total del Mes (Base 100%)
          </span>
          <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {{ formatMoney(report.totalIncome) }}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Calculado automáticamente sobre todos los ingresos percibidos en {{ monthNames[selectedMonth - 1] }}.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Total Gastos del Mes</span>
            <div class="text-base font-bold text-rose-500">
              {{ formatMoney(report.totalExpense) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3 Pillars Cards (50 / 30 / 20) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 50% Needs / Gastos Fijos -->
      <div
        class="cursor-pointer rounded-2xl border p-5 transition-all space-y-4"
        :class="
          activeTab === 'NEEDS'
            ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
            : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
        "
        @click="activeTab = 'NEEDS'"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <UIcon name="i-heroicons-home" class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">50% Necesidades</h4>
              <span class="text-[10px] text-slate-500">Gastos Fijos Esenciales</span>
            </div>
          </div>
          <UBadge
            :color="report.needs.status === 'HEALTHY' ? 'success' : report.needs.status === 'WARNING' ? 'warning' : 'error'"
            variant="subtle"
            size="xs"
          >
            {{ report.needs.actualPercentage.toFixed(1) }}%
          </UBadge>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">Gastado / Objetivo</span>
            <span class="font-semibold text-slate-900 dark:text-white">
              {{ formatMoney(report.needs.actualSpent) }} / {{ formatMoney(report.needs.targetAmount) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="
                report.needs.actualPercentage <= 50
                  ? 'bg-blue-500'
                  : report.needs.actualPercentage <= 55
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              "
              :style="{ width: `${Math.min(report.needs.actualPercentage * 2, 100)}%` }"
            />
          </div>

          <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Presupuestado: {{ formatMoney(report.needs.budgetedAmount) }}</span>
            <span>{{ report.needs.categories.length }} categorías</span>
          </div>
        </div>
      </div>

      <!-- 30% Wants / Deseos -->
      <div
        class="cursor-pointer rounded-2xl border p-5 transition-all space-y-4"
        :class="
          activeTab === 'WANTS'
            ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/20'
            : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
        "
        @click="activeTab = 'WANTS'"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">30% Deseos</h4>
              <span class="text-[10px] text-slate-500">Estilo de Vida & Ocio</span>
            </div>
          </div>
          <UBadge
            :color="report.wants.status === 'HEALTHY' ? 'success' : report.wants.status === 'WARNING' ? 'warning' : 'error'"
            variant="subtle"
            size="xs"
          >
            {{ report.wants.actualPercentage.toFixed(1) }}%
          </UBadge>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">Gastado / Objetivo</span>
            <span class="font-semibold text-slate-900 dark:text-white">
              {{ formatMoney(report.wants.actualSpent) }} / {{ formatMoney(report.wants.targetAmount) }}
            </span>
          </div>

          <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="
                report.wants.actualPercentage <= 30
                  ? 'bg-purple-500'
                  : report.wants.actualPercentage <= 35
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              "
              :style="{ width: `${Math.min((report.wants.actualPercentage / 30) * 100, 100)}%` }"
            />
          </div>

          <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Presupuestado: {{ formatMoney(report.wants.budgetedAmount) }}</span>
            <span>{{ report.wants.categories.length }} categorías</span>
          </div>
        </div>
      </div>

      <!-- 20% Savings / Ahorro -->
      <div
        class="cursor-pointer rounded-2xl border p-5 transition-all space-y-4"
        :class="
          activeTab === 'SAVINGS'
            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
            : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
        "
        @click="activeTab = 'SAVINGS'"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">20% Ahorro</h4>
              <span class="text-[10px] text-slate-500">Inversión & Metas</span>
            </div>
          </div>
          <UBadge
            :color="report.savings.actualPercentage >= 20 ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          >
            {{ report.savings.actualPercentage.toFixed(1) }}%
          </UBadge>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">Ahorrado / Objetivo</span>
            <span class="font-semibold text-slate-900 dark:text-white">
              {{ formatMoney(report.savings.actualSpent) }} / {{ formatMoney(report.savings.targetAmount) }}
            </span>
          </div>

          <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all bg-emerald-500"
              :style="{ width: `${Math.min((report.savings.actualPercentage / 20) * 100, 100)}%` }"
            />
          </div>

          <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Presupuestado: {{ formatMoney(report.savings.budgetedAmount) }}</span>
            <span>{{ report.savings.categories.length }} categorías</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown Table for Selected Pillar -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-5 space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UIcon
              :name="activeTab === 'NEEDS' ? 'i-heroicons-home' : activeTab === 'WANTS' ? 'i-heroicons-sparkles' : 'i-heroicons-banknotes'"
              class="w-4 h-4 text-emerald-500"
            />
            Desglose Detallado: {{ activeTab === 'NEEDS' ? 'Gastos Fijos / Necesidades (50%)' : activeTab === 'WANTS' ? 'Deseos y Estilo de Vida (30%)' : 'Ahorro e Inversiones (20%)' }}
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Categorías asignadas a este pilar presupuestario.
          </p>
        </div>
      </div>

      <!-- Categories List -->
      <div v-if="report[activeTab === 'NEEDS' ? 'needs' : activeTab === 'WANTS' ? 'wants' : 'savings'].categories.length > 0" class="space-y-3">
        <div
          v-for="item in report[activeTab === 'NEEDS' ? 'needs' : activeTab === 'WANTS' ? 'wants' : 'savings'].categories"
          :key="item.category.id"
          class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shadow-sm"
              :style="{ backgroundColor: item.category.color || '#3b82f6' }"
            >
              <UIcon :name="item.category.icon || 'i-heroicons-tag'" class="w-5 h-5" />
            </div>
            <div>
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                {{ item.category.name }}
              </span>
              <div class="text-xs text-slate-500">
                Presupuesto asignado: {{ formatMoney(item.budgeted) }}
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm font-bold text-slate-900 dark:text-white">
              {{ formatMoney(item.spent) }}
            </div>
            <span class="text-[11px] font-medium text-slate-500">
              {{ item.percentageOfIncome.toFixed(1) }}% de tus ingresos
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State for Pillar -->
      <div v-else class="text-center py-8 space-y-2">
        <UIcon name="i-heroicons-inbox" class="w-10 h-10 text-slate-400 mx-auto" />
        <p class="text-xs text-slate-500 dark:text-slate-400">
          No tienes categorías clasificadas en este grupo.
        </p>
      </div>
    </div>
  </div>
</template>
