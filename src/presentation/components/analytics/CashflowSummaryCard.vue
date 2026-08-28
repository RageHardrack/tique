<script setup lang="ts">
import { computed } from 'vue';

import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import type { CashflowMetrics } from '../../../core/services/AnalyticsService';

interface Props {
  metrics: CashflowMetrics;
  baseCurrency: string;
}

const props = defineProps<Props>();

const formattedNetSavings = computed(() => {
  return CurrencyFormatter.format(props.metrics.netSavings, props.baseCurrency);
});

const incomeRatio = computed(() => {
  const total = props.metrics.totalIncome + props.metrics.totalExpenses;
  if (total === 0) return 50;
  return Math.round((props.metrics.totalIncome / total) * 100);
});

const healthAdvice = computed(() => {
  if (props.metrics.totalIncome === 0 && props.metrics.totalExpenses === 0) {
    return 'Registra movimientos para calcular tu balance.';
  }
  if (!props.metrics.isPositive) {
    return 'Tus gastos superan tus ingresos este mes. Evalúa reducir compras no esenciales.';
  }
  if (props.metrics.savingsRate >= 30) {
    return '¡Excelente! Estás ahorrando más del 30% de tus ingresos.';
  }
  if (props.metrics.savingsRate >= 15) {
    return 'Buen ritmo de ahorro. Mantén el control de tus presupuestos.';
  }
  return 'Ahorro positivo. Busca recortar pequeños gastos para mejorar tu margen.';
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
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-sky-400"
          >
            <UIcon name="i-heroicons-scale" class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
              Flujo de Caja Neto
            </h3>
            <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
              Ingresos vs. Gastos en {{ baseCurrency }}
            </p>
          </div>
        </div>

        <UBadge
          :color="metrics.isPositive ? 'success' : 'error'"
          variant="subtle"
          size="sm"
          class="font-bold"
        >
          {{
            metrics.savingsRate > 0
              ? `+${metrics.savingsRate}%`
              : `${metrics.savingsRate}%`
          }}
          Ahorro
        </UBadge>
      </header>

      <!-- Main Balance Figure -->
      <div class="space-y-1">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#4D7EA8]"
        >
          Capacidad de Ahorro del Mes
        </span>
        <p
          class="text-3xl font-black tracking-tight"
          :class="
            metrics.isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          "
        >
          {{ formattedNetSavings }}
        </p>
      </div>

      <!-- Ratio Visual Bar -->
      <div class="mt-5 space-y-2">
        <div class="flex items-center justify-between text-xs font-semibold">
          <span class="text-emerald-600 dark:text-emerald-400">
            Ingresos ({{ incomeRatio }}%)
          </span>
          <span class="text-rose-600 dark:text-rose-400">
            Gastos ({{ 100 - incomeRatio }}%)
          </span>
        </div>

        <div
          class="w-full bg-rose-500/20 h-2.5 rounded-full overflow-hidden flex"
        >
          <div
            class="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
            :style="{ width: `${incomeRatio}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Recommendation Footer -->
    <div
      class="mt-6 pt-3 border-t border-slate-100 dark:border-[#283a59]/60 flex items-start gap-2 text-xs text-slate-600 dark:text-[#94a3b8]"
    >
      <UIcon
        :name="
          metrics.isPositive
            ? 'i-heroicons-check-circle'
            : 'i-heroicons-exclamation-triangle'
        "
        class="h-4 w-4 shrink-0 mt-0.5"
        :class="metrics.isPositive ? 'text-emerald-500' : 'text-rose-500'"
      />
      <span>{{ healthAdvice }}</span>
    </div>
  </div>
</template>
