<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  FinancialCalendarService,
  type MonthCalendarData,
} from '../../../core/services/FinancialCalendarService';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import type { Subscription } from '../../../core/entities/Subscription';
import type { Loan } from '../../../core/entities/Loan';
import type { Account } from '../../../core/entities/Account';

interface Props {
  subscriptions: Subscription[];
  loans: Loan[];
  accounts: Account[];
  baseCurrency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  baseCurrency: 'USD',
});

const emit = defineEmits<{
  (e: 'paySubscription', subId: string): void;
  (e: 'payLoan', loanId: string): void;
}>();

const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth() + 1); // 1-12
const selectedDay = ref<string | null>(null);

const calendarData = computed<MonthCalendarData>(() => {
  return FinancialCalendarService.generateMonthData({
    year: currentYear.value,
    month: currentMonth.value,
    subscriptions: props.subscriptions,
    loans: props.loans,
    accounts: props.accounts,
    today: currentDate,
  });
});

const selectedDayData = computed(() => {
  if (!selectedDay.value) return null;
  return calendarData.value.days.find((d) => d.date === selectedDay.value) || null;
});

function previousMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  selectedDay.value = null;
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  selectedDay.value = null;
}

function selectDay(dateStr: string) {
  selectedDay.value = selectedDay.value === dateStr ? null : dateStr;
}

function format(amount: number, curr?: string) {
  return CurrencyFormatter.format(amount, curr || props.baseCurrency);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header Controls: Month navigation and executive totals -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <UButton
            icon="i-heroicons-chevron-left"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Mes anterior"
            @click="previousMonth"
          />
          <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white min-w-[160px] text-center">
            {{ calendarData.monthName }} {{ calendarData.year }}
          </h2>
          <UButton
            icon="i-heroicons-chevron-right"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Mes siguiente"
            @click="nextMonth"
          />
        </div>
      </div>

      <!-- Projected Summary -->
      <div class="flex items-center gap-4 text-xs font-semibold">
        <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Compromisos del Mes:</span>
          <span class="font-bold text-slate-900 dark:text-white">{{ format(calendarData.totalProjectedExpenses) }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>{{ calendarData.totalPendingCount }} pendientes</span>
        </div>
      </div>
    </div>

    <!-- Calendar Grid (Days 1 to 31) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
      <div
        v-for="day in calendarData.days"
        :key="day.date"
        class="min-h-[100px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
        :class="[
          selectedDay === day.date
            ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-500/5'
            : day.isToday
              ? 'border-blue-500/60 bg-blue-500/10'
              : 'border-slate-200 dark:border-[#283a59]/60 bg-white dark:bg-[#162032] hover:border-slate-400',
        ]"
        @click="selectDay(day.date)"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-black"
            :class="day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'"
          >
            {{ day.dayNumber }}
          </span>
          <span v-if="day.totalAmountDue > 0" class="text-[10px] font-bold text-rose-500 dark:text-rose-400 truncate">
            {{ format(day.totalAmountDue) }}
          </span>
        </div>

        <!-- Event Pills -->
        <div class="space-y-1 my-1 overflow-hidden">
          <div
            v-for="ev in day.events.slice(0, 2)"
            :key="ev.id"
            class="px-1.5 py-0.5 rounded text-[9px] font-bold truncate flex items-center gap-1"
            :class="[
              ev.type === 'SUBSCRIPTION'
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                : ev.type === 'LOAN_PAYMENT'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  : ev.type === 'CREDIT_CARD_CUTOFF'
                    ? 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
            ]"
            :title="ev.title + (ev.amount ? ' - ' + format(ev.amount, ev.currency) : '')"
          >
            <span class="truncate">{{ ev.title }}</span>
          </div>
          <span v-if="day.events.length > 2" class="text-[9px] font-bold text-slate-400 pl-1">
            +{{ day.events.length - 2 }} más
          </span>
        </div>

        <div class="h-1" />
      </div>
    </div>

    <!-- Selected Day Detail Drawer / Panel -->
    <div
      v-if="selectedDayData && selectedDayData.events.length > 0"
      class="p-4 rounded-2xl bg-white dark:bg-[#162032] border border-primary-500/30 shadow-md space-y-3"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-primary-500" />
          Compromisos para el {{ selectedDayData.date }}
        </h3>
        <span class="text-xs font-bold text-rose-500">
          Total del día: {{ format(selectedDayData.totalAmountDue) }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="event in selectedDayData.events"
          :key="event.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-[#283a59] bg-slate-50 dark:bg-[#0f1523] flex items-center justify-between gap-3"
        >
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase"
                :class="[
                  event.type === 'SUBSCRIPTION'
                    ? 'bg-purple-500/20 text-purple-400'
                    : event.type === 'LOAN_PAYMENT'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400',
                ]"
              >
                {{
                  event.type === 'SUBSCRIPTION'
                    ? 'Suscripción'
                    : event.type === 'LOAN_PAYMENT'
                      ? 'Préstamo/Deuda'
                      : event.type === 'CREDIT_CARD_CUTOFF'
                        ? 'Corte TC'
                        : 'Pago TC'
                }}
              </span>
              <span v-if="event.status === 'OVERDUE'" class="text-[9px] font-bold text-rose-500">
                (Vencido)
              </span>
            </div>
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ event.title }}</p>
            <p v-if="event.subtitle" class="text-[10px] text-slate-400 truncate">{{ event.subtitle }}</p>
            <p v-if="event.amount" class="text-xs font-black text-slate-900 dark:text-white">
              {{ format(event.amount, event.currency) }}
            </p>
          </div>

          <UButton
            v-if="event.type === 'SUBSCRIPTION' && event.isPayable"
            color="primary"
            size="xs"
            variant="solid"
            icon="i-heroicons-check"
            class="shrink-0 font-bold"
            @click="emit('paySubscription', event.sourceId)"
          >
            Pagar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
