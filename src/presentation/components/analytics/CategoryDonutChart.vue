<script setup lang="ts">
import { computed, ref } from 'vue';

import type { CategoryExpenseBreakdown } from '../../../core/services/AnalyticsService';
import { CategoryBreakdownGrouper } from '../../../core/services/CategoryBreakdownGrouper';

interface Props {
  breakdown: CategoryExpenseBreakdown[];
  baseCurrency: string;
}

const props = defineProps<Props>();

const hoveredIndex = ref<number | null>(null);
const viewMode = ref<'top' | 'all'>('top');
const isModalOpen = ref(false);
const searchQuery = ref('');

// Grouping breakdown (Top 5 + Otras categorías)
const groupedBreakdown = computed(() => {
  return CategoryBreakdownGrouper.group(props.breakdown, 5, 'Otras categorías');
});

// Items used for the SVG Donut segments
const activeChartItems = computed(() => {
  if (viewMode.value === 'all') {
    return groupedBreakdown.value.allItems;
  }
  return groupedBreakdown.value.chartItems;
});

// Items shown in the card list
const visibleListItems = computed(() => {
  if (viewMode.value === 'all') {
    return groupedBreakdown.value.allItems;
  }
  return groupedBreakdown.value.topItems;
});

// Filtered items for the full breakdown modal
const filteredModalItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.breakdown;
  return props.breakdown.filter((item) =>
    item.categoryName.toLowerCase().includes(query),
  );
});

