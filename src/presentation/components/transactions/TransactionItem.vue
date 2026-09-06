<script setup lang="ts">
import { computed } from 'vue';

import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import type {
  Transaction,
  TransactionType,
} from '../../../core/entities/Transaction';

interface Props {
  transaction: Transaction;
  accountName?: string;
  accountCurrency?: string;
  categoryName?: string;
  destinationAccountName?: string;
  destinationAccountCurrency?: string;
  canDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: true,
});

const emit = defineEmits<{
  (e: 'edit', transaction: Transaction): void;
  (e: 'delete', id: string): void;
}>();

const typeConfig: Record<
  TransactionType,
  {
    label: string;
    badgeColor: 'success' | 'error' | 'info';
    amountClass: string;
    prefix: string;
    icon: string;
  }
> = {
  INCOME: {
    label: 'Ingreso',
    badgeColor: 'success',
    amountClass: 'text-emerald-400',
    prefix: '+',
    icon: 'i-heroicons-arrow-up-right',
  },
  EXPENSE: {
    label: 'Gasto',
    badgeColor: 'error',
    amountClass: 'text-rose-400',
    prefix: '-',
    icon: 'i-heroicons-arrow-down-left',
  },
  TRANSFER: {
    label: 'Transferencia',
    badgeColor: 'info',
    amountClass: 'text-sky-400',
    prefix: '↔',
    icon: 'i-heroicons-arrows-right-left',
  },
};

const currentConfig = computed(() => {
  return typeConfig[props.transaction.type] || typeConfig.EXPENSE;
});

const isCrossCurrencyTransfer = computed(() => {
  return (
    props.transaction.type === 'TRANSFER' &&
    props.transaction.destinationAmount !== undefined &&
    props.transaction.destinationAmount !== null &&
    (props.transaction.destinationAmount !== props.transaction.amount ||
      (props.accountCurrency &&
        props.destinationAccountCurrency &&
        props.accountCurrency !== props.destinationAccountCurrency))
  );
});

const formattedAmount = computed(() => {
  const formatted = CurrencyFormatter.format(
    props.transaction.amount,
    props.accountCurrency || 'USD',
  );

  return `${currentConfig.value.prefix} ${formatted}`;
});

const formattedDestinationAmount = computed(() => {
  if (!props.transaction.destinationAmount) return '';
  return CurrencyFormatter.format(
    props.transaction.destinationAmount,
    props.destinationAccountCurrency || 'USD',
  );
});

const formattedDate = computed(() => {
  if (!props.transaction.date) return '';
  return DateFormatter.format(props.transaction.date, 'DD MMM YYYY');
});

function handleDelete() {
  emit('delete', props.transaction.id);
}
</script>

<template>
  <article
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-[#283a59]/80 bg-white dark:bg-[#162032]/80 p-4 transition-all hover:bg-slate-50/70 dark:hover:bg-[#1a263c] hover:border-[#4D7EA8]/50 shadow-sm"
  >
    <div class="flex items-start sm:items-center gap-3.5">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#0f1523] text-slate-700 dark:text-slate-300"
      >
        <UIcon
          :name="currentConfig.icon"
          class="h-5 w-5"
          :class="currentConfig.amountClass"
        />
      </div>

      <div class="space-y-0.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
            {{ transaction.note || categoryName || currentConfig.label }}
          </span>
          <UBadge :color="currentConfig.badgeColor" variant="subtle" size="xs">
            {{ currentConfig.label }}
          </UBadge>
          <span
            v-if="categoryName && transaction.note"
            class="text-xs text-slate-600 dark:text-[#94a3b8] bg-slate-100 dark:bg-[#0f1523] px-2 py-0.5 rounded border border-slate-200 dark:border-[#283a59]"
          >
            {{ categoryName }}
          </span>
        </div>

        <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
          <span>{{ formattedDate }}</span>
          <span class="mx-1.5 text-[#4D7EA8]/50">•</span>
          <span class="font-medium text-slate-700 dark:text-[#cbd5e1]">{{
            accountName || 'Cuenta Principal'
          }}</span>
          <span
            v-if="destinationAccountName"
            class="text-slate-500 dark:text-[#94a3b8]"
          >
            ➔ {{ destinationAccountName }}
          </span>
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 dark:border-[#283a59]/60 pt-2 sm:border-0 sm:pt-0"
    >
      <div class="flex flex-col items-end text-right">
        <span
          class="text-base font-black tracking-tight"
          :class="currentConfig.amountClass"
        >
          {{ formattedAmount }}
        </span>
        <span
          v-if="isCrossCurrencyTransfer"
          class="text-xs font-semibold text-emerald-500 dark:text-emerald-400"
        >
          ➔ {{ formattedDestinationAmount }}
        </span>
        <span
          v-else-if="transaction.exchangeRate"
          class="text-[10px] font-medium text-slate-400 dark:text-slate-500"
        >
          Tasa: {{ transaction.exchangeRate }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-pencil-square"
          aria-label="Editar movimiento"
          class="text-slate-400 hover:text-primary-500"
          @click="emit('edit', transaction)"
        />
        <UButton
          v-if="canDelete"
          color="error"
          variant="ghost"
          size="xs"
          icon="i-heroicons-trash"
          aria-label="Eliminar movimiento"
          @click="handleDelete"
        />
      </div>
    </div>
  </article>
</template>
