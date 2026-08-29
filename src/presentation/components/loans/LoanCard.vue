<script setup lang="ts">
import { computed } from 'vue';
import type { Loan } from '../../../core/entities/Loan';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import { useExchangeRateStore } from '../../store/exchange-rates';

interface Props {
  loan: Loan;
}

const props = defineProps<Props>();

const rateStore = useExchangeRateStore();

const emit = defineEmits<{
  (e: 'addPayment', loan: Loan): void;
  (e: 'edit', loan: Loan): void;
  (e: 'delete', id: string): void;
}>();

const isLent = computed(() => props.loan.type === 'LENT');

const paidAmount = computed(() => {
  const diff = Number(props.loan.amount) - Number(props.loan.remainingAmount);
  return Math.max(0, Math.round(diff * 100) / 100);
});

const progressPercentage = computed(() => {
  if (props.loan.amount <= 0) return 100;
  return Math.min(100, Math.round((paidAmount.value / props.loan.amount) * 100));
});

const isFullyPaid = computed(() => props.loan.status === 'PAID' || props.loan.remainingAmount <= 0.01);

const isOverdue = computed(() => {
  if (isFullyPaid.value || !props.loan.dueDate) return false;
  const due = new Date(props.loan.dueDate);
  const now = new Date();
  return due < now;
});

function format(amount: number, currency?: string) {
  return CurrencyFormatter.format(amount, currency || 'USD');
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'Sin fecha límite';
  return DateFormatter.format(dateStr, 'DD MMM YYYY');
}
</script>

<template>
  <div
    class="rounded-2xl border bg-white dark:bg-[#162032] p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
    :class="[
      isFullyPaid
        ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
        : isOverdue
          ? 'border-rose-500/40 bg-rose-50/10 dark:bg-rose-950/10'
          : 'border-slate-200 dark:border-[#283a59]',
    ]"
  >
    <!-- Card Header: Tipo, Contacto y Menú de Acciones -->
    <div class="flex items-start justify-between gap-2">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
            :class="[
              isLent
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
            ]"
          >
            {{ isLent ? 'Me Deben' : 'Debo' }}
          </span>

          <span
            v-if="isFullyPaid"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          >
            Liquidado
          </span>
          <span
            v-else-if="isOverdue"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300"
          >
            Vencido
          </span>
        </div>

        <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">
          {{ loan.personName }}
        </h3>
      </div>

      <!-- Action Buttons (Edit / Delete) -->
      <div class="flex items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-pencil-square"
          aria-label="Editar préstamo"
          class="cursor-pointer min-h-[32px]"
          @click="emit('edit', loan)"
        />
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-trash"
          aria-label="Eliminar préstamo"
          class="cursor-pointer min-h-[32px] text-rose-500 hover:text-rose-600"
          @click="emit('delete', loan.id)"
        />
      </div>
    </div>

    <!-- Main Amounts (Saldo Pendiente vs Total) -->
    <div class="my-4 space-y-3">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Saldo Pendiente
        </span>
        <div
          class="text-2xl font-black tracking-tight"
          :class="[
            isFullyPaid
              ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-75'
              : isLent
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
          ]"
        >
          {{ format(loan.remainingAmount, loan.currency) }}
        </div>
        <p
          v-if="loan.currency !== rateStore.baseCurrency && !isFullyPaid"
          class="text-xs font-semibold text-slate-500 dark:text-sky-400 mt-0.5"
        >
          ≈ {{ format(rateStore.convert(loan.remainingAmount, loan.currency), rateStore.baseCurrency) }}
        </p>
      </div>

      <!-- Barra de Progreso de Amortización -->
      <div class="space-y-1">
        <div class="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Abonado: {{ format(paidAmount, loan.currency) }} ({{ progressPercentage }}%)</span>
          <span>Total: {{ format(loan.amount, loan.currency) }}</span>
        </div>
        <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-[#0f1523] overflow-hidden border border-slate-200 dark:border-slate-800">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="[
              isFullyPaid
                ? 'bg-emerald-500'
                : isLent
                  ? 'bg-emerald-500'
                  : 'bg-rose-500',
            ]"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>

      <!-- Fecha de Vencimiento y Notas -->
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
        <div class="flex items-center gap-1">
          <span class="i-heroicons-calendar text-xs" />
          <span>{{ formatDate(loan.dueDate) }}</span>
        </div>
        <span v-if="loan.payments && loan.payments.length > 0" class="text-[11px] font-medium">
          {{ loan.payments.length }} {{ loan.payments.length === 1 ? 'abono' : 'abonos' }}
        </span>
      </div>

      <p v-if="loan.notes" class="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-[#0f1523] p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
        "{{ loan.notes }}"
      </p>
    </div>

    <!-- Card Footer / Primary Action -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800/60">
      <UButton
        v-if="!isFullyPaid"
        color="primary"
        variant="solid"
        size="sm"
        icon="i-heroicons-plus-circle"
        class="w-full justify-center font-bold min-h-[40px] cursor-pointer"
        @click="emit('addPayment', loan)"
      >
        Registrar Abono
      </UButton>
      <div
        v-else
        class="w-full text-center py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5"
      >
        <span class="i-heroicons-check-badge text-base" />
        Préstamo 100% Liquidado
      </div>
    </div>
  </div>
</template>
