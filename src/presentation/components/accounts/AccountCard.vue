<script setup lang="ts">
import { computed } from 'vue';

import type { Account, AccountType } from '../../../core/entities/Account';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  account: Account;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'edit', account: Account): void;
  (e: 'delete', id: string): void;
}>();

const accountTypeConfig: Record<
  AccountType,
  {
    label: string;
    color: 'primary' | 'success' | 'warning' | 'neutral' | 'info';
    icon: string;
  }
> = {
  CHECKING: {
    label: 'Corriente',
    color: 'primary',
    icon: 'i-heroicons-banknotes',
  },
  SAVINGS: {
    label: 'Ahorros',
    color: 'success',
    icon: 'i-heroicons-building-library',
  },
  CREDIT_CARD: {
    label: 'Crédito',
    color: 'warning',
    icon: 'i-heroicons-credit-card',
  },
  CASH: {
    label: 'Efectivo',
    color: 'neutral',
    icon: 'i-heroicons-wallet',
  },
  WALLET: {
    label: 'Billetera Digital',
    color: 'info',
    icon: 'i-heroicons-qr-code',
  },
  INVESTMENT: {
    label: 'Inversión',
    color: 'info',
    icon: 'i-heroicons-chart-bar',
  },
};

const currentType = computed(() => {
  return (
    accountTypeConfig[props.account.type] || {
      label: props.account.type,
      color: 'neutral',
      icon: 'i-heroicons-circle-stack',
    }
  );
});

const formattedBalance = computed(() => {
  return CurrencyFormatter.format(
    props.account.balance || 0,
    props.account.currency || 'USD',
  );
});

function handleDelete() {
  if (confirm(`¿Estás seguro de eliminar la cuenta "${props.account.name}"?`)) {
    emit('delete', props.account.id);
  }
}
</script>

<template>
  <article
    class="rounded-xl border border-slate-200 dark:border-[#283a59]/80 bg-white dark:bg-[#162032]/90 p-5 shadow-sm transition-all hover:border-[#4D7EA8]/60 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-[#1a263c]"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          {{ account.name }}
        </h3>
        <UBadge
          :color="currentType.color"
          variant="subtle"
          size="sm"
          class="font-medium"
        >
          <UIcon :name="currentType.icon" class="mr-1 h-3.5 w-3.5" />
          {{ currentType.label }}
        </UBadge>
      </div>

      <div class="flex items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-pencil-square"
          aria-label="Editar cuenta"
          class="text-slate-400 hover:text-primary-500"
          @click="emit('edit', account)"
        />
        <UButton
          color="error"
          variant="ghost"
          size="xs"
          icon="i-heroicons-trash"
          aria-label="Eliminar cuenta"
          @click="handleDelete"
        />
      </div>
    </header>

    <div class="mt-4 pt-3 border-t border-slate-100 dark:border-[#283a59]/60">
      <span
        class="text-xs uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]"
        >Saldo Disponible</span
      >
      <p
        class="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5"
      >
        {{ formattedBalance }}
      </p>
    </div>
  </article>
</template>
