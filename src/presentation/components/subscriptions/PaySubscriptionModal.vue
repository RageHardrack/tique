<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Account } from '../../../core/entities/Account';
import type { Subscription } from '../../../core/entities/Subscription';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import { useExchangeRateStore } from '../../store/exchange-rates';
import SearchableSelect from '../base/SearchableSelect.vue';

interface Props {
  open: boolean;
  subscription: Subscription | null;
  accounts: Account[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (
    e: 'pay',
    payload: {
      id: string;
      debitedAmount?: number;
      exchangeRate?: number;
      destinationAmount?: number;
      accountId?: string;
      paymentDate?: string;
      note?: string;
    },
  ): void;
}>();

const rateStore = useExchangeRateStore();

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const today = DateFormatter.toInputDate();
const selectedAccountId = ref('');
const paymentDate = ref(today);
const debitedAmount = ref<number | null>(null);
const customNote = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const selectedAccount = computed(() => {
  return props.accounts.find((a) => a.id === selectedAccountId.value);
});

const isCrossCurrency = computed(() => {
  if (!props.subscription || !selectedAccount.value) return false;
  return props.subscription.currency !== selectedAccount.value.currency;
});

const accountCurrency = computed(() => selectedAccount.value?.currency || 'USD');
const subscriptionCurrency = computed(
  () => props.subscription?.currency || 'USD',
);

const accountOptions = computed(() => {
  return props.accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.currency}) - Saldo: ${CurrencyFormatter.format(acc.balance, acc.currency)}`,
  }));
});

// Calculate implicit exchange rate (Account Currency per 1 Subscription Currency, e.g. 3.25 PEN/USD)
const calculatedExchangeRate = computed(() => {
  if (
    !isCrossCurrency.value ||
    !debitedAmount.value ||
    !props.subscription?.amount ||
    props.subscription.amount <= 0
  ) {
    return null;
  }
  const rate = debitedAmount.value / props.subscription.amount;
  return Math.round(rate * 10000) / 10000;
});

function syncDefaults() {
  if (!props.subscription) return;

  selectedAccountId.value = props.subscription.accountId;
  paymentDate.value = DateFormatter.toInputDate();
  errorMessage.value = null;

  const targetAccount = props.accounts.find(
    (a) => a.id === props.subscription?.accountId,
  );
  const isDiff =
    targetAccount && targetAccount.currency !== props.subscription.currency;

  if (isDiff && targetAccount) {
    const converted = rateStore.convert(
      props.subscription.amount,
      props.subscription.currency,
      targetAccount.currency,
    );
    debitedAmount.value = Math.round(converted * 100) / 100;
    const rate = debitedAmount.value / props.subscription.amount;
    const formattedSub = CurrencyFormatter.format(
      props.subscription.amount,
      props.subscription.currency,
    );
    customNote.value = `Pago recurrente: ${props.subscription.name} (${formattedSub} @ ${Math.round(rate * 10000) / 10000})`;
  } else {
    debitedAmount.value = props.subscription.amount;
    customNote.value = `Pago recurrente: ${props.subscription.name}`;
  }
}

watch(
  () => props.open,
  (newOpen) => {
    if (newOpen) {
      syncDefaults();
    }
  },
  { immediate: true },
);

watch(
  () => selectedAccountId.value,
  (newAccId) => {
    if (!props.subscription || !props.open) return;
    const targetAccount = props.accounts.find((a) => a.id === newAccId);
    if (!targetAccount) return;

    if (targetAccount.currency !== props.subscription.currency) {
      const converted = rateStore.convert(
        props.subscription.amount,
        props.subscription.currency,
        targetAccount.currency,
      );
      debitedAmount.value = Math.round(converted * 100) / 100;
      const rate = debitedAmount.value / props.subscription.amount;
      const formattedSub = CurrencyFormatter.format(
        props.subscription.amount,
        props.subscription.currency,
      );
      customNote.value = `Pago recurrente: ${props.subscription.name} (${formattedSub} @ ${Math.round(rate * 10000) / 10000})`;
    } else {
      debitedAmount.value = props.subscription.amount;
      customNote.value = `Pago recurrente: ${props.subscription.name}`;
    }
  },
);

function handleAmountInput() {
  if (!props.subscription) return;
  if (isCrossCurrency.value && calculatedExchangeRate.value) {
    const formattedSub = CurrencyFormatter.format(
      props.subscription.amount,
      props.subscription.currency,
    );
    customNote.value = `Pago recurrente: ${props.subscription.name} (${formattedSub} @ ${calculatedExchangeRate.value})`;
  }
}

async function handleSubmit() {
  if (!props.subscription) return;
  if (!debitedAmount.value || debitedAmount.value <= 0) {
    errorMessage.value = 'El monto debitado debe ser mayor a 0.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    emit('pay', {
      id: props.subscription.id,
      debitedAmount: debitedAmount.value,
      exchangeRate: isCrossCurrency.value
        ? calculatedExchangeRate.value ?? undefined
        : undefined,
      destinationAmount: isCrossCurrency.value
        ? props.subscription.amount
        : undefined,
      accountId: selectedAccountId.value || props.subscription.accountId,
      paymentDate: paymentDate.value
        ? new Date(paymentDate.value).toISOString()
        : undefined,
      note: customNote.value || undefined,
    });
    isOpen.value = false;
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al procesar el pago.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :dismissible="false">
    <template #content>
      <div
        class="p-6 bg-white dark:bg-[#162032] text-slate-900 dark:text-[#f1f5f9] rounded-2xl border border-slate-200 dark:border-[#283a59]"
      >
        <header
          class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <UIcon name="i-heroicons-check-badge" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-[#f1f5f9]">
                Registrar Pago de Suscripción
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
                Confirma o ajusta el cobro real antes de debitar el balance
              </p>
            </div>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="xs"
            @click="isOpen = false"
          />
        </header>

        <!-- Subscription Snapshot Card -->
        <div
          v-if="subscription"
          class="mb-4 p-3.5 rounded-xl border border-slate-200/80 dark:border-[#283a59] bg-slate-50/60 dark:bg-[#0f1523]/80 flex items-center justify-between"
        >
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400 block"
              >Servicio a liquidar</span
            >
            <span class="text-sm font-bold text-slate-900 dark:text-white">
              {{ subscription.name }}
            </span>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-500 dark:text-slate-400 block"
              >Monto nominal</span
            >
            <span
              class="text-sm font-black text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md"
            >
              {{
                CurrencyFormatter.format(
                  subscription.amount,
                  subscription.currency,
                )
              }}
            </span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Account Selection -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Cuenta de cargo
            </label>
            <SearchableSelect
              v-model="selectedAccountId"
              :items="accountOptions"
              placeholder="Seleccionar cuenta de débito"
            />
          </div>

          <!-- Payment Date & Real Debited Amount -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Fecha de Pago
              </label>
              <UInput
                v-model="paymentDate"
                type="date"
                required
                class="w-full"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Monto debitado real ({{ accountCurrency }})
              </label>
              <UInput
                v-model.number="debitedAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                class="w-full"
                @input="handleAmountInput"
              />
            </div>
          </div>

          <!-- Cross Currency Conversion Preview Banner -->
          <div
            v-if="isCrossCurrency"
            class="p-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 text-xs space-y-1.5"
          >
            <div class="flex items-center justify-between text-sky-800 dark:text-sky-300 font-semibold">
              <span class="flex items-center gap-1">
                <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
                Conversión Multimoneda
              </span>
              <span v-if="calculatedExchangeRate" class="font-bold">
                1 {{ subscriptionCurrency }} = {{ calculatedExchangeRate }} {{ accountCurrency }}
              </span>
            </div>
            <p class="text-[11px] text-sky-700/80 dark:text-sky-400">
              Se debitarán exactamente
              <strong class="font-bold text-sky-900 dark:text-sky-200">
                {{ CurrencyFormatter.format(debitedAmount || 0, accountCurrency) }}
              </strong>
              de la cuenta, liquidando el compromiso nominal de
              <strong class="font-bold text-sky-900 dark:text-sky-200">
                {{ CurrencyFormatter.format(subscription?.amount || 0, subscriptionCurrency) }}
              </strong>.
            </p>
          </div>

          <!-- Movement Note -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nota del movimiento
            </label>
            <UInput
              v-model="customNote"
              type="text"
              placeholder="Descripción en el historial de transacciones"
              class="w-full"
            />
          </div>

          <!-- Error Message Banner -->
          <div
            v-if="errorMessage"
            class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-1.5"
          >
            <UIcon name="i-heroicons-exclamation-circle" class="h-4 w-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#283a59]/60">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              @click="isOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              size="sm"
              :loading="isSubmitting"
              icon="i-heroicons-check"
            >
              Registrar Pago
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
