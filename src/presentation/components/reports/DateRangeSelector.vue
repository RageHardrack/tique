<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  DateRangeService,
  type TimeWindowPreset,
} from '../../../core/services/DateRangeService';

interface Props {
  modelValue: TimeWindowPreset;
  customStartDate?: string;
  customEndDate?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'MONTHLY',
  customStartDate: '',
  customEndDate: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: TimeWindowPreset): void;
  (e: 'update:customStartDate', value: string): void;
  (e: 'update:customEndDate', value: string): void;
  (e: 'change', range: { preset: TimeWindowPreset; startDate: Date; endDate: Date; label: string }): void;
}>();

const presets: { label: string; value: TimeWindowPreset; icon: string }[] = [
  { label: 'Este Mes', value: 'MONTHLY', icon: 'i-heroicons-calendar-days' },
  { label: 'Bimestral', value: 'BI_MONTHLY', icon: 'i-heroicons-calendar' },
  { label: 'Trimestral', value: 'QUARTERLY', icon: 'i-heroicons-squares-plus' },
  { label: 'Semestral', value: 'SEMI_ANNUAL', icon: 'i-heroicons-chart-bar-square' },
  { label: 'Año Completo', value: 'FULL_YEAR', icon: 'i-heroicons-globe-alt' },
  { label: 'Personalizado', value: 'CUSTOM', icon: 'i-heroicons-adjustments-horizontal' },
];

const internalStart = ref(props.customStartDate || DateRangeService.toInputDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
const internalEnd = ref(props.customEndDate || DateRangeService.toInputDateString(new Date()));

function selectPreset(preset: TimeWindowPreset) {
  emit('update:modelValue', preset);
  notifyChange(preset);
}

function handleCustomDateChange() {
  emit('update:customStartDate', internalStart.value);
  emit('update:customEndDate', internalEnd.value);
  if (props.modelValue === 'CUSTOM') {
    notifyChange('CUSTOM');
  }
}

function notifyChange(preset: TimeWindowPreset) {
  const result = DateRangeService.calculateRange(
    preset,
    internalStart.value,
    internalEnd.value,
  );
  emit('change', {
    preset,
    startDate: result.startDate,
    endDate: result.endDate,
    label: result.label,
  });
}

watch(
  () => [props.modelValue, props.customStartDate, props.customEndDate],
  () => {
    if (props.customStartDate) internalStart.value = props.customStartDate;
    if (props.customEndDate) internalEnd.value = props.customEndDate;
  },
);
</script>

<template>
  <div class="space-y-4">
    <!-- Presets Scroll / Button Grid -->
    <div
      class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
      role="tablist"
      aria-label="Seleccionar periodo de tiempo"
    >
      <UButton
        v-for="p in presets"
        :key="p.value"
        :color="modelValue === p.value ? 'primary' : 'neutral'"
        :variant="modelValue === p.value ? 'solid' : 'outline'"
        :icon="p.icon"
        size="md"
        class="snap-start shrink-0 font-semibold"
        @click="selectPreset(p.value)"
      >
        {{ p.label }}
      </UButton>
    </div>

    <!-- Collapsible Custom Date Range Picker -->
    <div
      v-if="modelValue === 'CUSTOM'"
      class="p-4 rounded-2xl bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm animate-fadeIn"
    >
      <div class="text-xs font-bold text-slate-500 dark:text-[#4D7EA8] uppercase tracking-wider mb-3">
        Seleccionar Rango de Fechas
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="custom-start-date" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Fecha Desde
          </label>
          <UInput
            id="custom-start-date"
            v-model="internalStart"
            type="date"
            class="w-full"
            @change="handleCustomDateChange"
          />
        </div>
        <div>
          <label for="custom-end-date" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Fecha Hasta
          </label>
          <UInput
            id="custom-end-date"
            v-model="internalEnd"
            type="date"
            class="w-full"
            @change="handleCustomDateChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
