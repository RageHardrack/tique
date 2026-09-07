<script setup lang="ts">
import { computed } from 'vue';
import type { SavingsGoal } from '../../../core/entities/Goal';

interface Props {
  goal: SavingsGoal;
  baseCurrency: string;
  formatFn: (amount: number, currency: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'deposit', goal: SavingsGoal): void;
  (e: 'withdraw', goal: SavingsGoal): void;
  (e: 'edit', goal: SavingsGoal): void;
  (e: 'delete', goalId: string): void;
}>();

const progressPercentage = computed(() => {
  if (props.goal.targetAmount <= 0) return 100;
  return Math.min(100, Math.round((props.goal.currentAmount / props.goal.targetAmount) * 1000) / 10);
});

const remainingAmount = computed(() => {
  return Math.max(0, props.goal.targetAmount - props.goal.currentAmount);
});

const isReached = computed(() => props.goal.currentAmount >= props.goal.targetAmount);

const daysRemaining = computed(() => {
  if (!props.goal.targetDate) return null;
  const target = new Date(props.goal.targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const priorityConfig = computed(() => {
  const p = props.goal.priority || 'MEDIUM';
  switch (p) {
    case 'HIGH':
      return {
        label: 'Alta',
        classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50',
        dot: 'bg-rose-500',
      };
    case 'LOW':
      return {
        label: 'Baja',
        classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'MEDIUM':
    default:
      return {
        label: 'Media',
        classes: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
        dot: 'bg-blue-500',
      };
  }
});
</script>

<template>
  <div
    class="rounded-2xl p-6 bg-white dark:bg-[#162032]/95 border border-slate-200 dark:border-[#283a59] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm text-white"
          :style="{ backgroundColor: goal.color || '#3b82f6' }"
        >
          <UIcon :name="goal.icon || 'i-heroicons-shield-check'" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9] leading-snug">
            {{ goal.name }}
          </h3>
          <div class="text-xs text-slate-500 dark:text-[#4D7EA8] flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
              :class="priorityConfig.classes"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="priorityConfig.dot" />
              {{ priorityConfig.label }}
            </span>
            <span v-if="daysRemaining !== null">
              <span v-if="daysRemaining > 0">{{ daysRemaining }} días restantes</span>
              <span v-else-if="daysRemaining === 0" class="text-amber-500 font-semibold">Vence hoy</span>
              <span v-else class="text-rose-500 font-semibold">Vencida</span>
            </span>
            <span v-else>Sin fecha límite</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-pencil-square"
          aria-label="Editar meta"
          class="cursor-pointer min-h-[36px] min-w-[36px]"
          @click="emit('edit', goal)"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-trash"
          aria-label="Eliminar meta"
          class="cursor-pointer min-h-[36px] min-w-[36px] hover:text-red-500"
          @click="emit('delete', goal.id)"
        />
      </div>
    </div>

    <!-- Amounts and Progress Bar -->
    <div class="space-y-2">
      <div class="flex items-baseline justify-between">
        <div>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Ahorrado</span>
          <div class="text-xl font-black text-slate-900 dark:text-white">
            {{ formatFn(goal.currentAmount, goal.currency) }}
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Objetivo</span>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">
            {{ formatFn(goal.targetAmount, goal.currency) }}
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="[
            isReached
              ? 'bg-emerald-500'
              : progressPercentage >= 70
                ? 'bg-blue-500'
                : 'bg-[#D4AF37]',
          ]"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-xs font-semibold">
        <span
          :class="[
            isReached ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400',
          ]"
        >
          {{ isReached ? '¡Meta alcanzada!' : `Faltan ${formatFn(remainingAmount, goal.currency)}` }}
        </span>
        <span class="text-slate-700 dark:text-slate-300 font-bold">{{ progressPercentage }}%</span>
      </div>
    </div>

    <!-- Quick Operations (Abonar / Retirar) -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
      <UButton
        color="primary"
        variant="subtle"
        icon="i-heroicons-plus-circle"
        class="justify-center min-h-[40px] font-semibold"
        @click="emit('deposit', goal)"
      >
        Abonar
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-heroicons-minus-circle"
        class="justify-center min-h-[40px] font-semibold"
        :disabled="goal.currentAmount <= 0"
        @click="emit('withdraw', goal)"
      >
        Retirar
      </UButton>
    </div>
  </div>
</template>
