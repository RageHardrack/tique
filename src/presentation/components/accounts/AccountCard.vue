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

import { InstallmentCalculatorService } from '../../../core/services/InstallmentCalculatorService';

const creditSummary = computed(() => {
  if (props.account.type !== 'CREDIT_CARD') return null;
  return InstallmentCalculatorService.calculateCreditCardSummary({
    creditLimit: props.account.creditLimit || 1000,
    currentDebt: props.account.balance || 0,
    monthlyInterestRatePercent: props.account.monthlyInterestRate || 4.5,
  });
});

function format(val: number, curr?: string) {
  return CurrencyFormatter.format(val, curr || 'USD');
}

const formattedBalance = computed(() => {
  return CurrencyFormatter.format(
    props.account.balance || 0,
    props.account.currency || 'USD',
  );
});

function handleDelete() {
  emit('delete', props.account.id);
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

    <!-- Standard Account Balance -->
    <div v-if="account.type !== 'CREDIT_CARD'" class="mt-4 pt-3 border-t border-slate-100 dark:border-[#283a59]/60 min-w-0">
      <span
        class="text-xs uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]"
        >Saldo Disponible</span
      >
      <p
        class="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5 truncate"
        :title="formattedBalance"
      >
        {{ formattedBalance }}
      </p>
    </div>

    <!-- Credit Card Account Breakdown -->
    <div v-else class="mt-4 pt-3 border-t border-slate-100 dark:border-[#283a59]/60 min-w-0 space-y-2.5">
      <div class="flex items-baseline justify-between gap-2">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-rose-500">Deuda Consumida</span>
          <p class="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 truncate" :title="formattedBalance">
            {{ formattedBalance }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Línea Disponible</span>
          <p class="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {{ format(creditSummary?.availableCredit || 0, account.currency) }}
          </p>
        </div>
      </div>

      <!-- Utilization Bar -->
      <div class="space-y-1">
        <div class="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Uso de línea</span>
          <span>{{ creditSummary?.utilizationPercentage }}% (Límite: {{ format(account.creditLimit || 1000, account.currency) }})</span>
        </div>
        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="[
              (creditSummary?.utilizationPercentage || 0) > 75
                ? 'bg-rose-500'
                : (creditSummary?.utilizationPercentage || 0) > 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500',
            ]"
            :style="{ width: `${Math.min(100, creditSummary?.utilizationPercentage || 0)}%` }"
          />
        </div>
      </div>

      <!-- Payment & Statement Dates info -->
      <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-[#283a59]/40">
        <span>Corte: día {{ account.statementClosingDay || 15 }}</span>
        <span>Pago: día {{ account.paymentDueDay || 5 }}</span>
        <span v-if="(creditSummary?.estimatedMinPayment || 0) > 0" class="font-semibold text-amber-500">
          Mínimo: {{ format(creditSummary?.estimatedMinPayment || 0, account.currency) }}
        </span>
      </div>
    </div>
  </article>
</template>
