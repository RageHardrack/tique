<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  baseCurrency: string;
  formatFn: (amount: number, currency: string) => string;
  transactionCount: number;
}

const props = defineProps<Props>();

const isPositiveSavings = computed(() => props.netSavings >= 0);
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Income -->
    <div
      class="rounded-2xl p-5 bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col justify-between"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ingresos Totales
        </span>
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-4">
        <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ formatFn(totalIncome, baseCurrency) }}
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          Entradas registradas
        </div>
      </div>
    </div>

    <!-- Total Expenses -->
    <div
      class="rounded-2xl p-5 bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col justify-between"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gastos Totales
        </span>
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
          <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-4">
        <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ formatFn(totalExpenses, baseCurrency) }}
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
          Salidas y consumos
        </div>
      </div>
    </div>

    <!-- Net Cashflow / Savings -->
    <div
      class="rounded-2xl p-5 bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col justify-between"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Balance Neto
        </span>
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl"
          :class="[
            isPositiveSavings
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          ]"
        >
          <UIcon
            :name="isPositiveSavings ? 'i-heroicons-scale' : 'i-heroicons-exclamation-triangle'"
            class="w-5 h-5"
          />
        </div>
      </div>
      <div class="mt-4">
        <div
          class="text-2xl font-black tracking-tight"
          :class="[
            isPositiveSavings
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-amber-600 dark:text-amber-400',
          ]"
        >
          {{ formatFn(netSavings, baseCurrency) }}
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ isPositiveSavings ? 'Superávit en el periodo' : 'Déficit en el periodo' }}
        </div>
      </div>
    </div>

    <!-- Savings Rate -->
    <div
      class="rounded-2xl p-5 bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col justify-between"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tasa de Ahorro
        </span>
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-4">
        <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ savingsRate }}%
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          De los ingresos generados
        </div>
      </div>
    </div>
  </div>
</template>