// SVG Donut calculations (radius = 70, circumference = 2 * PI * 70 = 439.82)
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const chartSegments = computed(() => {
  let accumulatedPercent = 0;

  return activeChartItems.value.map((item, index) => {
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

function handleItemClick(item: CategoryExpenseBreakdown) {
  if (item.categoryId === 'others-aggregate') {
    isModalOpen.value = true;
  }
}
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between h-full"
  >
    <!-- Header -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60 shrink-0"
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

      <!-- Action Controls when categories exceed 5 -->
      <div v-if="groupedBreakdown.hasMore" class="flex items-center gap-2">
        <div
          class="inline-flex rounded-lg bg-slate-100 dark:bg-[#0f1523] p-0.5 text-xs font-semibold"
        >
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-all min-h-[36px] sm:min-h-0 cursor-pointer"
            :class="
              viewMode === 'top'
                ? 'bg-white dark:bg-[#162032] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-700 dark:hover:text-slate-200'
            "
            @click="viewMode = 'top'"
          >
            Principales
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-all min-h-[36px] sm:min-h-0 cursor-pointer"
            :class="
              viewMode === 'all'
                ? 'bg-white dark:bg-[#162032] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-700 dark:hover:text-slate-200'
            "
            @click="viewMode = 'all'"
          >
            Todas ({{ breakdown.length }})
          </button>
        </div>

        <UButton
          icon="i-heroicons-arrows-pointing-out"
          color="neutral"
          variant="ghost"
          size="sm"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
          aria-label="Ver desglose completo"
          @click="isModalOpen = true"
        />
      </div>
    </header>

    <!-- Empty State -->
    <div
      v-if="breakdown.length === 0"
      class="flex flex-col items-center justify-center py-10 text-center space-y-2 my-auto"
    >
      <UIcon
        name="i-heroicons-chart-pie"
        class="h-10 w-10 text-slate-300 dark:text-slate-600"
      />
      <p class="text-sm font-medium text-slate-500 dark:text-[#94a3b8]">
        No hay gastos registrados para analizar este mes.
      </p>
    </div>

    <!-- Chart & Legend Grid (Fixed bounded layout) -->
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1"
    >
      <!-- SVG Donut Chart -->
      <div
        class="lg:col-span-5 flex flex-col items-center justify-center relative py-2"
      >
        <svg
          class="w-40 h-40 sm:w-48 sm:h-48 -rotate-90 transform shrink-0"
          viewBox="0 0 200 200"
        >
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
            @click="handleItemClick(seg)"
          />
        </svg>

        <!-- Center Text -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#4D7EA8] max-w-[110px] truncate text-center px-1"
          >
            {{
              hoveredIndex !== null
                ? activeChartItems[hoveredIndex]?.categoryName
                : 'Total Gastos'
            }}
          </span>
          <span
            class="text-lg font-black text-slate-900 dark:text-white tracking-tight"
          >
            {{
              hoveredIndex !== null
                ? `${activeChartItems[hoveredIndex]?.percentage}%`
                : `${breakdown.length} Cat.`
            }}
          </span>
        </div>
      </div>

      <!-- Categories Breakdown List (Scroll-contained bounded container) -->
      <div class="lg:col-span-7 flex flex-col justify-center">
        <div
          class="space-y-2.5 max-h-[250px] overflow-y-auto overscroll-contain pr-1.5 scrollbar-thin"
        >
          <!-- Primary categories items -->
          <div
            v-for="(item, idx) in visibleListItems"
            :key="item.categoryId"
            class="p-2.5 rounded-xl border border-transparent transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
            :class="
              hoveredIndex === idx
                ? 'bg-slate-50 dark:bg-[#1c2940] border-slate-200 dark:border-[#283a59]'
                : 'hover:bg-slate-50/60 dark:hover:bg-[#162032]/60'
            "
            @mouseenter="hoveredIndex = idx"
            @mouseleave="hoveredIndex = null"
          >
            <div class="flex items-center justify-between text-xs mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: item.color }"
                />
                <span
                  class="font-bold text-slate-900 dark:text-[#f1f5f9] truncate"
                >
                  {{ item.categoryName }}
                </span>
              </div>
              <div class="flex items-center gap-2 font-medium shrink-0">
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

          <!-- Aggregated "Otras categorías" Row (In Top Mode) -->
          <div
            v-if="viewMode === 'top' && groupedBreakdown.othersItem"
            class="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-[#283a59] bg-slate-50/50 dark:bg-[#162032]/40 hover:bg-slate-100/70 dark:hover:bg-[#1c2940] transition-all cursor-pointer min-h-[44px] flex flex-col justify-center group"
            :class="
              hoveredIndex === 5 ? 'border-slate-300 dark:border-[#4D7EA8]' : ''
            "
            @mouseenter="hoveredIndex = 5"
            @mouseleave="hoveredIndex = null"
            @click="isModalOpen = true"
          >
            <div class="flex items-center justify-between text-xs mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-3 h-3 rounded-full shrink-0 bg-slate-400" />
                <span
                  class="font-bold text-slate-700 dark:text-[#94a3b8] group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate"
                >
                  {{ groupedBreakdown.othersItem.categoryName }}
                </span>
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D4AF37] shrink-0"
                />
              </div>
              <div class="flex items-center gap-2 font-medium shrink-0">
                <span class="text-slate-500 dark:text-[#94a3b8]">
                  {{ groupedBreakdown.othersItem.formattedAmount }}
                </span>
                <span
                  class="font-bold text-slate-900 dark:text-white min-w-10 text-right"
                >
                  {{ groupedBreakdown.othersItem.percentage }}%
                </span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div
              class="w-full bg-slate-100 dark:bg-[#0f1523] h-1.5 rounded-full overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-500 bg-slate-400"
                :style="{
                  width: `${groupedBreakdown.othersItem.percentage}%`,
                }"
              />
            </div>
          </div>
        </div>

        <!-- Hint on "all" mode with scroll -->
        <p
          v-if="viewMode === 'all' && groupedBreakdown.hasMore"
          class="text-[11px] text-center text-slate-400 dark:text-[#4D7EA8] pt-2"
        >
          Desplaza para ver todas las categorías
        </p>
      </div>
    </div>

    <!-- Full Breakdown Modal (Responsive Bottom Sheet / Modal) -->
    <UModal
      :open="isModalOpen"
      :ui="{ content: 'max-w-lg sm:max-w-xl' }"
      @update:open="isModalOpen = $event"
    >
      <template #content>
        <div class="p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#283a59]/60 shrink-0"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]"
              >
                <UIcon name="i-heroicons-chart-pie" class="w-5 h-5" />
              </div>
              <div>
                <h3
                  class="text-base font-black text-slate-900 dark:text-[#f1f5f9]"
                >
                  Desglose de Gastos por Categoría
                </h3>
                <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
                  {{ breakdown.length }} categorías analizadas en
                  {{ baseCurrency }}
                </p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              aria-label="Cerrar modal"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              @click="isModalOpen = false"
            />
          </div>

          <!-- Search Input if > 6 categories -->
          <div v-if="breakdown.length > 6" class="shrink-0">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Buscar categoría..."
              class="w-full"
            />
          </div>

          <!-- Scrollable Category List -->
          <div
            class="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-2.5 min-h-[220px]"
          >
            <div
              v-for="item in filteredModalItems"
              :key="item.categoryId"
              class="p-3 rounded-xl bg-slate-50 dark:bg-[#1c2940]/60 border border-slate-200/70 dark:border-[#283a59]/60"
            >
              <div class="flex items-center justify-between text-xs mb-1.5">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="w-3.5 h-3.5 rounded-full shrink-0"
                    :style="{ backgroundColor: item.color }"
                  />
                  <span
                    class="font-bold text-slate-900 dark:text-[#f1f5f9] text-sm truncate"
                  >
                    {{ item.categoryName }}
                  </span>
                </div>
                <div class="flex items-center gap-2 font-semibold shrink-0">
                  <span class="text-slate-600 dark:text-[#94a3b8]">
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
                class="w-full bg-slate-200 dark:bg-[#0f1523] h-2 rounded-full overflow-hidden"
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

            <!-- Empty search result -->
            <div
              v-if="filteredModalItems.length === 0"
              class="py-8 text-center text-sm text-slate-400 dark:text-[#4D7EA8]"
            >
              No se encontraron categorías coincidentes.
            </div>
          </div>

          <!-- Modal Footer Summary -->
          <div
            class="pt-3 border-t border-slate-100 dark:border-[#283a59]/60 flex items-center justify-between text-xs font-bold shrink-0"
          >
            <span class="text-slate-500 dark:text-[#4D7EA8]">
              Total categorías: {{ breakdown.length }}
            </span>
            <UButton
              color="neutral"
              variant="subtle"
              label="Cerrar"
              class="min-h-[44px] px-4 cursor-pointer"
              @click="isModalOpen = false"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
