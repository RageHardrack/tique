<script setup lang="ts">
import { computed } from 'vue';
import type { PeriodicTrendPoint } from '../../../core/services/AnalyticsService';

interface Props {
  trends: PeriodicTrendPoint[];
  baseCurrency: string;
  formatFn: (amount: number, currency: string) => string;
}

const props = defineProps<Props>();

const maxAmount = computed(() => {
  if (props.trends.length === 0) return 1;
  let max = 0;
  props.trends.forEach((t) => {
    if (t.income > max) max = t.income;
    if (t.expenses > max) max = t.expenses;
  });
  return max > 0 ? max : 1;
});

const singlePoint = computed(() => {
  return props.trends.length === 1 ? props.trends[0] : null;
});

const expenseRatioOfIncome = computed(() => {
  if (!singlePoint.value || singlePoint.value.income <= 0) return 0;
  return Math.min(
    100,
    Math.round((singlePoint.value.expenses / singlePoint.value.income) * 100),
  );
});

const savingsRatio = computed(() => {
  if (!singlePoint.value || singlePoint.value.income <= 0) return 0;
  const ratio =
    ((singlePoint.value.income - singlePoint.value.expenses) /
      singlePoint.value.income) *
    100;
  return Math.round(ratio * 10) / 10;
});
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between"
  >
    <div>
      <header
        class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400"
          >
            <UIcon name="i-heroicons-chart-bar" class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
              Evolución de Ingresos vs Gastos
            </h3>
            <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
              Comparativa por subperiodos en {{ baseCurrency }}
            </p>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-3 text-xs font-semibold">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-slate-600 dark:text-slate-300">Ingresos</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span class="text-slate-600 dark:text-slate-300">Gastos</span>
          </div>
        </div>
      </header>

      <!-- Empty State -->
      <div
        v-if="trends.length === 0"
        class="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-2"
      >
        <UIcon name="i-heroicons-circle-stack" class="w-10 h-10 stroke-1" />
        <p class="text-sm font-medium">
          No hay movimientos suficientes para graficar en este periodo.
        </p>
      </div>

      <!-- Single Period Detailed Comparative Layout (Matches Donut Chart) -->
      <div
        v-else-if="singlePoint"
        class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-2"
      >
        <!-- Visual Vertical Comparative Bars -->
        <div
          class="sm:col-span-5 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1523]/60 p-4 rounded-2xl border border-slate-100 dark:border-[#283a59]/40"
        >
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3"
          >
            {{ singlePoint.periodLabel }}
          </span>

          <div
            class="flex items-end justify-center gap-6 h-36 w-full px-4 pb-2 border-b border-slate-200 dark:border-slate-800"
          >
            <!-- Ingreso Bar -->
            <div
              class="flex flex-col items-center gap-1.5 flex-1 max-w-[56px] h-full justify-end group"
            >
              <span
                class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate opacity-90"
              >
                {{ formatFn(singlePoint.income, baseCurrency) }}
              </span>
              <div
                class="w-full bg-slate-200/60 dark:bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end h-28"
              >
                <div
                  class="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-500 shadow-sm"
                  :style="{
                    height: `${Math.max(8, (singlePoint.income / maxAmount) * 100)}%`,
                  }"
                />
              </div>
              <span
                class="text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >Ingreso</span
              >
            </div>

            <!-- Gasto Bar -->
            <div
              class="flex flex-col items-center gap-1.5 flex-1 max-w-[56px] h-full justify-end group"
            >
              <span
                class="text-[10px] font-black text-rose-600 dark:text-rose-400 truncate opacity-90"
              >
                {{ formatFn(singlePoint.expenses, baseCurrency) }}
              </span>
              <div
                class="w-full bg-slate-200/60 dark:bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end h-28"
              >
                <div
                  class="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all duration-500 shadow-sm"
                  :style="{
                    height: `${Math.max(8, (singlePoint.expenses / maxAmount) * 100)}%`,
                  }"
                />
              </div>
              <span
                class="text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >Gasto</span
              >
            </div>
          </div>

          <!-- Bottom Net Tag -->
          <div class="mt-3 w-full text-center">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-tight"
              :class="[
                singlePoint.net >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              ]"
            >
              <UIcon
                :name="
                  singlePoint.net >= 0
                    ? 'i-heroicons-arrow-trending-up'
                    : 'i-heroicons-arrow-trending-down'
                "
                class="w-3.5 h-3.5"
              />
              Neto: {{ formatFn(singlePoint.net, baseCurrency) }}
            </span>
          </div>
        </div>

        <!-- Metric Details & Impact Bars (Right column) -->
        <div class="sm:col-span-7 space-y-3">
          <!-- Income Card -->
          <div
            class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523]/80 border border-slate-200/70 dark:border-[#283a59]/60 space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs">
              <span
                class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ingresos Totales
              </span>
              <span
                class="font-black text-emerald-600 dark:text-emerald-400 text-sm"
              >
                {{ formatFn(singlePoint.income, baseCurrency) }}
              </span>
            </div>
            <div
              class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden"
            >
              <div
                class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${Math.min(100, (singlePoint.income / maxAmount) * 100)}%`,
                }"
              />
            </div>
          </div>

          <!-- Expense Card -->
          <div
            class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523]/80 border border-slate-200/70 dark:border-[#283a59]/60 space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs">
              <span
                class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                Gastos del Periodo
              </span>
              <span
                class="font-black text-rose-600 dark:text-rose-400 text-sm"
              >
                {{ formatFn(singlePoint.expenses, baseCurrency) }}
              </span>
            </div>
            <div
              class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden"
            >
              <div
                class="bg-rose-500 h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${Math.min(100, (singlePoint.expenses / maxAmount) * 100)}%`,
                }"
              />
            </div>
            <div
              class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5"
            >
              <span>Impacto sobre ingresos</span>
              <span class="font-bold text-slate-700 dark:text-slate-300"
                >{{ expenseRatioOfIncome }}%</span
              >
            </div>
          </div>

          <!-- Savings Summary Card -->
          <div
            class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs"
          >
            <div>
              <span class="font-bold text-blue-900 dark:text-blue-300 block">
                Tasa de Retención / Ahorro
              </span>
              <span class="text-[11px] text-blue-700/80 dark:text-blue-400">
                {{
                  savingsRatio >= 0
                    ? `${savingsRatio}% guardado del total generado`
                    : 'Déficit operativo en este periodo'
                }}
              </span>
            </div>
            <UBadge
              :color="savingsRatio >= 0 ? 'primary' : 'error'"
              variant="subtle"
              size="sm"
              class="font-black font-mono text-xs"
            >
              {{ savingsRatio }}%
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Multi-Period Grid (When looking at Quarterly, Annual or custom multi-month) -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-1"
      >
        <div
          v-for="point in trends"
          :key="point.periodKey"
          class="p-4 rounded-xl bg-slate-50 dark:bg-[#0f1523]/80 border border-slate-200/80 dark:border-[#283a59]/60 flex flex-col justify-between space-y-3"
        >
          <div
            class="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2"
          >
            <span
              class="text-xs font-bold uppercase text-slate-700 dark:text-slate-300"
            >
              {{ point.periodLabel }}
            </span>
            <span
              class="text-xs font-bold px-2 py-0.5 rounded-full"
              :class="[
                point.net >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              ]"
            >
              Neto: {{ formatFn(point.net, baseCurrency) }}
            </span>
          </div>

          <!-- Bar Comparison -->
          <div class="space-y-2 text-xs">
            <div>
              <div
                class="flex justify-between text-slate-600 dark:text-slate-400 mb-1"
              >
                <span>Ingreso</span>
                <span class="font-bold text-slate-900 dark:text-white">{{
                  formatFn(point.income, baseCurrency)
                }}</span>
              </div>
              <div
                class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden"
              >
                <div
                  class="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  :style="{
                    width: `${Math.min(100, (point.income / maxAmount) * 100)}%`,
                  }"
                ></div>
              </div>
            </div>

            <div>
              <div
                class="flex justify-between text-slate-600 dark:text-slate-400 mb-1"
              >
                <span>Gasto</span>
                <span class="font-bold text-slate-900 dark:text-white">{{
                  formatFn(point.expenses, baseCurrency)
                }}</span>
              </div>
              <div
                class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden"
              >
                <div
                  class="bg-rose-500 h-full rounded-full transition-all duration-300"
                  :style="{
                    width: `${Math.min(100, (point.expenses / maxAmount) * 100)}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
