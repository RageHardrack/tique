<script setup lang="ts">
import { computed, ref } from 'vue';

import type { CategoryExpenseBreakdown } from '../../../core/services/AnalyticsService';

interface Props {
  breakdown: CategoryExpenseBreakdown[];
  baseCurrency: string;
}

const props = defineProps<Props>();

const hoveredIndex = ref<number | null>(null);

// SVG Donut calculations (radius = 70, circumference = 2 * PI * 70 = 439.82)
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const chartSegments = computed(() => {
  let accumulatedPercent = 0;

  return props.breakdown.map((item, index) => {
    const strokeDasharray = `${(item.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    const strokeDashoffset = -(accumulatedPercent / 100) * CIRCUMFERENCE;
    accumulatedPercent += item.percentage;

    return {
      ...item,
      index,
      strokeDasharray,
      strokeDashoffset,
    };
  });
});
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between"
  >
    <header
      class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]"
        >
          <UIcon name="i-heroicons-chart-pie" class="h-5 w-5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
            Distribución de Gastos
          </h3>
          <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
            Porcentajes por categoría en {{ baseCurrency }}
          </p>
        </div>
      </div>
    </header>

    <!-- Empty State -->
    <div
      v-if="breakdown.length === 0"
      class="flex flex-col items-center justify-center py-10 text-center space-y-2"
    >
      <UIcon
        name="i-heroicons-chart-pie"
        class="h-10 w-10 text-slate-300 dark:text-slate-600"
      />
      <p class="text-sm font-medium text-slate-500 dark:text-[#94a3b8]">
        No hay gastos registrados para analizar este mes.
      </p>
    </div>

    <!-- Chart & Legend Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <!-- SVG Donut Chart -->
      <div
        class="lg:col-span-5 flex flex-col items-center justify-center relative"
      >
        <svg class="w-48 h-48 -rotate-90 transform" viewBox="0 0 200 200">
          <!-- Background track -->
          <circle
            cx="100"
            cy="100"
            :r="RADIUS"
            fill="transparent"
            class="stroke-slate-100 dark:stroke-[#0f1523]"
            stroke-width="24"
          />

          <!-- Segments -->
          <circle
            v-for="seg in chartSegments"
            :key="seg.categoryId"
            cx="100"
            cy="100"
            :r="RADIUS"
            fill="transparent"
            :stroke="seg.color"
            :stroke-width="hoveredIndex === seg.index ? 28 : 24"
            :stroke-dasharray="seg.strokeDasharray"
            :stroke-dashoffset="seg.strokeDashoffset"
            class="transition-all duration-300 cursor-pointer"
            @mouseenter="hoveredIndex = seg.index"
            @mouseleave="hoveredIndex = null"
          />
        </svg>

        <!-- Center Text -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#4D7EA8]"
          >
            {{
              hoveredIndex !== null
                ? breakdown[hoveredIndex]?.categoryName
                : 'Total Gastos'
            }}
          </span>
          <span
            class="text-lg font-black text-slate-900 dark:text-white tracking-tight"
          >
            {{
              hoveredIndex !== null
                ? `${breakdown[hoveredIndex]?.percentage}%`
                : `${breakdown.length} Cat.`
            }}
          </span>
        </div>
      </div>

      <!-- Categories Breakdown List -->
      <div class="lg:col-span-7 space-y-3">
        <div
          v-for="(item, idx) in breakdown"
          :key="item.categoryId"
          class="p-2.5 rounded-xl border border-transparent transition-all cursor-pointer"
          :class="
            hoveredIndex === idx
              ? 'bg-slate-50 dark:bg-[#1c2940] border-slate-200 dark:border-[#283a59]'
              : 'hover:bg-slate-50/60 dark:hover:bg-[#162032]/60'
          "
          @mouseenter="hoveredIndex = idx"
          @mouseleave="hoveredIndex = null"
        >
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <span class="font-bold text-slate-900 dark:text-[#f1f5f9]">
                {{ item.categoryName }}
              </span>
            </div>
            <div class="flex items-center gap-2 font-medium">
              <span class="text-slate-500 dark:text-[#94a3b8]">
                {{ item.formattedAmount }}
              </span>
              <span
                class="font-bold text-slate-900 dark:text-white min-w-10 text-right"
              >
                {{ item.percentage }}%
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div
            class="w-full bg-slate-100 dark:bg-[#0f1523] h-1.5 rounded-full overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
