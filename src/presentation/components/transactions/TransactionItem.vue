<script setup lang="ts">
import { computed } from 'vue';

import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
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
}

const props = defineProps<Props>();

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

const formattedAmount = computed(() => {
  const formatted = CurrencyFormatter.format(
    props.transaction.amount,
    props.accountCurrency || 'USD',
  );

  return `${currentConfig.value.prefix} ${formatted}`;
});

const formattedDate = computed(() => {
  if (!props.transaction.date) return '';
  const d = new Date(props.transaction.date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
});

function handleDelete() {
  if (confirm('¿Estás seguro de eliminar este movimiento?')) {
    emit('delete', props.transaction.id);
  }
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
      <span
        class="text-base font-black tracking-tight"
        :class="currentConfig.amountClass"
      >
        {{ formattedAmount }}
      </span>

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
