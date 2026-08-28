<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { SubscriptionReminder } from '../../../core/services/ReminderService';

interface Props {
  reminders: SubscriptionReminder[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'pay', subscriptionId: string): void;
}>();

const overdueCount = computed(
  () => props.reminders.filter((r) => r.urgency === 'OVERDUE').length,
);
const dueTodayCount = computed(
  () => props.reminders.filter((r) => r.urgency === 'DUE_TODAY').length,
);
</script>

<template>
  <div
    v-if="reminders.length > 0"
    class="rounded-3xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-5 shadow-sm space-y-4"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400"
        >
          <UIcon name="i-heroicons-bell-alert" class="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Recordatorios de Pagos Próximos
            <span
              v-if="overdueCount > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
            >
              {{ overdueCount }} vencido{{ overdueCount > 1 ? 's' : '' }}
            </span>
            <span
              v-else-if="dueTodayCount > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            >
              {{ dueTodayCount }} hoy
            </span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tienes pagos automáticos o suscripciones programadas para los próximos días.
          </p>
        </div>
      </div>

      <RouterLink
        to="/suscripciones"
        class="text-xs font-bold text-[#1B3E9B] dark:text-sky-400 hover:underline hidden sm:inline-flex items-center gap-1"
      >
        Gestionar Suscripciones →
      </RouterLink>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="r in reminders"
        :key="r.subscription.id"
        class="p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white dark:bg-[#162032]"
        :class="[
          r.urgency === 'OVERDUE'
            ? 'border-rose-500/40 dark:border-rose-900/60 shadow-sm'
            : r.urgency === 'DUE_TODAY'
              ? 'border-amber-500/40 dark:border-amber-900/60 shadow-sm'
              : 'border-slate-200 dark:border-[#283a59]',
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold"
              :style="{ backgroundColor: r.categoryColor || '#3B82F6' }"
            >
              <UIcon :name="r.categoryIcon || 'i-heroicons-arrow-path'" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                {{ r.subscription.name }}
              </h4>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                {{ r.accountName }}
              </p>
            </div>
          </div>

          <span
            class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
            :class="[
              r.urgency === 'OVERDUE'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : r.urgency === 'DUE_TODAY'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black animate-pulse'
                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
            ]"
          >
            {{ r.urgencyBadgeText }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Monto</span>
            <div class="text-sm font-black text-slate-900 dark:text-white">
              {{ r.formattedAmount }}
            </div>
          </div>

          <UButton
            color="primary"
            size="xs"
            icon="i-heroicons-check-circle"
            class="font-bold"
            @click="emit('pay', r.subscription.id)"
          >
            Registrar Pago
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
